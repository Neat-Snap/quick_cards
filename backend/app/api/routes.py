from flask import Blueprint, jsonify, request, current_app, g
import logging

# Import all database functions from app.db package
from app.db import get_user

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
    
    # Fall back to the user ID query param
    user_id = request.args.get("user_id")
    if not user_id:
        return None, (jsonify({
            "error": "No authentication data provided. Please include Telegram init data or user_id parameter"
        }), 400)
    
    # Get user using the database function
    user_data = get_user(user_id)
    if not user_data:
        return None, (jsonify({"error": "User not found"}), 404)
    
    # Create a simple object to match the expected user object interface
    # This allows existing code to continue working without major changes
    class UserObject:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
    
    user_obj = UserObject(**user_data)
    return user_obj, None


def register_routes(app):
    """Register API routes with the Flask app"""
    # Import all blueprints from their respective modules
    from app.api.auth import auth_bp
    from app.api.users import users_bp
    from app.api.premium import premium_bp
    from app.api.file_routes import files_bp
    
    # Register all blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(premium_bp)
    app.register_blueprint(files_bp)
    
    # Log registration for debugging
    logger.info(f"Registered auth_bp: {auth_bp.url_prefix}")
    logger.info(f"Registered users_bp: {users_bp.url_prefix}")
    logger.info(f"Registered premium_bp: {premium_bp.url_prefix}")
    
    return app