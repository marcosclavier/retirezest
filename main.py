#!/usr/bin/env python3
"""
Alternative entry point for Railway deployment.
"""

import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the webapp/python-api directory to the Python path
webapp_api_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'webapp', 'python-api')
sys.path.insert(0, webapp_api_path)
logger.info(f"Added to Python path: {webapp_api_path}")

try:
    # Import the FastAPI app
    from api.main import app
    logger.info("Successfully imported FastAPI app")
except ImportError as e:
    logger.error(f"Failed to import app: {e}")
    # Fallback - try direct import
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'webapp'))
    from python_api.api.main import app
    logger.info("Successfully imported using fallback path")

# For ASGI servers
application = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False, log_level="info")