"""중복 등록된 Place를 탐지·통합.

같은 매장이 크롤러가 두 번 수집해 별도 row가 된 케이스가 다수 발견됨
(예: "프럼브릿지 천안신부점" id=9 vs "프럼브릿지" id=99 — 같은 신부동 457-4).

탐지 규칙:
1) name 정규화 동일 + address 정규화 동일 → AUTO 후보
2) address 정규화 동일 + name이 한 쪽이 다른 쪽의 prefix → AUTO 후보
3) 그 외(번지 다름, 동 다름)는 MANUAL 보고

병합 시 살리는 쪽(survivor) 결정 우선순위:
- 카테고리가 더 구체적인 쪽 (specific > generic="음식점")
- 리뷰 수 많은 쪽
- id가 작은 쪽

병합 동작:
- 다른 place의 review_url을 검사해 survivor에 중복되지 않는 PlaceReview는 옮김
- PlaceTag도 합산 후 중복 tag는 한 줄로(source_count 합산)
- 잉여 Place 삭제 (cascade로 잔여 리뷰/태그 정리)

dry-run 기본. 실제 처리는 --apply.
"""

import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import func  # noqa: E402

from backend.database import SessionLocal  # noqa: E402
from backend.models.place import Place, PlaceReview, PlaceTag  # noqa: E402


GENERIC_CATEGORIES = {"음식점", "식품판매", None, ""}


def _norm_name(s: str | None) -> str:
    return re.sub(r"\s+", "", (s or "").strip().lower())


def _norm_address(s: str | None) -> str:
    """주소 정규화: 충청남도→충남, 부가설명 제거, 공백 정리, 번지 단위까지."""
    if not s:
        return ""
    a = s.strip()
    a = a.replace("충청남도", "충남")
    # 마지막 행정단위(동/읍/면/리/로/길) + 번지까지만 남기고 그 뒤(건물명/층 등)는 제거.
    # lazy 매칭이라 마지막 만족 가능한 행정단위까지 자동 확장.
    m = re.search(r"^(.*?[가-힣]+(?:동|읍|면|리|로|길)\s+\d+(?:-\d+)?)\b", a)
    if m:
        a = m.group(1)
    a = re.sub(r"\s+", " ", a)
    return a.lower()


def _is_prefix_match(a: str, b: str) -> bool:
    """둘 중 하나가 다른 쪽의 prefix(공백 무시)."""
    na, nb = _norm_name(a), _norm_name(b)
    if not na or not nb:
        return False
    return na.startswith(nb) or nb.startswith(na)


def _survivor(places: list[Place], review_counts: dict[int, int]) -> Place:
    """그룹에서 살릴 row 선택."""
    def key(p: Place):
        is_generic = p.category in GENERIC_CATEGORIES
        return (
            1 if is_generic else 0,                  # generic이면 후순위
            -review_counts.get(p.id, 0),             # 리뷰 많을수록 우선
            p.id,                                    # id 작을수록 우선
        )
    return sorted(places, key=key)[0]


def _classify_groups(places: list[Place]) -> tuple[list, list]:
    """AUTO 그룹과 MANUAL 그룹을 분리."""
    # (norm_name, norm_addr) 동시 일치
    by_pair = defaultdict(list)
    for p in places:
        by_pair[(_norm_name(p.name), _norm_address(p.address))].append(p)

    auto_groups = [v for v in by_pair.values() if len(v) > 1]
    seen_ids = {p.id for g in auto_groups for p in g}

    # 같은 주소이고 이름이 prefix 관계 → AUTO 추가
    by_addr = defaultdict(list)
    for p in places:
        if p.id in seen_ids:
            continue
        by_addr[_norm_address(p.address)].append(p)

    prefix_groups = []
    for addr, lst in by_addr.items():
        if len(lst) < 2 or not addr:
            continue
        # 같은 주소 안에서 prefix 관계로 클러스터링
        used = set()
        for i, a in enumerate(lst):
            if a.id in used:
                continue
            cluster = [a]
            for b in lst[i + 1:]:
                if b.id in used:
                    continue
                if _is_prefix_match(a.name, b.name):
                    cluster.append(b)
                    used.add(b.id)
            if len(cluster) > 1:
                used.add(a.id)
                prefix_groups.append(cluster)

    auto_groups.extend(prefix_groups)
    seen_ids = {p.id for g in auto_groups for p in g}

    # 같은 이름이지만 주소 정규화가 달라 AUTO에 못 들어간 케이스 → MANUAL
    by_name = defaultdict(list)
    for p in places:
        if p.id in seen_ids:
            continue
        by_name[_norm_name(p.name)].append(p)
    manual_groups = [v for v in by_name.values() if len(v) > 1]

    return auto_groups, manual_groups


