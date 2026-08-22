# AI Code Reviewer

A React and FastAPI application for AST-based and AI-assisted Python code review.

## Project layout

```text
backend/
	app/          FastAPI routes, services, analyzers, and database models
	alembic/      Database migrations
	tests/        Automated tests and Python review fixtures
frontend/
	src/          React pages, components, context, and API client
```

## Requirements

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Optional Gemini API key for AI findings

## Configure the backend

From the repository root:

```powershell
Copy-Item .env.example backend/.env
```

Edit `backend/.env` and set `DATABASE_URL`, `SECRET_KEY`, and `GEMINI_API_KEY`. Set `CORS_ORIGINS` to the frontend origin; comma-separated origins are supported.

## Run the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pip install -r requirements-dev.txt
alembic upgrade head
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger documentation: `http://localhost:8000/docs`

## Run the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and uses `http://localhost:8000` by default. To use another API URL, create `frontend/.env` with:

```text
VITE_API_BASE_URL=http://localhost:8000
```

## Test

Run the backend tests from `backend`:

```powershell
python -m pytest tests -q
```

The suite covers authentication, upload validation, AST metrics, static rules, scoring, AI fallback, repository persistence, analytics, and ownership behavior.

## Production checklist

- Never commit `.env` files, API keys, or generated folders.
- Use a long random `SECRET_KEY` and a production PostgreSQL account.
- Set `CORS_ORIGINS` to exact deployed frontend origins.
- Run `alembic upgrade head` during deployment.
- Put TLS termination and rate limiting in a reverse proxy or gateway.
- Keep Gemini and database errors in server logs only; return generic API errors to clients.
