import ast


def analyze_code(code):
    tree = ast.parse(code)

    functions = []
    classes = []
    imports = []
    loops = []

    for node in ast.walk(tree):

        if isinstance(node, ast.FunctionDef):
            functions.append(node.name)

        elif isinstance(node, ast.ClassDef):
            classes.append(node.name)

        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            imports.append(ast.unparse(node))

        elif isinstance(node, (ast.For, ast.While)):
            loops.append(type(node).__name__)

    return {
        "functions": functions,
        "classes": classes,
        "imports": imports,
        "loops": loops
    }


code = """
import os
import json

class UserService:

    def find_user(self, user_id):
        for user in users:
            if user["id"] == user_id:
                return user

    def delete_user(self, user_id):
        pass
"""

result = analyze_code(code)

print(result)