def _merge(db, survivor: Place, others: list[Place]) -> tuple[int, int]:
    """others의 리뷰/태그를 survivor로 옮기고 others 삭제."""
    moved_reviews = 0
    moved_tags = 0

    survivor_review_urls = {
        r.review_url
        for r in db.query(PlaceReview).filter(PlaceReview.place_id == survivor.id).all()
        if r.review_url
    }
    survivor_tags = {
        t.tag: t for t in db.query(PlaceTag).filter(PlaceTag.place_id == survivor.id).all()
    }

    for o in others:
        # 리뷰 이동 (URL 중복은 삭제)
        for r in db.query(PlaceReview).filter(PlaceReview.place_id == o.id).all():
            if r.review_url and r.review_url in survivor_review_urls:
                db.delete(r)
                continue
            r.place_id = survivor.id
            if r.review_url:
                survivor_review_urls.add(r.review_url)
            moved_reviews += 1

        # 태그 합산
        for t in db.query(PlaceTag).filter(PlaceTag.place_id == o.id).all():
            if t.tag in survivor_tags:
                survivor_tags[t.tag].source_count += t.source_count
                db.delete(t)
            else:
                t.place_id = survivor.id
                survivor_tags[t.tag] = t
                moved_tags += 1

        db.delete(o)

    return moved_reviews, moved_tags


def main(apply: bool = False) -> None:
    db = SessionLocal()
    try:
        places = db.query(Place).all()
        review_counts = dict(
            db.query(PlaceReview.place_id, func.count())
            .group_by(PlaceReview.place_id)
            .all()
        )

        auto_groups, manual_groups = _classify_groups(places)

        print(f"전체 Place: {len(places)}")
        print(f"AUTO 병합 그룹: {len(auto_groups)} (잉여 {sum(len(g) - 1 for g in auto_groups)})")
        print(f"MANUAL 확인 그룹: {len(manual_groups)} (잉여 {sum(len(g) - 1 for g in manual_groups)})")

        if auto_groups:
            print("\n[AUTO 후보]")
            for g in auto_groups:
                survivor = _survivor(g, review_counts)
                print(f"  survivor id={survivor.id} ({survivor.category}) {survivor.name!r} @ {survivor.address!r}")
                for o in g:
                    if o.id == survivor.id:
                        continue
                    print(f"    drop  id={o.id} ({o.category}) {o.name!r} @ {o.address!r} (reviews={review_counts.get(o.id, 0)})")

        if manual_groups:
            print("\n[MANUAL — 같은 이름인데 주소가 다르므로 확인 필요. 자동 처리 X]")
            for g in manual_groups:
                print(f"  group:")
                for p in g:
                    print(f"    id={p.id} ({p.category}) {p.name!r} @ {p.address!r} (reviews={review_counts.get(p.id, 0)})")

        if not apply:
            print("\ndry-run (--apply 옵션 없이 실행됨)")
            return

        if not auto_groups:
            print("\n자동 처리할 그룹이 없습니다.")
            return

        total_moved_reviews = 0
        total_moved_tags = 0
        total_dropped = 0
        for g in auto_groups:
            survivor = _survivor(g, review_counts)
            others = [p for p in g if p.id != survivor.id]
            mr, mt = _merge(db, survivor, others)
            total_moved_reviews += mr
            total_moved_tags += mt
            total_dropped += len(others)

        db.commit()
        print(f"\n병합 완료: drop {total_dropped}개 Place, reviews 이동 {total_moved_reviews}건, tags 이동 {total_moved_tags}건")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="실제 병합 수행")
    args = parser.parse_args()
    main(apply=args.apply)
