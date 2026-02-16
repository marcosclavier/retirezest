#!/usr/bin/env python3
"""
Entry point for Railway deployment.
This file helps Railway detect the Python project and provides a clear entry point.
"""

import sys
import os

# Add the webapp/python-api directory to the Python path
webapp_api_path = os.path.join(os.path.dirname(__file__), 'webapp', 'python-api')
sys.path.insert(0, webapp_api_path)

# Now we can import from the api module
from api.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)