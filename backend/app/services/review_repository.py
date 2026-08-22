
import json
import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models import Review


logger = logging.getLogger(__name__)


# ============================================================
# JSONB Validation Helper
# ============================================================

def prepare_jsonb_value(value, fallback):
    """
    Validate that a value can be serialized as JSON while
    preserving the original Python dict/list structure.

    IMPORTANT:
    We do NOT return json.dumps(value).

    The database columns use PostgreSQL JSONB, so SQLAlchemy
    should receive the original Python dict/list.
    """

    if value is None:
        return fallback

    try:
        # Test whether the value is JSON serializable.
        json.dumps(
            value,
            ensure_ascii=False
        )

        # Return the original Python object.
        return value

    except (TypeError, ValueError):

        logger.exception(
            "Invalid JSONB value. Using fallback."
        )

        return fallback


# ============================================================
# Create Review
# ============================================================

def create_review(
    db: Session,
    user_id: int,
    filename: str,
    result: dict
):
    """
    Save a completed code review to the database.

    Expected result:

    {
        "valid": True,
        "score": int,
        "metrics": dict,
        "issues": list,
        "summary": dict,
        "ai_review": dict
    }

    JSON fields are stored directly as Python objects because
    the Review model uses PostgreSQL JSONB columns.
    """

    # ========================================================
    # Validate input
    # ========================================================

    if not isinstance(result, dict):
        raise ValueError(
            "Review result must be a dictionary."
        )

    if not filename or not filename.strip():
        raise ValueError(
            "Review filename cannot be empty."
        )

    if user_id is None:
        raise ValueError(
            "user_id is required to create a review."
        )

    # ========================================================
    # Validate review result
    # ========================================================

    if result.get("valid") is False:
        raise ValueError(
            "Invalid code review results cannot be saved."
        )

    # ========================================================
    # Score
    # ========================================================

    raw_score = result.get(
        "score",
        0
    )

    try:

        score = int(raw_score)

    except (TypeError, ValueError):

        logger.warning(
            "Invalid review score received: %r. "
            "Using 0 instead.",
            raw_score
        )

        score = 0

    # Keep score between 0 and 100.
    score = max(
        0,
        min(100, score)
    )

    # ========================================================
    # Get JSONB fields
    # ========================================================

    metrics = result.get(
        "metrics",
        {}
    )

    issues = result.get(
        "issues",
        []
    )

    summary = result.get(
        "summary",
        {}
    )

    ai_review = result.get(
        "ai_review"
    )

    # ========================================================
    # Validate JSONB field types
    # ========================================================

    if not isinstance(metrics, dict):

        logger.warning(
            "Invalid metrics type: %s. "
            "Using empty object.",
            type(metrics).__name__
        )

        metrics = {}

    if not isinstance(issues, list):

        logger.warning(
            "Invalid issues type: %s. "
            "Using empty list.",
            type(issues).__name__
        )

        issues = []

    if not isinstance(summary, dict):

        logger.warning(
            "Invalid summary type: %s. "
            "Using empty object.",
            type(summary).__name__
        )

        summary = {}

    if ai_review is not None and not isinstance(
        ai_review,
        dict
    ):

        logger.warning(
            "Invalid ai_review type: %s. "
            "Using None.",
            type(ai_review).__name__
        )

        ai_review = None

    # ========================================================
    # Validate JSON serializability
    #
    # IMPORTANT:
    # prepare_jsonb_value() returns dict/list objects,
    # NOT JSON strings.
    # ========================================================

    metrics = prepare_jsonb_value(
        metrics,
        {}
    )

    issues = prepare_jsonb_value(
        issues,
        []
    )

    summary = prepare_jsonb_value(
        summary,
        {}
    )

    ai_review = prepare_jsonb_value(
        ai_review,
        None
    )

    # ========================================================
    # Create Review model
    # ========================================================

    review = Review(
        user_id=user_id,
        filename=filename.strip(),
        language="python",
        score=score,
        metrics=metrics,
        issues=issues,
        summary=summary,
        ai_review=ai_review
    )

    # ========================================================
    # Save review
    # ========================================================

    try:

        db.add(review)

        db.commit()

        db.refresh(review)

        logger.info(
            "Review saved successfully. "
            "review_id=%s user_id=%s filename=%s",
            review.id,
            user_id,
            filename
        )

        return review

    except SQLAlchemyError:

        db.rollback()

        logger.exception(
            "Database error while saving review. "
            "user_id=%s filename=%s",
            user_id,
            filename
        )

        raise

    except Exception:

        db.rollback()

        logger.exception(
            "Unexpected error while saving review. "
            "user_id=%s filename=%s",
            user_id,
            filename
        )

        raise
