from flask import Blueprint, jsonify, request, current_app, g
import logging

from app.db.session import db
from app.db.models import User

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Remove the duplicate blueprint definitions here
# We'll import them from their respective modules instead

# Helper function to get current user from telegram auth or query param
def get_authenticated_user():
    """
    Helper function to get the authenticated user from either Telegram auth data
    or telegram_id query parameter
    
    Returns:
        Tuple of (user, error_response)
        - If user is found, returns (user, None)
        - If no user is found, returns (None, error_response)
    """
    # First try to get user from Telegram auth data
    if hasattr(g, 'current_user') and g.current_user:
        return g.current_user, None
    
    # Fall back to the telegram_id query param
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return None, (jsonify({
            "error": "No authentication data provided. Please include Telegram init data or telegram_id parameter"
        }), 400)
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    
    return user, None


def register_routes(app):
    """Register API routes with the Flask app"""
    # Import all blueprints from their respective modules
    from app.api.auth import auth_bp
    from app.api.users import users_bp
    from app.api.premium import premium_bp
    
    # Register all blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(premium_bp)
    
    # Log registration for debugging
    logger.info(f"Registered auth_bp: {auth_bp.url_prefix}")
    logger.info(f"Registered users_bp: {users_bp.url_prefix}")
    logger.info(f"Registered premium_bp: {premium_bp.url_prefix}")
    
    return app