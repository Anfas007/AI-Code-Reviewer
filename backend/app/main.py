import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.review import router as review_router
from app.api.auth import router as auth_router


load_dotenv()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173"
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="AI Code Auto Reviewer",
    description="API for automated Python code review",
    version="1.0.0"
)

# --------------------------------------------------------
# Add CORS Middleware to allow requests from React
# --------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "AI Code Auto Reviewer API is running"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }