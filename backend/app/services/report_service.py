def summarize_issues(issues):

    summary = {
        "high": 0,
        "medium": 0,
        "low": 0
    }

    for issue in issues:

        severity = issue["severity"]

        if severity in summary:
            summary[severity] += 1

    return summary