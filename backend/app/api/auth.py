from flask import Blueprint, jsonify, request, current_app, g
from flask_jwt_extended import create_access_token
import logging

from app.db.session import db
from app.db.models import User
from app.core.telegram_auth import validate_telegram_data, extract_user_info, parse_init_data_from_url
from app.core.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint for auth routes
auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.route("/init", methods=["POST"])
def initialize_from_telegram():
    """
    Authenticate user from Telegram Mini App initialization data
    """
    # First check if init data was already processed by middleware
    if hasattr(g, 'telegram_user') and g.telegram_user and g.telegram_user.get('telegram_id'):
        user_info = g.telegram_user
        telegram_id = user_info.get('telegram_id')
    else:
        # Get init_data from various sources
        init_data = None
        
        # 1. Check request body
        if request.is_json:
            json_data = request.get_json()
            init_data = json_data.get("initData")
        
        # 2. Check URL parameter
        if not init_data and request.args.get('initData'):
            init_data = request.args.get('initData')
        
        # 3. Check for full URL with tgWebAppData
        if not init_data and request.args.get('url'):
            url = request.args.get('url')
            init_data = parse_init_data_from_url(url)
            
        # If still no init data, check if it came directly as full URL
        if not init_data:
            init_data = parse_init_data_from_url(request.url)
        
        if not init_data:
            logger.error("No initialization data provided")
            return jsonify({"error": "No initialization data provided"}), 400
        
        # Validate the data
        is_valid, data_dict, error_message = validate_telegram_data(init_data)
        
        if not is_valid:
            logger.error(f"Telegram data validation failed: {error_message}")
            return jsonify({"error": error_message}), 401
        
        # Extract user info
        user_info = extract_user_info(data_dict)
        
        if "error" in user_info:
            logger.error(f"Failed to extract user info: {user_info['error']}")
            return jsonify({"error": f"Failed to extract user info: {user_info['error']}"}), 400
        
        telegram_id = user_info.get("telegram_id")
        if not telegram_id:
            logger.error("No Telegram ID found in the user data")
            return jsonify({"error": "No Telegram ID found in the user data"}), 400
    
    # Check if user exists in database
    user = User.query.filter_by(telegram_id=telegram_id).first()
    
    # If user doesn't exist, create new user
    is_new_user = False
    if not user:
        default_settings = {
            "telegram_id": telegram_id,
            "username": user_info.get("username"),
            "name": user_info.get("name"),
            "avatar_url": user_info.get("photo_url"),
            "background_type": "color",
            "background_value": "#FFFFFF",
            "is_active": True,
            "premium_tier": 0
        }
        
        user = User(**default_settings)
        db.session.add(user)
        db.session.commit()
        is_new_user = True
        logger.info(f"New user created with Telegram ID: {telegram_id}")
        
        # Notify admins about new user if configured
        if hasattr(settings, 'ADMIN_USER_IDS') and settings.ADMIN_USER_IDS:
            try:
                # This would send notifications to admins (implementation depends on your notification system)
                admin_message = f"New user registered: {user_info.get('name')} (@{user_info.get('username')})"
                logger.info(f"Admin notification: {admin_message}")
                # You'd implement notification logic here
            except Exception as e:
                logger.error(f"Failed to notify admins: {str(e)}")
    
    # Generate token
    access_token = create_access_token(identity=telegram_id)
    
    # Return user data and token
    return jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "premium_tier": user.premium_tier,
            "premium_expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        },
        "is_new_user": is_new_user
    })


@auth_bp.route("/validate", methods=["POST"])
def validate_token():
    """
    Validate a JWT token
    """
    token = request.json.get("token")
    
    if not token:
        return jsonify({"error": "No token provided"}), 400
    
    # The @jwt_required decorator would validate the token, but we're
    # doing a simple check here to see if it's valid
    try:
        from flask_jwt_extended import decode_token
        decoded = decode_token(token)
        telegram_id = decoded.get("sub")
        
        user = User.query.filter_by(telegram_id=telegram_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "valid": True,
            "user_id": user.id,
            "telegram_id": telegram_id
        })
    except Exception as e:
        logger.error(f"Token validation failed: {str(e)}")
        return jsonify({"valid": False, "error": str(e)}), 401


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    """
    Get the current authenticated user
    """
    # Check if user was authenticated via middleware
    if hasattr(g, 'current_user') and g.current_user:
        user = g.current_user
        return jsonify({
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "premium_tier": user.premium_tier,
            "premium_expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        })
    
    # Otherwise, check for auth header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        from flask_jwt_extended import decode_token
        decoded = decode_token(token)
        telegram_id = decoded.get("sub")
        
        user = User.query.filter_by(telegram_id=telegram_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "premium_tier": user.premium_tier,
            "premium_expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        })
    except Exception as e:
        logger.error(f"Token validation failed: {str(e)}")
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401 