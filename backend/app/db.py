import os
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, Integer, String, Text, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    target_role: Mapped[str] = mapped_column(String(200))
    score: Mapped[int] = mapped_column(Integer)
    summary: Mapped[str] = mapped_column(Text)
    strengths: Mapped[list[str]] = mapped_column(JSONB)
    gaps: Mapped[list[str]] = mapped_column(JSONB)
    recommendations: Mapped[list[str]] = mapped_column(JSONB)
    interview_questions: Mapped[list[str]] = mapped_column(JSONB)
    keywords: Mapped[list[str]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    processing_ms: Mapped[int] = mapped_column(Integer)


DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None


def persist(record: dict[str, Any]) -> None:
    if engine is None:
        return
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(AnalysisRecord(**record))
        session.commit()


def fetch_recent() -> Optional[list[dict[str, Any]]]:
    if engine is None:
        return None
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        rows = session.scalars(
            select(AnalysisRecord).order_by(AnalysisRecord.created_at.desc()).limit(10)
        ).all()
        return [{column.name: getattr(row, column.name) for column in AnalysisRecord.__table__.columns} for row in rows]
