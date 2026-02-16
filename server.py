#!/usr/bin/env python3
"""
Simple server entry point for Railway.
This is the most straightforward way to start the app.
"""

import os
import sys

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'webapp', 'python-api'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'webapp'))

# Try different import methods
try:
    from api.main import app
    print("Imported from api.main")
except:
    try:
        from python_api.api.main import app
        print("Imported from python_api.api.main")
    except:
        # Last resort - import directly
        import webapp.python_api.api.main
        app = webapp.python_api.api.main.app
        print("Imported using full path")

# Start server
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting FastAPI server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)