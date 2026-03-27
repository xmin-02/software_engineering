from datetime import date, timedelta

from sqlalchemy import func, case, extract
from sqlalchemy.orm import Session

from backend.models.post import Post
from backend.models.analysis import Analysis
from backend.models.content import WeeklySummary


def get_posts(
    db: Session,
    source: str | None = None,
    sentiment: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """게시글 목록 + 분석 결과 조회"""
    query = db.query(Post, Analysis).outerjoin(
        Analysis, Post.id == Analysis.post_id
    )

    if source:
        query = query.filter(Post.source == source)
    if sentiment:
        query = query.filter(Analysis.sentiment == sentiment)
    if date_from:
        query = query.filter(Post.published_at >= date_from)
    if date_to:
        query = query.filter(Post.published_at <= date_to)

    total = query.count()
    rows = query.order_by(Post.published_at.desc()).offset(offset).limit(limit).all()

    items = []
    for post, analysis in rows:
        item = {
            "id": post.id,
            "source": post.source,
            "title": post.title,
            "content": post.content,
            "author": post.author,
            "url": post.url,
            "published_at": post.published_at,
            "sentiment": analysis.sentiment if analysis else None,
            "sentiment_score": analysis.sentiment_score if analysis else None,
            "topic": analysis.topic if analysis else None,
            "keywords": analysis.keywords if analysis else None,
        }
        items.append(item)

    return items, total


def get_sentiment_stats(
    db: Session,
    source: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    """감성 분포 통계"""
    query = db.query(
        func.count(case((Analysis.sentiment == "positive", 1))).label("positive"),
        func.count(case((Analysis.sentiment == "negative", 1))).label("negative"),
        func.count(case((Analysis.sentiment == "neutral", 1))).label("neutral"),
        func.count(Analysis.id).label("total"),
    )

    if source:
        query = query.join(Post, Analysis.post_id == Post.id).filter(
            Post.source == source
        )
    if date_from:
        if not source:
            query = query.join(Post, Analysis.post_id == Post.id)
        query = query.filter(Post.published_at >= date_from)
    if date_to:
        query = query.filter(Post.published_at <= date_to)

    row = query.one()
    return {
        "positive": row.positive,
        "negative": row.negative,
        "neutral": row.neutral,
        "total": row.total,
    }


def get_trend(
    db: Session,
    interval: str = "daily",
    source: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict]:
    """감성 트렌드 (일별/주별)"""
    if interval == "weekly":
        date_col = func.date_trunc("week", Post.published_at).label("period")
    else:
        date_col = func.date(Post.published_at).label("period")

    query = (
        db.query(
            date_col,
            func.count(case((Analysis.sentiment == "positive", 1))).label("positive"),
            func.count(case((Analysis.sentiment == "negative", 1))).label("negative"),
            func.count(case((Analysis.sentiment == "neutral", 1))).label("neutral"),
        )
        .join(Post, Analysis.post_id == Post.id)
        .group_by("period")
        .order_by("period")
    )

    if source:
        query = query.filter(Post.source == source)
    if date_from:
        query = query.filter(Post.published_at >= date_from)
    if date_to:
        query = query.filter(Post.published_at <= date_to)

    return [
        {
            "date": row.period,
            "positive": row.positive,
            "negative": row.negative,
            "neutral": row.neutral,
        }
        for row in query.all()
    ]


def get_source_stats(db: Session) -> list[dict]:
    """소스별 감성 비교"""
    rows = (
        db.query(
            Post.source,
            func.count(case((Analysis.sentiment == "positive", 1))).label("positive"),
            func.count(case((Analysis.sentiment == "negative", 1))).label("negative"),
            func.count(case((Analysis.sentiment == "neutral", 1))).label("neutral"),
        )
        .join(Analysis, Post.id == Analysis.post_id)
        .group_by(Post.source)
        .all()
    )

    return [
        {
            "source": row.source,
            "positive": row.positive,
            "negative": row.negative,
            "neutral": row.neutral,
        }
        for row in rows
    ]


def get_topics(db: Session, period: str = "today") -> list[dict]:
    """토픽 목록 (오늘/주간)"""
    query = db.query(
        Analysis.topic,
        func.count(Analysis.id).label("post_count"),
    ).filter(Analysis.topic.isnot(None))

    query = query.join(Post, Analysis.post_id == Post.id)

    if period == "today":
        query = query.filter(func.date(Post.published_at) == date.today())
    elif period == "weekly":
        week_ago = date.today() - timedelta(days=7)
        query = query.filter(Post.published_at >= week_ago)

    rows = query.group_by(Analysis.topic).order_by(func.count(Analysis.id).desc()).all()

    # 토픽별 키워드를 별도 쿼리로 수집
    result = []
    for idx, row in enumerate(rows):
        kw_rows = (
            db.query(func.unnest(Analysis.keywords).label("kw"))
            .filter(Analysis.topic == row.topic, Analysis.keywords.isnot(None))
            .subquery()
        )
        top_kws = (
            db.query(kw_rows.c.kw, func.count().label("cnt"))
            .group_by(kw_rows.c.kw)
            .order_by(func.count().desc())
            .limit(5)
            .all()
        )
        result.append({
            "id": idx + 1,
            "name": row.topic,
            "keywords": [k.kw for k in top_kws],
            "post_count": row.post_count,
        })

    return result


def get_posts_by_topic(db: Session, topic_name: str) -> list[dict]:
    """토픽별 게시글"""
    rows = (
        db.query(Post, Analysis)
        .join(Analysis, Post.id == Analysis.post_id)
        .filter(Analysis.topic == topic_name)
        .order_by(Post.published_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": post.id,
            "source": post.source,
            "title": post.title,
            "content": post.content,
            "author": post.author,
            "url": post.url,
            "published_at": post.published_at,
            "sentiment": analysis.sentiment,
            "sentiment_score": analysis.sentiment_score,
            "topic": analysis.topic,
            "keywords": analysis.keywords,
        }
        for post, analysis in rows
    ]


def get_keyword_frequencies(db: Session, limit: int = 50) -> list[dict]:
    """키워드 빈도 집계 (ARRAY unnest)"""
    rows = (
        db.query(
            func.unnest(Analysis.keywords).label("keyword"),
            func.count().label("cnt"),
        )
        .filter(Analysis.keywords.isnot(None))
        .group_by("keyword")
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )

    return [{"keyword": row.keyword, "count": row.cnt} for row in rows]


def get_summaries(db: Session) -> list:
    """주간 AI 요약 목록"""
    return (
        db.query(WeeklySummary)
        .order_by(WeeklySummary.week_start.desc())
        .limit(10)
        .all()
    )
