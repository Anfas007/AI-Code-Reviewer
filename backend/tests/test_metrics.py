import ast

from app.analyzer.metrics import calculate_metrics


def test_metrics_for_nested_python_source():
    tree = ast.parse(
        "import os\n"
        "def read(value):\n"
        "    if value:\n"
        "        for item in value:\n"
        "            print(item)\n"
        "    return value\n"
    )

    assert calculate_metrics(tree) == {
        "functions": 1,
        "classes": 0,
        "imports": 1,
        "loops": 1,
        "conditions": 1,
        "max_nesting": 2,
        "complexity": 3,
    }
