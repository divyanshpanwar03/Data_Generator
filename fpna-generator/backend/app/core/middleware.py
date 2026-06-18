import time
import os
import logging

from flask import app
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fpa_studio_security")
origins = [
    "http://localhost:5173",  # For local testing
    "https://datagenerator.vercel.app" # <--- YOUR VERCEL URL HERE
]
class EnterpriseLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log the audit trail
        logger.info(
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Duration: {process_time:.4f}s"
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
def setup_middleware(app: FastAPI):
    # 1. Add Logging
    app.add_middleware(EnterpriseLoggingMiddleware)

    # 2. Add dynamic frontend URL from environment variables
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # 3. Add CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", FRONTEND_URL],
        allow_credentials=True,
        allow_methods=["*"], 
        allow_headers=["*"], 
    )
def setup_middleware(app: FastAPI):
    # 1. Add Logging (Executes second)
    app.add_middleware(EnterpriseLoggingMiddleware)

  
app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  # Allow all origins for development; restrict in production
        allow_credentials=True,
        allow_methods=["*"], 
        allow_headers=["*"], 
    )