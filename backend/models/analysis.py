from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class Analysis(Base):
    __tablename__ = "analysis"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    sentiment: Mapped[str] = mapped_column(String(10), nullable=False)
    emotion: Mapped[str | None] = mapped_column(String(30))
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False)
    topic: Mapped[str | None] = mapped_column(String(100))
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    post: Mapped["Post"] = relationship(back_populates="analysis")
