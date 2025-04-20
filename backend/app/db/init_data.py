import logging
from sqlalchemy import inspect

from app.db.session import db, Base, engine
from app.db.models import PremiumFeature, User, Contact, Project, Skill, CustomLink

# Initialize logging
logger = logging.getLogger(__name__)

# Premium features list (moved here to avoid circular imports)
PREMIUM_FEATURES = [
    {"name": "Custom Background Image", "description": "Upload a custom background image for your card", "tier_required": 1},
    {"name": "Custom Badge", "description": "Add a custom badge next to your name", "tier_required": 1},
    {"name": "Skills", "description": "Add your professional skills to your profile", "tier_required": 1},
    {"name": "Extended Projects", "description": "Add more than 3 projects to your profile", "tier_required": 2},
    {"name": "Animated Elements", "description": "Add animations to your card", "tier_required": 2},
    {"name": "Custom Links", "description": "Add custom links to your profile", "tier_required": 2},
    {"name": "Verified Badge", "description": "Get a verified badge for your profile", "tier_required": 3},
    {"name": "Video Upload", "description": "Upload videos to your profile", "tier_required": 3},
]

def initialize_premium_features():
    """Initialize premium features in the database"""
    logger.info("Initializing premium features")
    
    # Add premium features if they don't exist
    for feature in PREMIUM_FEATURES:
        existing = PremiumFeature.query.filter_by(name=feature["name"]).first()
        if not existing:
            db.session.add(PremiumFeature(**feature))
    
    db.session.commit()
    logger.info("Premium features initialized") 