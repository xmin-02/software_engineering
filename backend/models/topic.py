from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analyses: Mapped[list["Analysis"]] = relationship(back_populates="topic_ref")
