from app.rules.rules import (
    check_eval_usage,
    check_exec_usage,
    check_bare_except,
    check_print_usage,
    check_mutable_defaults,
    check_hardcoded_credentials,
    check_deep_nesting,
    check_function_complexity,
    check_swallowed_exceptions,
    check_assert_usage,
    check_none_comparison,
    check_global_statement
)


RULES = [
    check_eval_usage,
    check_exec_usage,
    check_bare_except,
    check_print_usage,
    check_mutable_defaults,
    check_hardcoded_credentials,
    check_deep_nesting,
    check_function_complexity,
    check_swallowed_exceptions,
    check_assert_usage,
    check_none_comparison,
    check_global_statement
]


def run_rules(tree):
    issues = []

    for rule in RULES:
        rule_issues = rule(tree)
        issues.extend(rule_issues)

    return issues