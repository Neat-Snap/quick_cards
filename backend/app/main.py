"""
Main application entry point
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import logging
import os
import threading

from app.core.config import settings
from app.db.session import db

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
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

# Import routes and middleware after app creation to avoid circular imports
from app.api.routes import register_routes
from app.middleware.telegram_auth import init_telegram_auth_middleware

# Initialize Telegram authentication middleware
init_telegram_auth_middleware(app)

# Register API routes
register_routes(app)

# Initialize the database with app context
with app.app_context():
    try:
        logger.info("Starting database initialization in app context...")
        from app.db.init_db import init_db
        
        # Check database file existence for SQLite
        if settings.USE_SQLITE:
            db_path = settings.DATABASE_URL.replace('sqlite:///', '')
            if not os.path.exists(db_path):
                logger.info(f"Database file '{db_path}' does not exist, it will be created")
            else:
                logger.info(f"Database file '{db_path}' exists, size: {os.path.getsize(db_path)} bytes")
        
        # Initialize database
        success = init_db()
        
        if success:
            logger.info("Database initialization completed successfully")
        else:
            logger.error("Database initialization failed - check logs for details")
            
    except Exception as e:
        logger.error(f"Error during database initialization: {e}", exc_info=True)

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
    
    # Also get some sample counts
    row_counts = {}
    for table in tables:
        try:
            count = db.session.execute(f"SELECT COUNT(*) FROM {table}").scalar()
            row_counts[table] = count
        except Exception as e:
            row_counts[table] = f"Error: {str(e)}"
    
    return jsonify({
        "tables": tables,
        "table_info": table_info,
        "row_counts": row_counts
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)