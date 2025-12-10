"""
FastAPI server for retirement simulation calculations.
Wraps existing Python logic from modules/ and utils/.

This API provides endpoints for:
- Running retirement simulations
- Analyzing asset composition
- Optimizing withdrawal strategies
- Monte Carlo analysis
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG to see withdrawal loop details
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load resources on startup, cleanup on shutdown."""
    logger.info("🚀 Starting Retirement Simulation API")

    try:
        # Load tax config
        from modules.config import load_tax_config
        tax_config_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "tax_config_canada_2025.json"
        )
        app.state.tax_cfg = load_tax_config(tax_config_path)
        logger.info("✅ Tax configuration loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load tax configuration: {e}")
        raise

    yield

    logger.info("👋 Shutting down Retirement Simulation API")

# Initialize FastAPI app
app = FastAPI(
    title="Retirement Simulation API",
    description="Tax-optimized retirement planning calculations for Canadian households",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
ALLOWED_ORIGINS = [
    "https://www.retirezest.com",               # Production domain
    "https://retirezest.com",                   # Production domain (no www)
]

# Regex pattern to allow localhost on any port and Vercel preview deployments
ALLOW_ORIGIN_REGEX = r"(http://localhost:\d+|http://127\.0\.0\.1:\d+|https://.*\.vercel\.app)"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOW_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please contact support.",
            "details": str(exc) if app.debug else None
        }
    )

# Import and register routers
try:
    from api.routes import simulation, optimization, monte_carlo

    app.include_router(simulation.router, prefix="/api", tags=["simulation"])
    app.include_router(optimization.router, prefix="/api", tags=["optimization"])
    app.include_router(monte_carlo.router, prefix="/api", tags=["monte-carlo"])

    logger.info("✅ All route modules loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️  Some route modules not yet created: {e}")
    # Continue anyway - routes will be added incrementally

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Retirement Simulation API",
        "status": "healthy",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": {
            "health": "/api/health",
            "simulation": "/api/run-simulation",
            "composition": "/api/analyze-composition",
            "optimization": "/api/optimize-strategy",
            "monte_carlo": "/api/monte-carlo"
        }
    }

# Health check endpoint
@app.get("/api/health")
async def health_check(request: Request):
    """
    Health check endpoint for monitoring and load balancers.

    Returns:
        - status: "ok" if service is healthy
        - tax_config_loaded: True if tax configuration loaded successfully
        - version: API version
    """
    tax_cfg_loaded = hasattr(request.app.state, "tax_cfg")

    return {
        "status": "ok",
        "service": "Retirement Simulation API",
        "version": "1.0.0",
        "tax_config_loaded": tax_cfg_loaded,
        "ready": tax_cfg_loaded
    }

# Readiness probe (K8s/Railway)
@app.get("/api/ready")
async def readiness_check(request: Request):
    """
    Readiness probe for container orchestration.
    Returns 200 if service is ready to handle requests.
    """
    if not hasattr(request.app.state, "tax_cfg"):
        return JSONResponse(
            status_code=503,
            content={"ready": False, "reason": "Tax configuration not loaded"}
        )

    return {"ready": True}

# Liveness probe (K8s/Railway)
@app.get("/api/live")
async def liveness_check():
    """
    Liveness probe for container orchestration.
    Returns 200 if service is alive (even if not ready).
    """
    return {"alive": True}

if __name__ == "__main__":
    import uvicorn

    # Get port from environment or default to 8000
    port = int(os.environ.get("PORT", 8000))

    logger.info(f"Starting server on port {port}")

    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,  # Enable auto-reload in development
        log_level="info"
    )
