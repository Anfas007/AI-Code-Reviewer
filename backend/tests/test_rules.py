import ast

from app.analyzer.rule_engine import run_rules


def test_eval_rule_reports_line_and_severity():
    issues = run_rules(ast.parse("result = eval(value)\n"))

    assert len(issues) == 1
    assert issues[0]["rule_id"] == "R001"
    assert issues[0]["severity"] == "high"
    assert issues[0]["line"] == 1
