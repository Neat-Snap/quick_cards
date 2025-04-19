from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

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
from app.api.auth import auth_bp
from app.api.routes import users_bp, premium_bp, register_routes

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(premium_bp)

# Initialize the telegram auth middleware if available
try:
    from app.middleware.telegram_auth import init_telegram_auth_middleware
    init_telegram_auth_middleware(app)
except ImportError:
    print("Telegram auth middleware not available")

# Health check endpoint
@app.route("/health")
def health_check():
    return jsonify({"status": "ok"})

# Create tables and run the app
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=8000, debug=True) 