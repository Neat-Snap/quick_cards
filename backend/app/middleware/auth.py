"""
Unified authentication handling for the application
"""
from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import logging

from app.db.models import User

logger = logging.getLogger(__name__)

def auth_required(f):
    """
    Unified authentication decorator that tries:
    1. JWT token (from Authorization header)
    2. Telegram data (from middleware)
    3. telegram_id parameter (for development only)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First try JWT authentication
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user:
                g.current_user = user
                return f(*args, **kwargs)
        except Exception as e:
            logger.debug(f"JWT auth failed: {str(e)}")
            # Continue to next auth method
            
        # Check if Telegram middleware already authenticated the user
        if hasattr(g, 'current_user') and g.current_user:
            return f(*args, **kwargs)
            
        # Last resort: try telegram_id parameter (development/testing only)
        telegram_id = request.args.get("telegram_id")
        if telegram_id:
            user = User.query.filter_by(id=telegram_id).first()
            if user:
                g.current_user = user
                return f(*args, **kwargs)
                
        # All authentication methods failed
        return jsonify({
            "error": "Authentication required. Please provide JWT token or valid Telegram authentication."
        }), 401
        
    return decorated_function

def get_current_user():
    """
    Helper function to get the authenticated user
    
    Returns:
        Tuple of (user, error_response)
        - If user is found, returns (user, None)
        - If no user is found, returns (None, error_response)
    """
    # User should be set by auth_required decorator or middleware
    if hasattr(g, 'current_user') and g.current_user:
        return g.current_user, None
    
    # Fallback for endpoints not using auth_required decorator
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return None, (jsonify({
            "error": "Authentication required. Please provide JWT token or Telegram authentication."
        }), 401)
    
    user = User.query.filter_by(id=telegram_id).first()
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    
    return user, None