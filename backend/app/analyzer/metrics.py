import ast

from app.analyzer.complexity import (
    calculate_max_nesting,
    calculate_cyclomatic_complexity
)


def calculate_metrics(tree):

    functions = 0
    classes = 0
    imports = 0
    loops = 0
    conditions = 0
    complexity = 0



    for node in ast.walk(tree):

        if isinstance(node, ast.FunctionDef):

            functions += 1

            complexity+= calculate_cyclomatic_complexity(node)

        elif isinstance(node, ast.ClassDef):
            classes += 1

        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            imports += 1

        elif isinstance(node, (ast.For, ast.While)):
            loops += 1

        elif isinstance(node, ast.If):
            conditions += 1

    max_nesting = calculate_max_nesting(tree)

    return {
        "functions": functions,
        "classes": classes,
        "imports": imports,
        "loops": loops,
        "conditions": conditions,
        "max_nesting": max_nesting,
        "complexity": complexity
    }