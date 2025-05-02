import logging
from app.db.session import get_db_session
from app.db.models import PremiumFeature

logger = logging.getLogger(__name__)

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
    logger.info("Initializing premium features")

    with get_db_session() as session:
        existing_features = session.query(PremiumFeature.name).all()
        existing_names = [name for (name,) in existing_features]

        features_added = 0
        for feature in PREMIUM_FEATURES:
            if feature["name"] not in existing_names:
                session.add(PremiumFeature(**feature))
                features_added += 1

        if features_added > 0:
            logger.info(f"Added {features_added} premium features")
        else:
            logger.info("No new premium features to add")
