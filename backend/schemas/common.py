from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """페이지네이션 응답 래퍼"""
    items: list[T]
    total: int
    page: int
    size: int


class ErrorResponse(BaseModel):
    """표준 에러 응답"""
    error: str
    detail: str | None = None
