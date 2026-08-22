
import ast
import logging

from app.analyzer.metrics import calculate_metrics
from app.analyzer.rule_engine import run_rules
from app.services.score_service import calculate_score
from app.services.report_service import summarize_issues
from app.services.llm_service import review_code_with_llm
from app.services.issue_aggregation import combine_issues


logger = logging.getLogger(__name__)


# ============================================================
# Default AI Review
# ============================================================

def get_default_ai_review():
    """
    Return a safe fallback structure when the LLM service
    is unavailable or returns an invalid response.
    """

    return {
        "summary": (
            "AI review is currently unavailable. "
            "The static rule-based analysis is still available."
        ),
        "security": [],
        "bugs": [],
        "quality": [],
        "performance": [],
        "recommendations": [
            (
                "Check the AI service configuration, API key, "
                "network connection, and rate limits."
            )
        ]
    }


# ============================================================
# Normalize AI Review
# ============================================================

def normalize_ai_review(ai_review):
    """
    Make sure the AI response always has the structure expected
    by the API and frontend.
    """

    if not isinstance(ai_review, dict):
        logger.warning(
            "Invalid AI review format received: %s",
            type(ai_review).__name__
        )

        return get_default_ai_review()

    return {
        "summary": (
            ai_review.get("summary")
            if isinstance(ai_review.get("summary"), str)
            else ""
        ),

        "security": (
            ai_review.get("security")
            if isinstance(ai_review.get("security"), list)
            else []
        ),

        "bugs": (
            ai_review.get("bugs")
            if isinstance(ai_review.get("bugs"), list)
            else []
        ),

        "quality": (
            ai_review.get("quality")
            if isinstance(ai_review.get("quality"), list)
            else []
        ),

        "performance": (
            ai_review.get("performance")
            if isinstance(ai_review.get("performance"), list)
            else []
        ),

        "recommendations": (
            ai_review.get("recommendations")
            if isinstance(ai_review.get("recommendations"), list)
            else []
        )
    }


# ============================================================
# Review Code
# ============================================================

def review_code(code: str):
    """
    Analyze Python source code using:

    1. Python AST validation
    2. Static metrics
    3. Rule-based analysis
    4. Score calculation
    5. Issue summary
    6. LLM-based review

    Always returns a predictable response structure.
    """

    # ========================================================
    # 0. Validate input
    # ========================================================

    if not isinstance(code, str):
        return {
            "valid": False,
            "error": {
                "type": "InvalidInput",
                "message": "Code must be provided as a string.",
                "line": None,
                "column": None
            }
        }

    # Empty / whitespace-only code
    if not code.strip():
        return {
            "valid": False,
            "error": {
                "type": "EmptyCode",
                "message": "Uploaded Python file is empty.",
                "line": None,
                "column": None
            }
        }

    # ========================================================
    # 1. Parse Python code
    # ========================================================

    try:
        tree = ast.parse(code)

    except SyntaxError as error:

        logger.info(
            "Invalid Python syntax at line %s, column %s",
            error.lineno,
            error.offset
        )

        return {
            "valid": False,
            "error": {
                "type": "SyntaxError",
                "message": error.msg,
                "line": error.lineno,
                "column": error.offset,
                "text": (
                    error.text.strip()
                    if error.text
                    else None
                )
            }
        }

    except Exception:

        logger.exception(
            "Unexpected error while parsing Python code"
        )

        return {
            "valid": False,
            "error": {
                "type": "ParseError",
                "message": "Unable to parse the uploaded Python code.",
                "line": None,
                "column": None
            }
        }

    # ========================================================
    # 2. Calculate code metrics
    # ========================================================

    try:

        metrics = calculate_metrics(tree)

        if not isinstance(metrics, dict):
            logger.warning(
                "calculate_metrics() returned invalid type: %s",
                type(metrics).__name__
            )

            metrics = {}

    except Exception:

        logger.exception(
            "Code metrics calculation failed"
        )

        metrics = {}

    # ========================================================
    # 3. Run static analysis rules
    # ========================================================

    try:

        issues = run_rules(tree)

        if not isinstance(issues, list):
            logger.warning(
                "run_rules() returned invalid type: %s",
                type(issues).__name__
            )

            issues = []

    except Exception:

        logger.exception(
            "Static rule analysis failed"
        )

        issues = []

    # ========================================================
    # 4. Gemini / LLM review
    # ========================================================

    try:

        llm_review = review_code_with_llm(code)

        llm_review = normalize_ai_review(
            llm_review
        )

    except Exception:

        logger.exception(
            "Gemini AI review failed. "
            "Continuing with static rule-based review."
        )

        llm_review = get_default_ai_review()

    # ========================================================
    # 5. Calculate combined score and summary
    # ========================================================

    combined_issues = combine_issues(
        issues,
        llm_review
    )

    try:

        score = calculate_score(combined_issues)

        score = int(score)
        score = max(0, min(100, score))

    except Exception:

        logger.exception(
            "Score calculation failed"
        )

        score = 100

    try:

        summary = summarize_issues(combined_issues)

        if not isinstance(summary, dict):
            logger.warning(
                "summarize_issues() returned invalid type: %s",
                type(summary).__name__
            )

            summary = {}

    except Exception:

        logger.exception(
            "Issue summary generation failed"
        )

        summary = {}

    # ========================================================
    # 6. Return combined result
    # ========================================================

    return {
        "valid": True,
        "score": score,
        "metrics": metrics,
        "issues": issues,
        "summary": summary,
        "ai_review": llm_review
    }