from datetime import date, datetime

from pydantic import BaseModel


class PostResponse(BaseModel):
    """게시글 + 분석 결과"""
    id: int
    source: str
    title: str | None = None
    content: str
    author: str | None = None
    url: str | None = None
    published_at: datetime | None = None
    sentiment: str | None = None
    sentiment_score: float | None = None
    topic: str | None = None
    keywords: list[str] | None = None

    model_config = {"from_attributes": True}


class SentimentStats(BaseModel):
    """감성 분포 통계"""
    positive: int = 0
    negative: int = 0
    neutral: int = 0
    total: int = 0


class TrendPoint(BaseModel):
    """감성 트렌드 데이터 포인트"""
    date: date
    positive: int = 0
    negative: int = 0
    neutral: int = 0


class SourceStats(BaseModel):
    """소스별 감성 통계"""
    source: str
    positive: int = 0
    negative: int = 0
    neutral: int = 0


class TopicResponse(BaseModel):
    """토픽 정보"""
    id: int
    name: str
    keywords: list[str] | None = None
    post_count: int = 0
    sentiment: str | None = None
    score: float | None = None

    model_config = {"from_attributes": True}


class KeywordFrequency(BaseModel):
    """키워드 빈도"""
    keyword: str
    count: int


class WeeklySummaryResponse(BaseModel):
    """주간 AI 요약"""
    id: int
    week_start: date
    week_end: date
    summary: str | None = None
    top_topics: list[str] | None = None
    total_posts: int = 0
    sentiment_ratio: dict | None = None

    model_config = {"from_attributes": True}
