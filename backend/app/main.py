import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.review import router as review_router
from app.api.auth import router as auth_router


load_dotenv()

# --------------------------------------------------------
# Logging
# --------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

logger = logging.getLogger("syntax_sentinel")


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
# CORS
# --------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------
# Global Exception Handler
# --------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "Unhandled exception: %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error"
        },
    )


# --------------------------------------------------------
# Routers
# --------------------------------------------------------
app.include_router(review_router)
app.include_router(auth_router)


# --------------------------------------------------------
# Root
# --------------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "AI Code Auto Reviewer API is running"
    }


# --------------------------------------------------------
# Health Check
# --------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
