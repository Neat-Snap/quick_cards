"""
Authentication routes for the Telegram Business Card backend.
"""

from flask import Blueprint, jsonify, request, current_app, g
from flask_jwt_extended import create_access_token
import logging

# Create blueprint for auth routes
auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

@auth_bp.route("/auth_health", methods=["GET"])
def auth_health():
    """
    Health check endpoint for the auth service
    """
    return jsonify({"status": "ok"})

@auth_bp.route("/init", methods=["POST"])
def initialize_from_telegram():
    """
    Authenticate user from Telegram Mini App initialization data
    """
    logger = logging.getLogger(__name__)
    logger.info("Auth init endpoint called")
    
    try:
        # Check if middleware already processed telegram data
        if hasattr(g, 'telegram_user') and g.telegram_user:
            telegram_id = g.telegram_user.get('telegram_id')
            user_info = g.telegram_user
        else:
            # Get initData from request if middleware didn't process it
            data = request.json
            init_data = data.get('initData') if data else None
            
            if not init_data:
                return jsonify({"error": "No initData provided"}), 400
                
            # Validate the data
            is_valid, data_dict, error_message = validate_telegram_data(init_data)
            
            if not is_valid:
                return jsonify({"error": f"Invalid initData: {error_message}"}), 400
                
            # Extract user info
            user_info = extract_user_info(data_dict)
            telegram_id = user_info.get('telegram_id')
            
            if not telegram_id:
                return jsonify({"error": "Could not extract Telegram user ID"}), 400
        
        # Get or create user
        is_new_user = False
        user = User.query.filter_by(telegram_id=telegram_id).first()
        
        if not user:
            is_new_user = True
            user = User(
                telegram_id=telegram_id,
                username=user_info.get('username'),
                name=user_info.get('name')
            )
            db.session.add(user)
            db.session.commit()
        
        # Create real JWT token
        token = create_access_token(identity=str(user.id))
        
        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "telegram_id": user.telegram_id,
                "username": user.username,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "premium_tier": user.premium_tier,
                "premium_expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None
            },
            "is_new_user": is_new_user
        })
    except Exception as e:
        logger.error(f"Error in auth_init: {e}")
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/validate", methods=["POST"])
def validate_token():
    """
    Validate a JWT token
    """
    logger = logging.getLogger(__name__)
    logger.info("Auth validate endpoint called")
    
    try:
        data = request.json
        token = data.get('token') if data else None
        
        if not token:
            return jsonify({"error": "No token provided"}), 400
        
        # Use JWT library to validate token
        from flask_jwt_extended import decode_token
        try:
            decoded = decode_token(token)
            user_id = decoded['sub']  # 'sub' is the JWT subject (user id)
            
            # Find the user
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
                
            return jsonify({
                "valid": True,
                "user_id": user.id,
                "telegram_id": user.telegram_id
            })
        except Exception as e:
            return jsonify({"valid": False, "error": str(e)}), 401
            
    except Exception as e:
        logger.error(f"Error in auth_validate: {e}")
        return jsonify({"error": str(e)}), 500
