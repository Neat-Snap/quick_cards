from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.core.config import settings
from app.db.session import db, init_db


# Create the Flask app
app = Flask(__name__)

# Configure the app
app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = settings.SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

from app.api.routes import register_routes
from app.middleware.telegram_auth import init_telegram_auth_middleware

# Initialize Telegram authentication middleware
init_telegram_auth_middleware(app)

# Register API routes
register_routes(app)

# Initialize the database
with app.app_context():
    init_db()

# Health check endpoint
@app.route("/health")
def health_check():
    return jsonify({"status": "ok"})

@app.route("/debug/routes")
def debug_routes():
    """Debug endpoint to list all registered routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            "endpoint": rule.endpoint,
            "methods": list(rule.methods),
            "path": str(rule)
        })
    return jsonify(routes), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)