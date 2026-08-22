
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ============================================================
# Review Request
# ============================================================

class ReviewRequest(BaseModel):
    """
    Request body for reviewing Python code directly.
    """

    code: str


# ============================================================
# Review History Item
# ============================================================

class ReviewHistoryItem(BaseModel):
    """
    Represents one item in the review history.
    """

    id: int

    filename: str

    language: str

    score: int = Field(
        ge=0,
        le=100
    )

    created_at: datetime


# ============================================================
# Review History Response
# ============================================================

class ReviewHistoryResponse(BaseModel):
    """
    Paginated review history response.
    """

    total: int = Field(
        ge=0
    )

    page: int = Field(
        ge=1
    )

    limit: int = Field(
        ge=1,
        le=100
    )

    reviews: list[ReviewHistoryItem]


# ============================================================
# Review Detail Response
# ============================================================

class ReviewDetailResponse(BaseModel):
    """
    Complete review returned to the frontend.
    """

    id: int

    filename: str

    language: str

    score: int = Field(
        ge=0,
        le=100
    )

    metrics: dict[str, Any] = Field(
        default_factory=dict
    )

    issues: list[Any] = Field(
        default_factory=list
    )

    summary: dict[str, Any] = Field(
        default_factory=dict
    )

    ai_review: dict[str, Any] | None = None

    created_at: datetime


# ============================================================
# Review Analytics Response
# ============================================================

class ReviewAnalyticsResponse(BaseModel):
    """
    Analytics data for the authenticated user.
    """

    total_reviews: int = Field(
        ge=0
    )

    average_score: float = Field(
        ge=0,
        le=100
    )

    issues: dict[str, int] = Field(
        default_factory=dict
    )

    categories: dict[str, int] = Field(
        default_factory=dict
    )

    languages: dict[str, int] = Field(
        default_factory=dict
    )
