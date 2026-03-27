from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class Analysis(Base):
    __tablename__ = "analysis"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    sentiment: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    emotion: Mapped[str | None] = mapped_column(String(30))
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False)
    topic: Mapped[str | None] = mapped_column(String(100), index=True)
    topic_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("topics.id"), index=True)
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    post: Mapped["Post"] = relationship(back_populates="analysis")
    topic_ref: Mapped["Topic | None"] = relationship(back_populates="analyses")
