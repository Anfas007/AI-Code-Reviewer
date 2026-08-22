
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Review(Base):
    """
    Stores the result of a Python code review.
    """

    __tablename__ = "reviews"

    # ========================================================
    # Primary Key
    # ========================================================

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    # ========================================================
    # User
    # ========================================================

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # ========================================================
    # File Information
    # ========================================================

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    language: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="python"
    )

    # ========================================================
    # Review Score
    # ========================================================

    score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    # ========================================================
    # Code Metrics
    #
    # Example:
    # {
    #     "functions": 5,
    #     "classes": 2,
    #     "imports": 8,
    #     "loops": 3,
    #     "conditions": 7,
    #     "max_nesting": 3,
    #     "complexity": 6
    # }
    # ========================================================

    metrics: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict
    )

    # ========================================================
    # Static Analysis Issues
    #
    # Example:
    # [
    #     {
    #         "rule_id": "R001",
    #         "title": "eval() usage",
    #         "severity": "high",
    #         "line": 10
    #     }
    # ]
    # ========================================================

    issues: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list
    )

    # ========================================================
    # Issue Summary
    #
    # Example:
    # {
    #     "high": 2,
    #     "medium": 3,
    #     "low": 1
    # }
    # ========================================================

    summary: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict
    )

    # ========================================================
    # AI Review
    #
    # Example:
    # {
    #     "summary": "...",
    #     "security": [],
    #     "bugs": [],
    #     "quality": [],
    #     "performance": [],
    #     "recommendations": []
    # }
    # ========================================================

    ai_review: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        default=None
    )

    # ========================================================
    # Timestamp
    # ========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
