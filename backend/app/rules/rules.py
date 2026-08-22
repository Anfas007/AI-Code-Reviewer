import ast

from app.analyzer.complexity import (
    calculate_max_nesting,
    calculate_cyclomatic_complexity,
)

def check_eval_usage(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "eval":
                issues.append({
                    "rule_id": "R001",
                    "title": "Insecure eval() Usage",
                    "severity": "high",
                    "category": "security",
                    "message": "Use of eval() detected. Avoid evaluating untrusted input.",
                    "impact": "Can lead to arbitrary code execution if user input is evaluated.",
                    "recommendation": "Use ast.literal_eval() for safely parsing strings into Python objects.",
                    "line": node.lineno
                })
    return issues

def check_exec_usage(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "exec":
                issues.append({
                    "rule_id": "R002",
                    "title": "Insecure exec() Usage",
                    "severity": "high",
                    "category": "security",
                    "message": "Use of exec() detected. Avoid executing dynamically generated code.",
                    "impact": "Allows arbitrary code execution, leading to complete system compromise.",
                    "recommendation": "Refactor logic to avoid dynamic code execution entirely.",
                    "line": node.lineno
                })
    return issues

def check_bare_except(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler):
            if node.type is None:
                issues.append({
                    "rule_id": "R003",
                    "title": "Bare Except Clause",
                    "severity": "medium",
                    "category": "best-practice",
                    "message": "Bare except detected. Catch specific exceptions instead.",
                    "impact": "Can catch critical system errors (like KeyboardInterrupt) and hide application bugs.",
                    "recommendation": "Catch specific exceptions like Exception or ValueError.",
                    "line": node.lineno
                })
    return issues

def check_print_usage(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "print":
                issues.append({
                    "rule_id": "R004",
                    "title": "Print Statement in Production",
                    "severity": "low",
                    "category": "best-practice",
                    "message": "print() statement detected. Consider using a logging framework in production code.",
                    "impact": "Pollutes standard output and makes production debugging difficult.",
                    "recommendation": "Use Python's built-in 'logging' module.",
                    "line": node.lineno
                })
    return issues

def check_mutable_defaults(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for default in node.args.defaults:
                if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                    issues.append({
                        "rule_id": "R005",
                        "title": "Mutable Default Argument",
                        "severity": "medium",
                        "category": "bug",
                        "message": "Mutable default argument detected. Use None instead.",
                        "impact": "State is shared across all function calls, leading to unpredictable bugs.",
                        "recommendation": "Set default to None, and initialize the mutable object inside the function body.",
                        "line": node.lineno
                    })
    return issues

def check_hardcoded_credentials(tree):
    issues = []
    sensitive_names = {
        "password", "passwd", "secret", "api_key", "apikey", "token"
    }
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    variable_name = target.id.lower()
                    if variable_name in sensitive_names:
                        if isinstance(node.value, ast.Constant):
                            issues.append({
                                "rule_id": "R006",
                                "title": "Hardcoded Credential",
                                "severity": "high",
                                "category": "security",
                                "message": f"Possible hardcoded credential in '{target.id}'.",
                                "impact": "Credentials stored in source control can be easily leaked or stolen.",
                                "recommendation": "Use environment variables (os.environ) or a secure secrets manager.",
                                "line": node.lineno
                            })
    return issues

def check_deep_nesting(tree):
    issues = []
    max_depth = 0
    CONTROL_FLOW_NODES = (ast.If, ast.For, ast.While, ast.Try, ast.With)

    def visit(node, depth):
        nonlocal max_depth
        if isinstance(node, CONTROL_FLOW_NODES):
            depth += 1
            max_depth = max(max_depth, depth)
        for child in ast.iter_child_nodes(node):
            visit(child, depth)

    visit(tree, 0)
    if max_depth > 3:
        issues.append({
            "rule_id": "R007",
            "title": "Deeply Nested Code",
            "severity": "medium",
            "category": "maintainability",
            "message": f"Deep nesting detected. Maximum nesting depth is {max_depth}.",
            "impact": "Code becomes difficult to read, maintain, and test.",
            "recommendation": "Refactor by extracting logic into helper functions or using early returns.",
            "line": None
        })
    return issues

def check_function_complexity(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            complexity = calculate_cyclomatic_complexity(node)
            if complexity > 5:
                issues.append({
                    "rule_id": "R008",
                    "title": "High Cyclomatic Complexity",
                    "severity": "medium",
                    "category": "maintainability",
                    "message": f"Function '{node.name}' has high cyclomatic complexity ({complexity}).",
                    "impact": "The function is overly complex, making it prone to bugs and hard to unit test.",
                    "recommendation": "Break the function down into smaller, single-responsibility functions.",
                    "line": node.lineno
                })
    return issues

def check_swallowed_exceptions(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.ExceptHandler):
            # Check if the except block only contains a single 'pass' statement
            if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                issues.append({
                    "rule_id": "R009",
                    "title": "Silently Swallowed Exception",
                    "severity": "high",
                    "category": "bug",
                    "message": "Exception caught but ignored using 'pass'.",
                    "impact": "Critical failures will be hidden, making debugging impossible and potentially corrupting application state.",
                    "recommendation": "Log the exception using a logging framework or handle it explicitly.",
                    "line": node.lineno
                })
    return issues

def check_assert_usage(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Assert):
            issues.append({
                "rule_id": "R010",
                "title": "Assert Used in Production Code",
                "severity": "medium",
                "category": "security",
                "message": "Use of 'assert' detected for logic or validation.",
                "impact": "Assert statements are completely ignored when Python runs in optimized mode (-O), bypassing validation.",
                "recommendation": "Use standard 'if' statements and raise explicit exceptions (e.g., ValueError) for data validation.",
                "line": node.lineno
            })
    return issues

def check_none_comparison(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Compare):
            for op, comparator in zip(node.ops, node.comparators):
                if isinstance(op, (ast.Eq, ast.NotEq)):
                    if isinstance(comparator, ast.Constant) and comparator.value is None:
                        issues.append({
                            "rule_id": "R011",
                            "title": "Invalid None Comparison",
                            "severity": "low",
                            "category": "best-practice",
                            "message": "Comparison to None using '==' or '!=' detected.",
                            "impact": "Can cause logic bugs if a custom class overrides the equality operator.",
                            "recommendation": "Always use 'is None' or 'is not None' when checking for None singletons.",
                            "line": node.lineno
                        })
    return issues

def check_global_statement(tree):
    issues = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Global):
            issues.append({
                "rule_id": "R012",
                "title": "Global State Modification",
                "severity": "medium",
                "category": "maintainability",
                "message": "Use of the 'global' keyword detected.",
                "impact": "Creates tight coupling and unpredictable shared state, leading to complex session bugs.",
                "recommendation": "Pass variables explicitly as function arguments or encapsulate state within a class.",
                "line": node.lineno
            })
    return issues