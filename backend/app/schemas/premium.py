from typing import List, Optional
from pydantic import BaseModel


class PremiumFeatureBase(BaseModel):
    name: str
    description: str
    tier_required: int


class PremiumFeatureCreate(PremiumFeatureBase):
    pass


class PremiumFeature(PremiumFeatureBase):
    id: int

    class Config:
        orm_mode = True


class PremiumTierBase(BaseModel):
    tier: int
    name: str
    price: float
    description: str
    features: List[str]


class PremiumTier(PremiumTierBase):
    class Config:
        orm_mode = True


class SubscriptionRequest(BaseModel):
    tier: int
    payment_method: str


class SubscriptionResponse(BaseModel):
    success: bool
    message: str
    payment_url: Optional[str] = None 