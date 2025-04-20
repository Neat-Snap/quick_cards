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
        # Get initData from request
        data = request.json
        init_data = data.get('initData') if data else None
        
        if not init_data:
            return jsonify({"error": "No initData provided"}), 400
        
        # For debugging
        logger.info(f"Received initData of length {len(init_data)}")
        
        # In a real implementation, you would validate the initData and extract user info
        # For now, just return a success response for testing
        return jsonify({
            "token": "test_token",
            "user": {
                "id": 1,
                "telegram_id": "12345",
                "username": "test_user",
                "name": "Test User",
                "avatar_url": None,
                "premium_tier": 0,
                "premium_expires_at": None
            },
            "is_new_user": False
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
        
        # Simple validation response for testing
        return jsonify({
            "valid": True,
            "user_id": 1,
            "telegram_id": "12345"
        })
    except Exception as e:
        logger.error(f"Error in auth_validate: {e}")
        return jsonify({"error": str(e)}), 500
