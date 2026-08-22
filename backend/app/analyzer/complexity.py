import ast


CONTROL_FLOW_NODES = (
    ast.If,
    ast.For,
    ast.While,
    ast.Try,
    ast.With,
)


def calculate_max_nesting(tree):

    max_depth = 0

    def visit(node, depth):

        nonlocal max_depth

        if isinstance(node, CONTROL_FLOW_NODES):
            depth += 1
            max_depth = max(max_depth, depth)

        for child in ast.iter_child_nodes(node):
            visit(child, depth)

    visit(tree, 0)

    return max_depth


def calculate_cyclomatic_complexity(function_node):

    complexity = 1

    for node in ast.walk(function_node):

        if isinstance(
            node,
            (
                ast.If,
                ast.For,
                ast.While,
                ast.ExceptHandler,
            )
        ):
            complexity += 1

        elif isinstance(node, ast.BoolOp):

            complexity += len(node.values) - 1

    return complexity