from functools import wraps
from flask import request, jsonify, g
import logging
import urllib.parse

from app.core.telegram_auth import validate_telegram_data, extract_user_info, parse_init_data_from_url
from app.db.models import User

logger = logging.getLogger(__name__)

def init_telegram_auth_middleware(app):
    """
    Initialize the Telegram auth middleware for the Flask app.
    This will process Telegram auth data from appropriate requests.
    """
    @app.before_request
    def process_telegram_data():
        # Check for init data in multiple places with the following priority:
        # 1. X-Telegram-Init-Data header (for API calls)
        # 2. tgWebAppData URL parameter (for initial page load)
        # 3. initData in request body (for auth endpoint)
        
        init_data = None
        
        # 1. Check for header
        init_data = request.headers.get('X-Telegram-Init-Data')
        
        # 2. Check URL parameters for tgWebAppData
        if not init_data and request.args:
            # Get the full URL to extract tgWebAppData
            full_url = request.url
            init_data = parse_init_data_from_url(full_url)
            
        # 3. Check request body for initData (common in POST to auth endpoint)
        if not init_data and request.is_json:
            body_data = request.get_json(silent=True)
            if body_data and 'initData' in body_data:
                init_data = body_data['initData']
        
        # If we didn't find init data anywhere, just continue
        if not init_data:
            return None
        
        # Log that we found init data (debug level)
        logger.debug(f"Processing Telegram init data from: {request.path}")
        
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
            if user:
                g.current_user = user
                logger.debug(f"User authenticated: {telegram_id}")
            else:
                logger.debug(f"User not found in database: {telegram_id}")
        
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

from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def auth_required(f):
    """
    Unified decorator for authentication - tries JWT first, then Telegram auth
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First try JWT auth
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user:
                g.current_user = user
                return f(*args, **kwargs)
        except Exception:
            pass  # Fall through to other auth methods
            
        # Check if Telegram middleware authenticated the user
        if hasattr(g, 'current_user') and g.current_user:
            return f(*args, **kwargs)
            
        # As a last resort, try telegram_id param (for development/testing)
        telegram_id = request.args.get("telegram_id")
        if telegram_id:
            user = User.query.filter_by(telegram_id=telegram_id).first()
            if user:
                g.current_user = user
                return f(*args, **kwargs)
                
        # All auth methods failed
        return jsonify({
            "error": "Authentication required. Please provide valid JWT token or Telegram authentication."
        }), 401
        
    return decorated_function