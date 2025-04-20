from typing import List
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import logging

from app.db.session import db
from app.db.models import User, PremiumFeature

logger = logging.getLogger(__name__)

# Create blueprint for premium routes
premium_bp = Blueprint("premium", __name__, url_prefix="/v1")

# Import the helper function
from app.middleware.auth import get_current_user as get_authenticated_user

# Premium tier definitions (consolidated in one place)
PREMIUM_TIERS = [
    {
        "tier": 1,
        "name": "Basic",
        "price": 4.99,
        "description": "Basic premium features for your card",
        "features": [
            "Custom Background Image",
            "Custom Badge",
            "Skills"
        ]
    },
    {
        "tier": 2,
        "name": "Premium",
        "price": 9.99,
        "description": "Enhanced premium features for your card",
        "features": [
            "Custom Background Image",
            "Custom Badge",
            "Skills",
            "Extended Projects",
            "Animated Elements",
            "Custom Links"
        ]
    },
    {
        "tier": 3,
        "name": "Ultimate",
        "price": 19.99,
        "description": "Complete premium package for your card",
        "features": [
            "Custom Background Image",
            "Custom Badge",
            "Skills",
            "Extended Projects",
            "Animated Elements",
            "Custom Links",
            "Verified Badge",
            "Video Upload"
        ]
    }
]


@premium_bp.route("/premium/features", methods=["GET"])
def get_premium_features():
    """Get all premium features"""
    features = PremiumFeature.query.all()
    
    return jsonify([
        {
            "id": feature.id,
            "name": feature.name,
            "description": feature.description,
            "tier_required": feature.tier_required
        } for feature in features
    ])

@premium_bp.route("/premium/tiers", methods=["GET"])
def get_premium_tiers():
    """Get all premium tiers with their features"""
    return jsonify(PREMIUM_TIERS)

@premium_bp.route("/premium/subscribe", methods=["POST"])
def subscribe():
    """Subscribe to a premium tier"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data or "tier" not in data or "payment_method" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if tier exists
    tier = data["tier"]
    if tier < 1 or tier > 3:
        return jsonify({"error": "Invalid tier"}), 400
    
    # Simulate payment integration - in a real app, this would call a payment API
    payment_url = None
    if data["payment_method"] == "telegram":
        payment_url = f"https://t.me/YourPaymentBot?start=premium_{tier}_{user.id}"
    elif data["payment_method"] == "card":
        payment_url = f"https://payment.example.com/premium?tier={tier}&user_id={user.id}"
    else:
        return jsonify({"error": "Invalid payment method"}), 400
    
    # For demo purposes, we'll just simulate a successful payment and activate the subscription
    # In a real app, this would be handled by a webhook from the payment provider
    user.premium_tier = tier
    user.premium_expires_at = datetime.now() + timedelta(days=30)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Successfully subscribed to {['Basic', 'Premium', 'Ultimate'][tier-1]} tier",
        "payment_url": payment_url
    })

@premium_bp.route("/premium/status", methods=["GET"])
def get_premium_status():
    """Get user's premium status"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    
    return jsonify({
        "premium_tier": user.premium_tier,
        "tier_name": tier_names.get(user.premium_tier, "Unknown"),
        "expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        "is_active": user.premium_tier > 0 and (user.premium_expires_at is None or user.premium_expires_at > datetime.now())
    })