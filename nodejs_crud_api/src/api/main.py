from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware import Middleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp
import time
import logging

# Configure basic logging (acts similar to morgan for Node.js)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("middleware")

# Security headers middleware (lightweight Helmet-like behavior)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds common security headers similar to helmet in Node.js."""
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Basic secure defaults - adjust as needed
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "geolocation=()")
        # Note: Do not set Content-Security-Policy by default to avoid breaking existing endpoints
        return response

# Request logging middleware (similar to morgan 'combined' but concise)
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming requests and their durations with status codes."""
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        # Read limited body for logging, but avoid consuming large payloads
        method = request.method
        path = request.url.path
        client = request.client.host if request.client else "unknown"
        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start) * 1000)
            logger.info("%s %s - %s - %sms - %s",
                        method, path, client, duration_ms, response.status_code)
            return response
        except Exception:
            duration_ms = int((time.time() - start) * 1000)
            logger.exception("Unhandled error for %s %s - %s - %sms",
                             method, path, client, duration_ms)
            # Let centralized error handler format the response
            raise

# JSON body size limiting middleware
class JSONSizeLimitMiddleware(BaseHTTPMiddleware):
    """Rejects JSON payloads larger than a configured limit."""
    def __init__(self, app: ASGIApp, max_bytes: int = 1 * 1024 * 1024):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type:
                # Starlette makes the body available via request.stream()/request.body()
                # We peek at the raw body length without parsing to fail fast
                body = await request.body()
                if len(body) > self.max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "message": "Payload too large",
                                "code": "PAYLOAD_TOO_LARGE",
                                "details": {"limit_bytes": self.max_bytes}
                            }
                        },
                    )
                # Re-inject body back so downstream handlers can read it
                async def receive_with_body():
                    return {"type": "http.request", "body": body, "more_body": False}
                request._receive = receive_with_body  # type: ignore[attr-defined]
        return await call_next(request)

# Centralized error handlers
def json_error_response(status_code: int, message: str, code: str = "ERROR", details: dict | None = None):
    payload = {
        "error": {
            "message": message,
            "code": code,
        }
    }
    if details:
        payload["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=payload)

# PUBLIC_INTERFACE
def create_app() -> FastAPI:
    """Create and configure the FastAPI application with middleware.

    Returns:
        FastAPI: The configured FastAPI app instance with middleware stack,
                 CORS, gzip, security headers, request logging, size limits,
                 and centralized error handlers.
    """
    # Define middleware stack
    middlewares = [
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Keep permissive as original
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        ),
        Middleware(GZipMiddleware, minimum_size=1000),
        Middleware(SecurityHeadersMiddleware),
        Middleware(RequestLoggingMiddleware),
        Middleware(JSONSizeLimitMiddleware, max_bytes=1 * 1024 * 1024),  # 1MB limit
        # Trusted hosts can be configured via env; default allow all to avoid breaking behavior
        # Middleware(TrustedHostMiddleware, allowed_hosts=["*"]),
    ]

    app = FastAPI(
        title="Node.js CRUD API (FastAPI runtime)",
        description="Boilerplate CRUD REST API with a standard middleware stack.",
        version="0.1.0",
        middleware=middlewares,
        openapi_tags=[
            {"name": "Health", "description": "Service health and readiness"},
        ],
    )

    # Exception handlers for consistent JSON output
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return json_error_response(
            status_code=422,
            message="Validation error",
            code="VALIDATION_ERROR",
            details={"errors": exc.errors()}
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Avoid leaking internals; log already handled by RequestLoggingMiddleware
        return json_error_response(
            status_code=500,
            message="Internal server error",
            code="INTERNAL_SERVER_ERROR"
        )

    # Keep health check lightweight (no heavy computation)
    @app.get("/", tags=["Health"], summary="Health Check", description="Lightweight service health check.")
    def health_check():
        return {"message": "Healthy"}

    return app

# Instantiate the app for ASGI servers (uvicorn/gunicorn)
app = create_app()
