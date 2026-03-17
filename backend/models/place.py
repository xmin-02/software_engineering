from datetime import datetime, time

from sqlalchemy import String, Text, Float, Boolean, DateTime, Time, Double, JSON, Integer, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class Place(Base):
    __tablename__ = "places"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
    sub_category: Mapped[str | None] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(20))
    rating_naver: Mapped[float | None] = mapped_column(Float)
    rating_kakao: Mapped[float | None] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Double)
    longitude: Mapped[float | None] = mapped_column(Double)
    business_hours: Mapped[dict | None] = mapped_column(JSON)
    last_order_time: Mapped[time | None] = mapped_column(Time)
    has_parking: Mapped[bool | None] = mapped_column(Boolean)
    has_kids_facility: Mapped[bool | None] = mapped_column(Boolean)
    is_no_kids_zone: Mapped[bool | None] = mapped_column(Boolean)
    is_alcohol_only: Mapped[bool] = mapped_column(Boolean, default=False)
    price_range: Mapped[str | None] = mapped_column(String(20))
    naver_place_id: Mapped[str | None] = mapped_column(String(100))
    kakao_place_id: Mapped[str | None] = mapped_column(String(100))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews: Mapped[list["PlaceReview"]] = relationship(back_populates="place", cascade="all, delete-orphan")
    tags: Mapped[list["PlaceTag"]] = relationship(back_populates="place", cascade="all, delete-orphan")


class PlaceReview(Base):
    __tablename__ = "place_reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"))
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    review_text: Mapped[str] = mapped_column(Text, nullable=False)
    review_url: Mapped[str | None] = mapped_column(Text)
    sentiment: Mapped[str | None] = mapped_column(String(10))
    sentiment_score: Mapped[float | None] = mapped_column(Float)
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    place: Mapped["Place"] = relationship(back_populates="reviews")


class PlaceTag(Base):
    __tablename__ = "place_tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"))
    tag: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    source_count: Mapped[int] = mapped_column(default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    place: Mapped["Place"] = relationship(back_populates="tags")
