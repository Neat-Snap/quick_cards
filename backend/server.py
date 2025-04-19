"""
Server entry point that ensures consistency between app.py and app/main.py
This serves as a unified entry point regardless of which one was being used previously
"""

# Import the app from app.py
from app import app as flask_app

# Make it available as "app" for WSGI servers
app = flask_app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True) 