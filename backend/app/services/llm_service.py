import json
import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY
)


MODEL_NAME = "gemini-3.6-flash"


def review_code_with_llm(code: str) -> dict:
    """
    Send Python source code to Gemini and return
    a structured AI code review.
    """

    prompt = f"""
You are an expert software engineer and security-focused code reviewer.

Review the following Python code.

Return ONLY a valid JSON object.

Required structure:

{{
  "summary": "Short overall assessment",
  "security": [
    {{
      "title": "Issue title",
      "severity": "high",
      "description": "What is wrong",
      "impact": "Potential impact",
      "recommendation": "How to fix it"
    }}
  ],
  "bugs": [
    {{
      "title": "Issue title",
      "severity": "medium",
      "description": "What is wrong",
      "impact": "Potential impact",
      "recommendation": "How to fix it"
    }}
  ],
  "quality": [
    {{
      "title": "Issue title",
      "severity": "low",
      "description": "What is wrong",
      "impact": "Potential impact",
      "recommendation": "How to fix it"
    }}
  ],
  "performance": [
    {{
      "title": "Issue title",
      "severity": "low",
      "description": "What is wrong",
      "impact": "Potential impact",
      "recommendation": "How to fix it"
    }}
  ],
  "recommendations": [
    "General improvement recommendation"
  ]
}}

Rules:

- Return ONLY JSON.
- No Markdown.
- No ```json code fences.
- No text before or after the JSON.
- Only report issues supported by the code.
- Do not invent vulnerabilities.
- Severity must be one of: high, medium, low.
- Use empty arrays when there are no issues.

Python code:

{code}
"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config={
            "response_mime_type": "application/json"
        }
    )

    if not response.text:
        return {
            "summary": "Gemini did not return a review.",
            "security": [],
            "bugs": [],
            "quality": [],
            "performance": [],
            "recommendations": []
        }

    try:
        return json.loads(response.text)

    except json.JSONDecodeError:
        return {
            "summary": "Gemini returned an invalid structured response.",
            "security": [],
            "bugs": [],
            "quality": [],
            "performance": [],
            "recommendations": []
        }