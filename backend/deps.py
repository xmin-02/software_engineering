from fastapi import Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database import SessionLocal


def get_db():
    """DB 세션 의존성 주입"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_api_key(x_api_key: str = Header(...)) -> str:
    """X-API-Key 헤더 검증"""
    if x_api_key != settings.pipeline_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key


class PaginationParams:
    """페이지네이션 파라미터"""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="페이지 번호"),
        size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    ):
        self.page = page
        self.size = size
        self.offset = (page - 1) * size
