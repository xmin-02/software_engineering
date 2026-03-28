"""주간 AI 요약 생성 스크립트"""
from datetime import date, timedelta

from sqlalchemy import func

from backend.database import SessionLocal
from backend.models.post import Post
from backend.models.analysis import Analysis
from backend.models.content import WeeklySummary
from analyzer.summarizer import TextSummarizer


def main():
    db = SessionLocal()
    summarizer = TextSummarizer()

    week_end = date.today()
    week_start = week_end - timedelta(days=7)

    # 중복 체크
    exists = db.query(WeeklySummary).filter_by(week_start=week_start).first()
    if exists:
        print(f"이미 {week_start}~{week_end} 요약이 존재합니다.")
        db.close()
        return

    # 주간 게시글 수집 (천안 관련만)
    posts = (
        db.query(Post)
        .filter(Post.published_at >= week_start, Post.published_at <= week_end)
        .filter(Post.title.ilike("%천안%"))
        .order_by(Post.published_at.desc())
        .limit(50)
        .all()
    )
    print(f"주간 게시글: {len(posts)}건")

    if not posts:
        print("요약할 게시글이 없습니다.")
        db.close()
        return

    # 감성 통계
    stats = (
        db.query(Analysis.sentiment, func.count())
        .join(Post)
        .filter(Post.published_at >= week_start, Post.published_at <= week_end)
        .group_by(Analysis.sentiment)
        .all()
    )
    stats_dict = {s: c for s, c in stats}
    total = sum(stats_dict.values())

    # 토픽 통계
    top_topics = (
        db.query(Analysis.topic, func.count().label("cnt"))
        .join(Post)
        .filter(
            Post.published_at >= week_start,
            Post.published_at <= week_end,
            Analysis.topic.isnot(None),
            Analysis.topic != "기타",
        )
        .group_by(Analysis.topic)
        .order_by(func.count().desc())
        .limit(5)
        .all()
    )

    context = f"""기간: {week_start} ~ {week_end}
총 게시글: {total}건
감성 분포: 긍정 {stats_dict.get('positive', 0)}건, 부정 {stats_dict.get('negative', 0)}건, 중립 {stats_dict.get('neutral', 0)}건
주요 토픽: {', '.join(t.topic for t in top_topics)}"""

    texts = [f"[{p.source}] {p.title or ''}: {p.content[:200]}" for p in posts]

    print("요약 생성 중... (Qwen2.5:32b)")
    summary_text = summarizer.summarize(texts, context)
    print(f"요약 결과:\n{summary_text}\n")

    # DB 저장
    weekly = WeeklySummary(
        week_start=week_start,
        week_end=week_end,
        summary=summary_text,
        top_topics=[t.topic for t in top_topics],
        total_posts=total,
        sentiment_ratio=stats_dict,
    )
    db.add(weekly)
    db.commit()
    print("DB 저장 완료!")
    db.close()


if __name__ == "__main__":
    main()
