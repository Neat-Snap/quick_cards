from typing import List
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import logging
from app.constants import PREMIUM_TIERS
import telebot
from app.core.config import settings
from telebot.types import LabeledPrice
from app.db import (
    get_user, 
    set_user,
    get_premium_features_by_tier
)
from app.middleware import *

logger = logging.getLogger(__name__)

bot = telebot.TeleBot(settings.TELEGRAM_BOT_TOKEN)

router = APIRouter(
    prefix="/v1",
    tags=["premium"]
)

APPROVED_PAYMENTS = []

def find_tier_price(tier_number):
    for tier_item in PREMIUM_TIERS:
        if tier_item["tier"] == tier_number:
            return tier_item["price"]
    return None

def get_tier_name(tier_level):
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    return tier_names.get(tier_level, "Unknown")


@router.get("/premium/features")
async def get_premium_features():
    features = get_premium_features_by_tier(3)
    return JSONResponse(status_code=200, content=features)


@router.get("/premium/tiers")
async def get_premium_tiers():
    return JSONResponse(status_code=200, content=PREMIUM_TIERS)


@router.post("/premium/successful_payment")
async def successful_payment(request: Request):
    data = await request.json()
    if not data or "user_id" not in data or "tier" not in data or "security_code" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    user_id = data["user_id"]
    tier = data["tier"]
    security_code = data["security_code"]

    logger.info(f"Received successful payment for user {user_id} and tier {tier}")
    logger.info(f"Security code: {security_code}")

    if security_code != settings.SECURITY_CODE:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    APPROVED_PAYMENTS.append((user_id, tier))

    return JSONResponse(status_code=200, content={"success": True, "message": "Payment approved"})


@router.post("/premium/check_payment")
async def check_payment(request: Request):
    data = await request.json()
    if not data or "user_id" not in data or "tier" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})
    
    user_id = data["user_id"]
    tier = data["tier"]
    
    logger.info(f"Checking payment for user {user_id} and tier {tier}")
    logger.info(f"APPROVED_PAYMENTS: {APPROVED_PAYMENTS}")
    payment_approved = (user_id, tier) in APPROVED_PAYMENTS
    
    if payment_approved:
        APPROVED_PAYMENTS.remove((user_id, tier))
        return JSONResponse(status_code=200, content={
            "success": True, 
            "message": "Payment approved",
            "premium_status": {
                "premium_tier": tier,
                "tier_name": get_tier_name(tier),
                "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
                "is_active": True
            }
        })
    
    user_data = get_user(user_id)
    if user_data and user_data.get("premium_tier", 0) >= tier:
        return JSONResponse(status_code=200, content={
            "success": True,
            "message": "User already has this premium tier",
            "premium_status": {
                "premium_tier": user_data.get("premium_tier", 0),
                "tier_name": get_tier_name(user_data.get("premium_tier", 0)),
                "expires_at": user_data.get("premium_expires_at", None),
                "is_active": True
            }
        })
    
    return JSONResponse(status_code=400, content={"success": False, "message": "Payment not approved"})



@router.post("/premium/link")
async def generate_payment_link(request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    data = await request.json()
    if not data or "tier" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})
    
    tier = data["tier"]
    if tier < 1 or tier > 3:
        return JSONResponse(status_code=400, content={"error": "Invalid tier"})
    
    payment_link = bot.create_invoice_link(
        description=f"Premium tier {tier} - 1",
        title=f"Premium tier {tier}",
        currency="XTR",
        payload=f"premium_{user_id}_{tier}",
        provider_token=None,
        prices=[LabeledPrice(label="Label", amount=find_tier_price(tier))]
    )
    
    return JSONResponse(status_code=200, content={"success": True, "payment_url": payment_link})
    

@router.get("/premium/status")
async def get_premium_status(context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    user_data = get_user(user_id)
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    premium_tier = user_data.get("premium_tier", 0)
    premium_expires_at = user_data.get("premium_expires_at")
    
    return JSONResponse(status_code=200, content={
        "premium_tier": premium_tier,
        "tier_name": tier_names.get(premium_tier, "Unknown"),
        "expires_at": premium_expires_at.isoformat() if premium_expires_at else None,
        "is_active": premium_tier > 0 and (premium_expires_at is None or premium_expires_at > datetime.now())
    })