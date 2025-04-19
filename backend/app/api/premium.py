from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.session import get_db
from app.db import models
from app.schemas import premium as schemas

router = APIRouter()


@router.get("/premium/features/", response_model=List[schemas.PremiumFeature])
def get_premium_features(db: Session = Depends(get_db)):
    """Get all premium features"""
    return db.query(models.PremiumFeature).all()


@router.get("/premium/tiers/", response_model=List[schemas.PremiumTier])
def get_premium_tiers(db: Session = Depends(get_db)):
    """Get all premium tiers with their features"""
    # Define the tiers
    tiers = [
        schemas.PremiumTier(
            tier=1,
            name="Basic",
            price=4.99,
            description="Basic premium features for your card",
            features=[
                "Custom Background Image",
                "Custom Badge",
                "Skills"
            ]
        ),
        schemas.PremiumTier(
            tier=2,
            name="Premium",
            price=9.99,
            description="Enhanced premium features for your card",
            features=[
                "Custom Background Image",
                "Custom Badge",
                "Skills",
                "Extended Projects",
                "Animated Elements",
                "Custom Links"
            ]
        ),
        schemas.PremiumTier(
            tier=3,
            name="Ultimate",
            price=19.99,
            description="Complete premium package for your card",
            features=[
                "Custom Background Image",
                "Custom Badge",
                "Skills",
                "Extended Projects",
                "Animated Elements",
                "Custom Links",
                "Verified Badge",
                "Video Upload"
            ]
        )
    ]
    
    return tiers


@router.post("/premium/subscribe/", response_model=schemas.SubscriptionResponse)
def subscribe(
    subscription: schemas.SubscriptionRequest,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Subscribe to a premium tier"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if tier exists
    tier = subscription.tier
    if tier < 1 or tier > 3:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    # Simulate payment integration - in a real app, this would call a payment API
    payment_url = None
    if subscription.payment_method == "telegram":
        payment_url = f"https://t.me/YourPaymentBot?start=premium_{tier}_{db_user.id}"
    elif subscription.payment_method == "card":
        payment_url = f"https://payment.example.com/premium?tier={tier}&user_id={db_user.id}"
    else:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    # For demo purposes, we'll just simulate a successful payment and activate the subscription
    # In a real app, this would be handled by a webhook from the payment provider
    db_user.premium_tier = tier
    db_user.premium_expires_at = datetime.now() + timedelta(days=30)
    db.commit()
    
    return schemas.SubscriptionResponse(
        success=True,
        message=f"Successfully subscribed to {['Basic', 'Premium', 'Ultimate'][tier-1]} tier",
        payment_url=payment_url
    )


@router.get("/premium/status/", response_model=dict)
def get_premium_status(telegram_id: str, db: Session = Depends(get_db)):
    """Get user's premium status"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    
    return {
        "premium_tier": db_user.premium_tier,
        "tier_name": tier_names.get(db_user.premium_tier, "Unknown"),
        "expires_at": db_user.premium_expires_at,
        "is_active": db_user.premium_tier > 0 and (db_user.premium_expires_at is None or db_user.premium_expires_at > datetime.now())
    } 