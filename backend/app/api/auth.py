from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token
import logging

from app.db.session import db
from app.db.models import User
from app.core.telegram_auth import validate_telegram_data, extract_user_info

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
    # Get init_data from request
    init_data = request.json.get("initData")
    
    if not init_data:
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
        return jsonify({"error": "No Telegram ID found in the user data"}), 400
    
    # Check if user exists in database
    user = User.query.filter_by(telegram_id=telegram_id).first()
    
    # If user doesn't exist, create new user
    if not user:
        user = User(
            telegram_id=telegram_id,
            username=user_info.get("username"),
            name=user_info.get("name"),
        )
        db.session.add(user)
        db.session.commit()
        logger.info(f"New user created with Telegram ID: {telegram_id}")
    
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
        "is_new_user": user.id is None
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