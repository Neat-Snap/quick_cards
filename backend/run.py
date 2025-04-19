"""
Script to run the Flask application
This is maintained for backward compatibility
"""

# Import from the consolidated server entry point
from server import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True) 