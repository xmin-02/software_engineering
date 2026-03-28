from datetime import date, datetime

from pydantic import BaseModel


class EventResponse(BaseModel):
    """행사/축제"""
    id: int
    title: str
    description: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    url: str | None = None
    category: str | None = None

    model_config = {"from_attributes": True}


class UniversityNoticeResponse(BaseModel):
    """대학 공지"""
    id: int
    university: str
    title: str
    category: str | None = None
    url: str | None = None
    published_at: datetime | None = None

    model_config = {"from_attributes": True}


class ContestResponse(BaseModel):
    """공모전"""
    id: int
    title: str
    organizer: str | None = None
    deadline: date | None = None
    url: str | None = None
    category: str | None = None

    model_config = {"from_attributes": True}


class ScholarshipResponse(BaseModel):
    """장학금"""
    id: int
    title: str
    organization: str | None = None
    amount: str | None = None
    deadline: date | None = None
    eligibility: str | None = None
    url: str | None = None

    model_config = {"from_attributes": True}


class JobResponse(BaseModel):
    """채용 정보"""
    id: int
    title: str
    company: str | None = None
    location: str | None = None
    salary: str | None = None
    job_type: str | None = None
    experience_level: str | None = None
    deadline: date | None = None
    url: str | None = None
    source: str | None = None

    model_config = {"from_attributes": True}


class CertificationResponse(BaseModel):
    """자격시험"""
    id: int
    name: str
    category: str | None = None
    exam_date: date | None = None
    registration_start: date | None = None
    registration_end: date | None = None
    fee: str | None = None
    url: str | None = None

    model_config = {"from_attributes": True}


class RealEstateResponse(BaseModel):
    """부동산 실거래"""
    id: int
    title: str | None = None
    address: str | None = None
    district: str | None = None
    dong: str | None = None
    property_type: str | None = None
    deal_type: str | None = None
    price: str | None = None
    deposit: str | None = None
    monthly_rent: str | None = None
    area_sqm: float | None = None
    floor: str | None = None
    build_year: str | None = None
    deal_date: date | None = None
    latitude: float | None = None
    longitude: float | None = None

    model_config = {"from_attributes": True}
