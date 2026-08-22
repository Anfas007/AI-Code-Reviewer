
import ast
import json
import logging

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.review import (
    ReviewRequest,
    ReviewHistoryResponse,
    ReviewDetailResponse,
    ReviewAnalyticsResponse
)

from app.services.review_service import review_code
from app.database.connection import get_db
from app.services.review_repository import create_review
from app.database.models import Review
from app.core.dependencies import get_current_user
from app.database.user_model import User
from app.services.analytics_service import get_review_analytics


logger = logging.getLogger(__name__)


# ============================================================
# CONSTANTS
# ============================================================

MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MB


router = APIRouter(
    prefix="/review",
    tags=["Code Review"]
)


# ============================================================
# Helper: Validate Python source
# ============================================================

def validate_python_code(code: str) -> None:
    """
    Validate that the uploaded content is non-empty
    and contains valid Python syntax.

    Raises:
        HTTPException: If validation fails.
    """

    # --------------------------------------------------------
    # Empty / whitespace-only file
    # --------------------------------------------------------

    if not code or not code.strip():
        raise HTTPException(
            status_code=400,
            detail="Uploaded Python file is empty."
        )

    # --------------------------------------------------------
    # Python syntax validation
    # --------------------------------------------------------

    try:
        ast.parse(code)

    except SyntaxError as exc:
        line = exc.lineno or "unknown"
        offset = exc.offset or "unknown"

        message = exc.msg or "Invalid Python syntax."

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid Python syntax: {message} "
                f"(line {line}, column {offset})."
            )
        )


# ============================================================
# Helper: Parse JSON safely
# ============================================================

def parse_json(field_data, fallback):
    """
    Safely parse database JSON fields.

    Handles:
        - dict/list
        - JSON strings
        - nested JSON strings
        - None
        - invalid JSON
    """

    if field_data is None:
        return fallback

    parsed = field_data

    # Some database fields may contain JSON encoded
    # multiple times, so continue parsing while possible.
    while isinstance(parsed, str):

        try:
            parsed = json.loads(parsed)

        except (json.JSONDecodeError, TypeError):
            return fallback

    return parsed


# ============================================================
# Review code from text
# ============================================================

@router.post("/")
def review_code_text(
    request: ReviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Review Python source code submitted as text.
    """

    # --------------------------------------------------------
    # Validate request
    # --------------------------------------------------------

    if not request.code or not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Code cannot be empty."
        )

    # --------------------------------------------------------
    # Validate Python syntax
    # --------------------------------------------------------

    validate_python_code(request.code)

    # --------------------------------------------------------
    # Run review
    # --------------------------------------------------------

    try:

        result = review_code(request.code)

    except Exception:
        logger.exception(
            "Code review failed for text request"
        )

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while reviewing the code."
        )

    return result


# ============================================================
# Upload and review Python file
# ============================================================

@router.post("/file")
async def review_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a Python file, validate it, analyze it,
    and save the review result.
    """

    # ========================================================
    # 1. Validate filename
    # ========================================================

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a filename."
        )

    if not file.filename.lower().endswith(".py"):
        raise HTTPException(
            status_code=400,
            detail="Only Python (.py) files are supported."
        )

    # ========================================================
    # 2. Read file
    # ========================================================

    try:
        content = await file.read()

    except Exception:
        logger.exception(
            "Failed to read uploaded file"
        )

        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded file."
        )

    # ========================================================
    # 3. Validate raw file
    # ========================================================

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded Python file is empty."
        )

    # ========================================================
    # 4. Validate file size
    # ========================================================

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File size must not exceed 1 MB."
        )

    # ========================================================
    # 5. Decode UTF-8
    # ========================================================

    try:

        code = content.decode("utf-8")

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="File must be UTF-8 encoded."
        )

    # ========================================================
    # 6. Validate content
    # ========================================================

    validate_python_code(code)

    # ========================================================
    # 7. Run code review
    # ========================================================

    try:

        result = review_code(code)

    except Exception:
        logger.exception(
            "Code review failed for file: %s",
            file.filename
        )

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while reviewing the code."
        )

    # ========================================================
    # 8. Handle invalid result from review service
    # ========================================================

    if not isinstance(result, dict):

        logger.error(
            "review_code returned invalid result type: %s",
            type(result).__name__
        )

        raise HTTPException(
            status_code=500,
            detail="Code review service returned an invalid response."
        )

    if not result.get("valid", True):

        error_data = result.get("error")

        # Convert any backend error structure into a
        # React-safe string response.
        if isinstance(error_data, dict):

            error_type = error_data.get(
                "type",
                "ReviewError"
            )

            message = error_data.get(
                "message",
                "The code could not be reviewed."
            )

            raise HTTPException(
                status_code=400,
                detail=f"{error_type}: {message}"
            )

        raise HTTPException(
            status_code=400,
            detail=str(
                error_data or
                "The uploaded code could not be reviewed."
            )
        )

    # ========================================================
    # 9. Save review
    # ========================================================

    try:

        review = create_review(
            db=db,
            user_id=current_user.id,
            filename=file.filename,
            result=result
        )

    except SQLAlchemyError:

        db.rollback()

        logger.exception(
            "Failed to save review for file: %s",
            file.filename
        )

        raise HTTPException(
            status_code=500,
            detail="Code was reviewed, but the result could not be saved."
        )

    except Exception:

        db.rollback()

        logger.exception(
            "Unexpected error while saving review: %s",
            file.filename
        )

        raise HTTPException(
            status_code=500,
            detail="Code was reviewed, but the result could not be saved."
        )

    # ========================================================
    # 10. Return review ID
    # ========================================================

    result["review_id"] = review.id

    return result


