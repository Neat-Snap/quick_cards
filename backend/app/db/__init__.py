import logging
from sqlalchemy.orm import Session

from app.db.session import db, Base, engine
from app.db.models import PremiumFeature
from app.db.init_data import PREMIUM_FEATURES

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_initial_data():
    """Initialize premium features in the database using SQLAlchemy Core"""
    logger.info("Setting up initial data...")
    
    try:
        # Create tables if they don't exist
        logger.info("Creating tables if they don't exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created")
        
        # Add premium features if they don't exist
        logger.info("Adding premium features...")
        for feature in PREMIUM_FEATURES:
            existing = db.session.query(PremiumFeature).filter(PremiumFeature.name == feature["name"]).first()
            if not existing:
                logger.info(f"Adding premium feature: {feature['name']}")
                db.session.add(PremiumFeature(**feature))
            else:
                logger.info(f"Premium feature already exists: {feature['name']}")
        
        db.session.commit()
        logger.info("Premium features initialized successfully")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error initializing premium features: {e}", exc_info=True)
        raise  # Re-raise the exception to see it in the main initialization