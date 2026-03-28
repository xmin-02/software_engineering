from datetime import datetime

from pydantic import BaseModel


class PlaceResponse(BaseModel):
    """장소 기본 정보 + 통계"""
    id: int
    name: str
    category: str | None = None
    address: str | None = None
    rating_naver: float | None = None
    rating_kakao: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    business_hours: dict | None = None
    has_parking: bool | None = None
    price_range: str | None = None
    is_open_now: bool = False
    tags: list[str] = []
    avg_sentiment_score: float | None = None
    review_count: int = 0

    model_config = {"from_attributes": True}


class PlaceReviewResponse(BaseModel):
    """장소 리뷰"""
    id: int
    source: str
    review_text: str
    review_url: str | None = None
    sentiment: str | None = None
    sentiment_score: float | None = None
    keywords: list[str] | None = None
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class PlaceDetail(BaseModel):
    """장소 상세 (리뷰 포함)"""
    place: PlaceResponse
    reviews: list[PlaceReviewResponse] = []


class PlaceRanking(BaseModel):
    """장소 랭킹"""
    id: int
    name: str
    category: str | None = None
    address: str | None = None
    avg_sentiment_score: float | None = None
    review_count: int = 0
    rating_naver: float | None = None
    rating_kakao: float | None = None

    model_config = {"from_attributes": True}
