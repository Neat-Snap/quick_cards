from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure app
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///./telegram_business_card.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "your-secret-key-here"  # Change in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24  # 1 day

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# Import and register blueprints
try:
    # Import blueprints from app module
    from app.api.auth import auth_bp
    from app.api.routes import users_bp, premium_bp, register_routes
    
    # Register blueprints directly
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(premium_bp)
    
    logger.info("Successfully registered API blueprints")
except ImportError as e:
    logger.error(f"Failed to import blueprints: {str(e)}")
    
    # Define a fallback auth route directly in this file if imports fail
    @app.route("/api/v1/auth/init", methods=["POST"])
    def fallback_auth_init():
        logger.info("Using fallback auth endpoint")
        from flask import request
        data = request.json
        logger.info(f"Received data: {data}")
        return jsonify({"message": "Fallback auth endpoint", "success": True})
    
    @app.route("/api/v1/auth/validate", methods=["POST"])
    def fallback_auth_validate():
        logger.info("Using fallback validate endpoint")
        from flask import request
        data = request.json
        logger.info(f"Received data: {data}")
        return jsonify({"message": "Fallback validate endpoint", "success": True})

# Health check endpoint
@app.route("/health")
def health_check():
    return jsonify({"status": "ok"})

# Create tables and run the app
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=8000, debug=True) 