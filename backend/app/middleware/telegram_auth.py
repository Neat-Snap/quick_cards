from functools import wraps
from flask import request, jsonify, g
import logging

from app.core.telegram_auth import validate_telegram_data, extract_user_info
from app.db.models import User

logger = logging.getLogger(__name__)

def init_telegram_auth_middleware(app):
    """
    Initialize the Telegram auth middleware for the Flask app.
    This will process Telegram auth data from appropriate requests.
    """
    @app.before_request
    def process_telegram_data():
        # Only process if the 'X-Telegram-Init-Data' header is present
        init_data = request.headers.get('X-Telegram-Init-Data')
        if not init_data:
            return None
        
        # Validate the data
        is_valid, data_dict, error_message = validate_telegram_data(init_data)
        
        if not is_valid:
            logger.warning(f"Invalid Telegram data: {error_message}")
            # We don't abort here, just store the error for later use if needed
            g.telegram_auth_error = error_message
            return None
        
        # Extract user info
        user_info = extract_user_info(data_dict)
        
        # Store in Flask's global context for this request
        g.telegram_data = data_dict
        g.telegram_user = user_info
        
        # Try to find user in the database
        telegram_id = user_info.get('telegram_id')
        if telegram_id:
            user = User.query.filter_by(telegram_id=telegram_id).first()
            g.current_user = user
        
        return None


def telegram_auth_required(f):
    """
    Decorator to require valid Telegram authentication data
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if telegram auth was processed
        if not hasattr(g, 'telegram_data'):
            return jsonify({
                "error": "Missing Telegram authentication data. Please ensure the X-Telegram-Init-Data header is included."
            }), 401
        
        # Check if there was an error during validation
        if hasattr(g, 'telegram_auth_error'):
            return jsonify({
                "error": f"Telegram authentication failed: {g.telegram_auth_error}"
            }), 401
        
        # Check if we have a user
        if not hasattr(g, 'telegram_user') or not g.telegram_user.get('telegram_id'):
            return jsonify({
                "error": "Could not extract Telegram user information"
            }), 401
        
        # Success, proceed with the request
        return f(*args, **kwargs)
    
    return decorated_function 