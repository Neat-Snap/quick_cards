from flask import Blueprint, jsonify, request, current_app, g
from flask_jwt_extended import create_access_token, decode_token
import logging

# Import all database functions from app.db package
from app.db import get_user, create_user, set_user
from app.core.telegram_auth import validate_telegram_data, extract_user_info

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint for auth routes
auth_bp = Blueprint("auth", __name__, url_prefix="/v1/auth")

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
    logger.info("Auth init endpoint called")
    
    try:
        # Check if middleware already processed telegram data
        if hasattr(g, 'telegram_user') and g.telegram_user:
            telegram_id = g.telegram_user.get('telegram_id')
            user_info = g.telegram_user
            logger.info(f"Using telegram_user from middleware: {telegram_id}")
        else:
            # Get initData from request if middleware didn't process it
            data = request.json
            init_data = data.get('initData') if data else None
            
            if not init_data:
                return jsonify({
                    "success": False,
                    "error": "No initData provided"
                }), 400
                
            # Validate the data
            is_valid, data_dict, error_message = validate_telegram_data(init_data)
            
            if not is_valid:
                return jsonify({
                    "success": False,
                    "error": f"Invalid initData: {error_message}"
                }), 400
                
            # Extract user info
            user_info = extract_user_info(data_dict)
            telegram_id = user_info.get('telegram_id')
            
            if not telegram_id:
                return jsonify({
                    "success": False,
                    "error": "Could not extract Telegram user ID"
                }), 400
        
        # Get or create user
        is_new_user = False
        user_id = str(telegram_id)  # Use the telegram_id as the user ID
        user_data = get_user(user_id)
        
        if not user_data:
            is_new_user = True
            logger.info(f"Creating new user with id: {user_id}")
            
            # Create new user with proper field mapping
            success = create_user(
                user_id=user_id,
                username=user_info.get('username', ''),
                name=user_info.get('first_name', '') + (f" {user_info.get('last_name', '')}" if user_info.get('last_name') else ''),
                avatar_url=user_info.get('photo_url', ''),
                background_type="color",
                background_value="#f0f0f0",
                description="",
                badge="New User"
            )
            
            if not success:
                return jsonify({
                    "success": False,
                    "error": "Failed to create user"
                }), 500
                
            user_data = get_user(user_id)
            if not user_data:
                return jsonify({
                    "success": False,
                    "error": "User created but could not be retrieved"
                }), 500
                
            logger.info(f"New user created with ID: {user_id}")
        
        # Create real JWT token
        token = create_access_token(identity=str(user_id))
        
        # Format user data according to frontend expectations
        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "username": user_data.get("username", ""),
                "first_name": user_info.get('first_name', ''),
                "last_name": user_info.get('last_name', ''),
                "avatar": user_data.get("avatar_url", ""),
                "background_color": user_data.get("background_value", "#f0f0f0") if user_data.get("background_type", "") == "color" else "#f0f0f0",
                "description": user_data.get("description", ""),
                "badge": user_data.get("badge", "New User"),
                "is_premium": user_data.get("premium_tier", 0) > 0
            },
            "is_new_user": is_new_user
        })
    except Exception as e:
        logger.error(f"Error in auth_init: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@auth_bp.route("/validate", methods=["POST"])
def validate_token():
    """
    Validate a JWT token
    """
    logger.info("Auth validate endpoint called")
    
    try:
        data = request.json
        token = data.get('token') if data else None
        
        if not token:
            return jsonify({
                "success": False,
                "error": "No token provided"
            }), 400
        
        # Use JWT library to validate token
        try:
            decoded = decode_token(token)
            user_id = decoded['sub']  # 'sub' is the JWT subject (user id)
            
            # Find the user
            user_data = get_user(user_id)
            if not user_data:
                return jsonify({
                    "success": False,
                    "error": "User not found"
                }), 404
                
            return jsonify({
                "success": True,
                "valid": True,
                "user_id": user_id
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "valid": False,
                "error": str(e)
            }), 401
            
    except Exception as e:
        logger.error(f"Error in auth_validate: {e}", exc_info=True)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500