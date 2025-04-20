from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import logging

from app.core.config import settings
from app.db.session import db, init_db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    try:
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialized successfully!")
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)

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
    return jsonify(routes)

@app.route("/debug/db")
def debug_db():
    """Debug endpoint to check database tables"""
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    table_info = {}
    
    for table in tables:
        columns = inspector.get_columns(table)
        table_info[table] = [column['name'] for column in columns]
    
    return jsonify({
        "tables": tables,
        "table_info": table_info
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)