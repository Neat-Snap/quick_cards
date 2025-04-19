import logging
from sqlalchemy.orm import Session

from app.db.session import Base, engine
from app.db.models import PremiumFeature

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Premium features list
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

def init_db(db: Session) -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Created database tables")
    
    # Add premium features if they don't exist
    for feature in PREMIUM_FEATURES:
        existing = db.query(PremiumFeature).filter(PremiumFeature.name == feature["name"]).first()
        if not existing:
            db.add(PremiumFeature(**feature))
    
    db.commit()
    logger.info("Initialized premium features") 