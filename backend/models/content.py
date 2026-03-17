from datetime import date, datetime

from sqlalchemy import String, Text, Float, Double, Integer, Date, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class WeeklySummary(Base):
    __tablename__ = "weekly_summaries"

    id: Mapped[int] = mapped_column(primary_key=True)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    top_topics: Mapped[list[str] | None] = mapped_column(JSON)
    total_posts: Mapped[int] = mapped_column(Integer, default=0)
    sentiment_ratio: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))
    category: Mapped[str | None] = mapped_column(String(50))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Contest(Base):
    __tablename__ = "contests"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    organizer: Mapped[str | None] = mapped_column(String(200))
    deadline: Mapped[date | None] = mapped_column(Date)
    url: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(50))
    source: Mapped[str | None] = mapped_column(String(50))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Scholarship(Base):
    __tablename__ = "scholarships"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    organization: Mapped[str | None] = mapped_column(String(200))
    amount: Mapped[str | None] = mapped_column(String(100))
    deadline: Mapped[date | None] = mapped_column(Date)
    eligibility: Mapped[str | None] = mapped_column(Text)
    url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    company: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(100))
    salary: Mapped[str | None] = mapped_column(String(100))
    job_type: Mapped[str | None] = mapped_column(String(50))
    experience_level: Mapped[str | None] = mapped_column(String(50))
    deadline: Mapped[date | None] = mapped_column(Date)
    url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))
    source_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RealEstate(Base):
    __tablename__ = "real_estate"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str | None] = mapped_column(String(300))
    address: Mapped[str | None] = mapped_column(Text)
    property_type: Mapped[str | None] = mapped_column(String(50))
    deal_type: Mapped[str | None] = mapped_column(String(50))
    price: Mapped[str | None] = mapped_column(String(100))
    area_sqm: Mapped[float | None] = mapped_column(Float)
    floor: Mapped[str | None] = mapped_column(String(20))
    latitude: Mapped[float | None] = mapped_column(Double)
    longitude: Mapped[float | None] = mapped_column(Double)
    url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Certification(Base):
    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
    exam_date: Mapped[date | None] = mapped_column(Date)
    registration_start: Mapped[date | None] = mapped_column(Date)
    registration_end: Mapped[date | None] = mapped_column(Date)
    fee: Mapped[str | None] = mapped_column(String(100))
    url: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(50))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class UniversityNotice(Base):
    __tablename__ = "university_notices"

    id: Mapped[int] = mapped_column(primary_key=True)
    university: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
    url: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    source_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
