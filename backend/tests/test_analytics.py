from types import SimpleNamespace
from unittest.mock import Mock

from app.services.analytics_service import get_review_analytics


def test_analytics_counts_static_and_ai_findings():
    review = SimpleNamespace(
        user_id=7,
        score=5,
        language="python",
        issues=[{"severity": "high", "category": "security"}],
        ai_review={
            "security": [{"severity": "high"}],
            "bugs": [{"severity": "medium"}],
            "quality": [{"severity": "low"}],
            "performance": [],
        },
    )
    query = Mock()
    query.filter.return_value.all.return_value = [review]
    db = Mock()
    db.query.return_value = query

    result = get_review_analytics(db, user_id=7)

    assert result["total_reviews"] == 1
    assert result["average_score"] == 5
    assert result["issues"] == {"high": 2, "medium": 1, "low": 1}
    assert result["categories"] == {"security": 1}
