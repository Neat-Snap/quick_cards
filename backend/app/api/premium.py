from typing import List
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import logging
from app.constants import PREMIUM_TIERS
import telebot
from app.core.config import settings
from telebot.types import LabeledPrice

# Import all database functions from app.db package
from app.db import (
    get_user, 
    set_user,
    get_premium_features_by_tier
)

logger = logging.getLogger(__name__)

bot = telebot.TeleBot(settings.TELEGRAM_BOT_TOKEN)

# Create blueprint for premium routes
premium_bp = Blueprint("premium", __name__, url_prefix="/v1")

# Import the helper function
from app.middleware.auth import get_current_user as get_authenticated_user

APPROVED_PAYMENTS = []

# In premium.py
def find_tier_price(tier_number):
    for tier_item in PREMIUM_TIERS:  # Change to tier_item
        if tier_item["tier"] == tier_number:
            return tier_item["price"]
    return None

def get_tier_name(tier_level):
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    return tier_names.get(tier_level, "Unknown")


@premium_bp.route("/premium/features", methods=["GET"])
def get_premium_features():
    """Get all premium features"""
    # Get all features for the highest tier (3) to include all features
    features = get_premium_features_by_tier(3)
    return jsonify(features)

@premium_bp.route("/premium/tiers", methods=["GET"])
def get_premium_tiers():
    """Get all premium tiers with their features"""
    return jsonify(PREMIUM_TIERS)

@premium_bp.route("/premium/successful_payment", methods=["POST"])
def successful_payment():
    """Handle successful payment"""
    data = request.json
    if not data or "user_id" not in data or "tier" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    user_id = data["user_id"]
    tier = data["tier"]

    APPROVED_PAYMENTS.append((user_id, tier))

    return jsonify({"success": True, "message": "Payment approved"}), 200



@premium_bp.route("/premium/check_payment", methods=["POST"])
def check_payment():
    """Check if a payment is approved"""
    data = request.json
    if not data or "user_id" not in data or "tier" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    user_id = data["user_id"]
    tier = data["tier"]
    
    # Check if payment exists in approved payments
    logger.info(f"Checking payment for user {user_id} and tier {tier}")
    logger.info(f"APPROVED_PAYMENTS: {APPROVED_PAYMENTS}")
    payment_approved = (user_id, tier) in APPROVED_PAYMENTS
    
    # If payment is approved in memory, remove it
    if payment_approved:
        APPROVED_PAYMENTS.remove((user_id, tier))
        return jsonify({
            "success": True, 
            "message": "Payment approved",
            "premium_status": {
                "premium_tier": tier,
                "tier_name": get_tier_name(tier),
                "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
                "is_active": True
            }
        }), 200
    
    # If not in memory, check the user's current premium status
    user_data = get_user(user_id)
    if user_data and user_data.get("premium_tier", 0) >= tier:
        # User already has this tier or higher
        return jsonify({
            "success": True,
            "message": "User already has this premium tier",
            "premium_status": {
                "premium_tier": user_data.get("premium_tier", 0),
                "tier_name": get_tier_name(user_data.get("premium_tier", 0)),
                "expires_at": user_data.get("premium_expires_at", None),
                "is_active": True
            }
        }), 200
    
    return jsonify({"success": False, "message": "Payment not approved"}), 400



# @premium_bp.route("/premium/subscribe", methods=["POST"])
# def subscribe():
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
    
    # Get current user data
    user_data = get_user(user.id)
    if not user_data:
        return jsonify({"error": "User not found"}), 404
    
    # Update premium tier and expiration
    user_data["premium_tier"] = tier
    user_data["premium_expires_at"] = datetime.now() + timedelta(days=30)
    
    # Save updated user data
    set_user(user_data)
    
    return jsonify({
        "success": True,
        "message": f"Successfully subscribed to {['Basic', 'Premium', 'Ultimate'][tier-1]} tier",
        "payment_url": payment_url
    })




@premium_bp.route("/premium/link", methods=["POST"])
def generate_payment_link():
    """Generate a payment link for a premium tier"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data or "tier" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    tier = data["tier"]
    if tier < 1 or tier > 3:
        return jsonify({"error": "Invalid tier"}), 400
    
    return jsonify({"success": True, "payment_url": bot.create_invoice_link(description=f"Premium tier {tier} - 1",
                                                                            title=f"Premium tier {tier}",
                                                                            currency="XTR",
                                                                            payload=f"premium_{user.id}_{tier}",
                                                                            provider_token=None,
                                                                            prices=[LabeledPrice(label="Label", amount=find_tier_price(tier))])})
    
    

@premium_bp.route("/premium/status", methods=["GET"])
def get_premium_status():
    """Get user's premium status"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get user data from db function
    user_data = get_user(user.id)
    if not user_data:
        return jsonify({"error": "User not found"}), 404
    
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    premium_tier = user_data.get("premium_tier", 0)
    premium_expires_at = user_data.get("premium_expires_at")
    
    return jsonify({
        "premium_tier": premium_tier,
        "tier_name": tier_names.get(premium_tier, "Unknown"),
        "expires_at": premium_expires_at.isoformat() if premium_expires_at else None,
        "is_active": premium_tier > 0 and (premium_expires_at is None or premium_expires_at > datetime.now())
    })