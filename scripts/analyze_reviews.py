"""장소 리뷰 감성 분석 스크립트"""
from backend.database import SessionLocal
from backend.models.place import PlaceReview
from analyzer.preprocessor import TextPreprocessor
from analyzer.sentiment import SentimentAnalyzer


def main():
    db = SessionLocal()
    preprocessor = TextPreprocessor()
    analyzer = SentimentAnalyzer()

    reviews = db.query(PlaceReview).filter(PlaceReview.sentiment.is_(None)).all()
    total = len(reviews)
    print(f"미분석 리뷰: {total}건")

    updated = 0
    for i, review in enumerate(reviews):
        cleaned = preprocessor.clean(review.review_text)
        if not cleaned:
            continue

        result = analyzer.analyze(cleaned)
        review.sentiment = result["sentiment"]
        review.sentiment_score = result["sentiment_score"]
        updated += 1

        if (i + 1) % 200 == 0:
            db.commit()
            print(f"  {i + 1}/{total} 처리 ({updated}건 분석)")

    db.commit()
    print(f"\n완료: {total}건 중 {updated}건 분석됨")

    from sqlalchemy import func
    stats = db.query(PlaceReview.sentiment, func.count()).filter(
        PlaceReview.sentiment.isnot(None)
    ).group_by(PlaceReview.sentiment).all()
    print("\n[리뷰 감성 분포]")
    for s, c in stats:
        print(f"  {s}: {c}건")

    db.close()


if __name__ == "__main__":
    main()
