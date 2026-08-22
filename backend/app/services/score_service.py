SEVERITY_PENALTIES = {
    "high": 20,
    "medium": 10,
    "low": 5
}


def calculate_score(issues):

    score = 100

    for issue in issues:
        severity = issue["severity"]

        penalty = SEVERITY_PENALTIES.get(severity, 0)

        score -= penalty

    score = max(score, 0)

    return score