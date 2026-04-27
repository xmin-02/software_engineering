"""기존 place_reviews 중 매장과 무관한 리뷰를 식별·삭제.

dry-run 기본. 실제 삭제하려면 --apply 옵션을 주어 실행.

검사 기준 (BlogReviewCrawler._is_clearly_irrelevant — 보수적):
- 매장 풀네임도 핵심 키워드도 본문에 없음
- AND 미용실/병원/네일 등 카테고리 미스매치 단어가 있음
정상 리뷰가 줄임말·받침 차이 등으로 잘못 삭제되는 것을 막기 위한 보수적 기준.
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal  # noqa: E402
from backend.models.place import Place, PlaceReview  # noqa: E402
from crawler.places.blog_review import BlogReviewCrawler  # noqa: E402


def main(apply: bool = False, sample: int = 20) -> None:
    db = SessionLocal()
    crawler = BlogReviewCrawler.__new__(BlogReviewCrawler)
    try:
        places = {p.id: p for p in db.query(Place).all()}
        reviews = db.query(PlaceReview).all()

        to_delete = []
        for r in reviews:
            place = places.get(r.place_id)
            if place is None:
                continue
            if crawler._is_clearly_irrelevant(
                "", r.review_text or "", place.name, place.address
            ):
                to_delete.append((r, place))

        print(f"검사: {len(reviews)}건, 삭제 대상: {len(to_delete)}건")
        for r, place in to_delete[:sample]:
            text = (r.review_text or "").replace("\n", " ")[:140]
            print(f"  [rid={r.id}] place=({place.id}){place.name}")
            print(f"    url : {r.review_url}")
            print(f"    text: {text}")

        if not apply:
            print("\n--apply 옵션 없이 실행됨 (dry-run).")
            return

        for r, _ in to_delete:
            db.delete(r)
        db.commit()
        print(f"\n삭제 완료: {len(to_delete)}건")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="실제 삭제 실행")
    parser.add_argument("--sample", type=int, default=20, help="미리보기 샘플 수")
    args = parser.parse_args()
    main(apply=args.apply, sample=args.sample)
