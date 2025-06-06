import logging
from app.db.session import get_db_session
from app.db.models import PremiumFeature

logger = logging.getLogger(__name__)

PREMIUM_FEATURES = [
    {"name": "Custom Background Image", "description": "Create gradient or custom background image for your card", "tier_required": 1},
    {"name": "Skills", "description": "Add your professional skills to your profile", "tier_required": 1},
    {"name": "Extended Projects", "description": "Add more than 3 projects to your profile", "tier_required": 1},
    {"name": "Extended Links", "description": "Add more than 3 custom links to your profile", "tier_required": 1},
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