# ============================================================
# Review history
# ============================================================

@router.get(
    "/history",
    response_model=ReviewHistoryResponse
)
def review_history(
    page: int = 1,
    limit: int = 10,
    min_score: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # Validate pagination
    # --------------------------------------------------------

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than or equal to 1."
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100."
        )

    # --------------------------------------------------------
    # Validate minimum score
    # --------------------------------------------------------

    if min_score is not None and (
        min_score < 0 or min_score > 100
    ):
        raise HTTPException(
            status_code=400,
            detail="min_score must be between 0 and 100."
        )

    # --------------------------------------------------------
    # Build query
    # --------------------------------------------------------

    query = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id
        )
    )

    if min_score is not None:

        query = query.filter(
            Review.score >= min_score
        )

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    total = query.count()

    offset = (page - 1) * limit

    reviews = (
        query
        .order_by(
            Review.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "reviews": [
            {
                "id": review.id,
                "filename": review.filename,
                "language": review.language,
                "score": review.score,
                "created_at": review.created_at
            }
            for review in reviews
        ]
    }


# ============================================================
# Review analytics
# ============================================================

@router.get(
    "/analytics",
    response_model=ReviewAnalyticsResponse
)
def review_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return get_review_analytics(
        db=db,
        user_id=current_user.id
    )


# ============================================================
# Get single review
# ============================================================

@router.get(
    "/{review_id}",
    response_model=ReviewDetailResponse
)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # Find review belonging to current user
    # --------------------------------------------------------

    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id
        )
        .first()
    )

    if review is None:

        raise HTTPException(
            status_code=404,
            detail="Review not found."
        )

    # --------------------------------------------------------
    # Parse database fields safely
    # --------------------------------------------------------

    metrics = parse_json(
        review.metrics,
        {}
    )

    issues = parse_json(
        review.issues,
        []
    )

    summary = parse_json(
        review.summary,
        {}
    )

    ai_review = parse_json(
        review.ai_review,
        {}
    )

    # --------------------------------------------------------
    # Guarantee correct response types
    # --------------------------------------------------------

    if not isinstance(metrics, dict):
        metrics = {}

    if not isinstance(issues, list):
        issues = []

    if not isinstance(summary, dict):
        summary = {}

    if ai_review is not None and not isinstance(
        ai_review,
        dict
    ):
        ai_review = {}

    # --------------------------------------------------------
    # Return complete review
    # --------------------------------------------------------

    return {
        "id": review.id,
        "filename": review.filename,
        "language": review.language,
        "score": review.score,
        "metrics": metrics,
        "issues": issues,
        "summary": summary,
        "ai_review": ai_review,
        "created_at": review.created_at
    }


# ============================================================
# Delete review
# ============================================================

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # --------------------------------------------------------
    # Find review
    # --------------------------------------------------------

    review = (
        db.query(Review)
        .filter(
            Review.id == review_id,
            Review.user_id == current_user.id
        )
        .first()
    )

    if review is None:

        raise HTTPException(
            status_code=404,
            detail="Review not found."
        )

    # --------------------------------------------------------
    # Delete
    # --------------------------------------------------------

    try:

        db.delete(review)
        db.commit()

    except SQLAlchemyError:

        db.rollback()

        logger.exception(
            "Failed to delete review %s",
            review_id
        )

        raise HTTPException(
            status_code=500,
            detail="Review could not be deleted."
        )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "message": "Review deleted successfully."
    }
