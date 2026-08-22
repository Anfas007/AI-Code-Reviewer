def get_ai_issues(ai_review):
    if not isinstance(ai_review, dict):
        return []

    issues = []

    for category in (
        "security",
        "bugs",
        "quality",
        "performance"
    ):
        category_issues = ai_review.get(category, [])

        if isinstance(category_issues, list):
            issues.extend(
                issue
                for issue in category_issues
                if isinstance(issue, dict)
            )

    return issues


def combine_issues(static_issues, ai_review):
    static_issues = static_issues if isinstance(static_issues, list) else []

    return [
        issue
        for issue in static_issues
        if isinstance(issue, dict)
    ] + get_ai_issues(ai_review)