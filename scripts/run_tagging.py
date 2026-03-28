"""전체 장소의 리뷰를 분석하여 place_tags 테이블에 태그 저장"""
from sqlalchemy import func

from backend.database import SessionLocal
from backend.models.place import Place, PlaceReview, PlaceTag
from analyzer.tagger import PlaceTagger


def main() -> None:
    db = SessionLocal()
    tagger = PlaceTagger()

    places = db.query(Place).all()
    print(f"태깅 대상 장소: {len(places)}건")

    tagged_count = 0
    for i, place in enumerate(places):
        reviews = db.query(PlaceReview).filter_by(place_id=place.id).all()
        if not reviews:
            continue

        texts = [r.review_text for r in reviews]
        tags = tagger.tag_reviews(texts)

        for tag_name, confidence in tags.items():
            # 기존 태그 업데이트 또는 신규 생성
            existing = db.query(PlaceTag).filter_by(
                place_id=place.id, tag=tag_name
            ).first()
            if existing:
                existing.confidence = confidence
                existing.source_count = len(reviews)
            else:
                db.add(PlaceTag(
                    place_id=place.id,
                    tag=tag_name,
                    confidence=confidence,
                    source_count=len(reviews),
                ))
                tagged_count += 1

        if (i + 1) % 100 == 0:
            db.commit()
            print(f"  {i + 1}/{len(places)} 처리")

    db.commit()
    print(f"\n완료: {tagged_count}건 태그 생성")

    # 결과 확인
    stats = db.query(PlaceTag.tag, func.count()).group_by(PlaceTag.tag).all()
    print("\n[태그 분포]")
    for tag, cnt in sorted(stats, key=lambda x: -x[1]):
        print(f"  {tag}: {cnt}건")

    db.close()


if __name__ == "__main__":
    main()
