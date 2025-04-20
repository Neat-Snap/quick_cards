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
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    logger.info("Created database tables")
    
    # Get a session to add premium features
    from app.db.session import SessionLocal
    db_session = SessionLocal()
    
    try:
        # Add premium features if they don't exist
        for feature in PREMIUM_FEATURES:
            existing = db_session.query(PremiumFeature).filter(PremiumFeature.name == feature["name"]).first()
            if not existing:
                db_session.add(PremiumFeature(**feature))
        
        db_session.commit()
        logger.info("Initialized premium features")
    except Exception as e:
        db_session.rollback()
        logger.error(f"Error initializing premium features: {e}")
    finally:
        db_session.close() 