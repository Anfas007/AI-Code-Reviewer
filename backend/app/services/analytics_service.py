from sqlalchemy.orm import Session

from app.database.models import Review
from app.services.issue_aggregation import combine_issues


def get_review_analytics(
    db: Session,
    user_id: int
):
    reviews = (
        db.query(Review)
        .filter(Review.user_id == user_id)
        .all()
    )

    total_reviews = len(reviews)

    # ---------------------------------------------------------
    # No reviews
    # ---------------------------------------------------------

    if total_reviews == 0:
        return {
            "total_reviews": 0,
            "average_score": 0,
            "issues": {
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "categories": {},
            "languages": {}
        }

    # ---------------------------------------------------------
    # Average score
    # ---------------------------------------------------------

    average_score = round(
        sum(review.score for review in reviews) / total_reviews,
        2
    )

    # ---------------------------------------------------------
    # Issue severity counts
    # ---------------------------------------------------------

    severity_counts = {
        "high": 0,
        "medium": 0,
        "low": 0
    }

    # ---------------------------------------------------------
    # Issue category counts
    # ---------------------------------------------------------

    category_counts = {}

    # ---------------------------------------------------------
    # Language counts
    # ---------------------------------------------------------

    language_counts = {}

    # ---------------------------------------------------------
    # Process reviews
    # ---------------------------------------------------------

    for review in reviews:

        # Language
        language = review.language

        language_counts[language] = (
            language_counts.get(language, 0) + 1
        )

        # Count the same static and AI findings used by review scoring.
        for issue in combine_issues(
            review.issues,
            review.ai_review
        ):

            severity = issue.get("severity")

            if severity in severity_counts:
                severity_counts[severity] += 1

            category = issue.get("category")

            if category:
                category_counts[category] = (
                    category_counts.get(category, 0) + 1
                )

    return {
        "total_reviews": total_reviews,
        "average_score": average_score,
        "issues": severity_counts,
        "categories": category_counts,
        "languages": language_counts
    }