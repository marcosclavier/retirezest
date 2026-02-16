#!/usr/bin/env python3
"""
Alternative entry point for Railway deployment.
"""

import sys
import os

# Add the webapp/python-api directory to the Python path
webapp_api_path = os.path.join(os.path.dirname(__file__), 'webapp', 'python-api')
sys.path.insert(0, webapp_api_path)

# Import the FastAPI app
from api.main import app

# For ASGI servers
application = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, log_level="info")