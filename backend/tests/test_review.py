from unittest.mock import patch

from app.services.review_service import review_code


def test_review_returns_static_result_when_ai_fails():
    with patch(
        "app.services.review_service.review_code_with_llm",
        side_effect=TimeoutError("AI timeout")
    ):
        result = review_code("value = eval(source)\n")

    assert result["valid"] is True
    assert result["ai_review"]["security"] == []
    assert result["summary"]["high"] == 1
    assert result["score"] == 80


def test_review_combines_ai_and_static_findings_for_score():
    ai_review = {
        "summary": "found issues",
        "security": [
            {"severity": "high"},
            {"severity": "high"},
            {"severity": "high"},
        ],
        "bugs": [{"severity": "medium"}],
        "quality": [{"severity": "low"}],
        "performance": [],
        "recommendations": [],
    }

    with patch(
        "app.services.review_service.review_code_with_llm",
        return_value=ai_review
    ):
        result = review_code("value = eval(source)\n")

    assert result["score"] == 5
    assert result["summary"] == {"high": 4, "medium": 1, "low": 1}
