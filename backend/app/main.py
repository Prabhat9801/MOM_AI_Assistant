"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database.session import engine, Base
from app.api.router import api_router
from app.services.scheduler_service import start_scheduler, shutdown_scheduler

settings = get_settings()

# Ensure upload directory exists before mounting StaticFiles
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-Powered Minutes of Meeting Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Add global validation error handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging
from fastapi import Request

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger = logging.getLogger("meeting_creation")
    logger.error("Validation error: %s", exc.errors())
    logger.error("Request body: %s", await request.body())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": await request.body()},
    )

app.add_exception_handler(RequestValidationError, validation_exception_handler)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}


