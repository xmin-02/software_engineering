"""기존 분석 데이터의 감성을 재분석하는 스크립트"""
from backend.database import SessionLocal
from backend.models.post import Post
from backend.models.analysis import Analysis
from analyzer.preprocessor import TextPreprocessor
from analyzer.sentiment import SentimentAnalyzer

def main():
    db = SessionLocal()
    preprocessor = TextPreprocessor()
    analyzer = SentimentAnalyzer()

    rows = db.query(Analysis).join(Post).all()
    total = len(rows)
    print(f"재분석 대상: {total}건")

    updated = 0
    for i, analysis in enumerate(rows):
        cleaned = preprocessor.clean(analysis.post.content)
        if not cleaned:
            continue

        result = analyzer.analyze(cleaned)
        if analysis.sentiment != result["sentiment"]:
            analysis.sentiment = result["sentiment"]
            analysis.emotion = result["emotion"]
            analysis.sentiment_score = result["sentiment_score"]
            updated += 1

        if (i + 1) % 500 == 0:
            db.commit()
            print(f"  {i + 1}/{total} 처리 ({updated}건 변경)")

    db.commit()
    print(f"\n완료: {total}건 중 {updated}건 변경됨")

    # 결과 확인
    from sqlalchemy import func
    stats = db.query(Analysis.sentiment, func.count()).group_by(Analysis.sentiment).all()
    print("\n[재분석 후 감성 분포]")
    for sentiment, count in stats:
        print(f"  {sentiment}: {count}건")

    db.close()

if __name__ == "__main__":
    main()
