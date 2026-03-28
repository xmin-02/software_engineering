from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.orm import Session

from backend.database import SessionLocal


class BaseCrawler(ABC):
    """모든 크롤러의 기반 추상 클래스"""

    def __init__(self, source: str):
        self.source = source

    @abstractmethod
    def crawl(self) -> list[dict[str, Any]]:
        """데이터 수집 후 dict 리스트 반환"""
        pass

    @abstractmethod
    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        """DB에 저장하고 저장된 건수 반환"""
        pass

    def run(self) -> int:
        """크롤링 → 중복 제거 → 저장 전체 실행"""
        data = self.crawl()
        if not data:
            return 0
        db = SessionLocal()
        try:
            count = self.save(data, db)
            db.commit()
            return count
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
