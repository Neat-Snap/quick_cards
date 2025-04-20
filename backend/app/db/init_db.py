import logging
from sqlalchemy.orm import Session

from app.db.session import db, Base, engine
from app.db.models import PremiumFeature
from app.db.init_data import PREMIUM_FEATURES

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    """
    Comprehensive database initialization function.
    Creates tables and loads initial data in the correct sequence.
    """
    logger.info("Starting comprehensive database initialization...")
    
    try:
        # Step 1: Create all tables using Flask-SQLAlchemy
        logger.info("Creating all database tables...")
        db.create_all()
        
        # Step 2: Verify tables were created
        all_tables = ['users', 'contacts', 'projects', 'skills', 'custom_links', 'premium_features', 'user_skill']
        for table in all_tables:
            if verify_table_exists(table):
                logger.info(f"Table '{table}' exists")
            else:
                logger.error(f"Table '{table}' does not exist!")
                # Try to create it directly with SQLAlchemy Core
                logger.info(f"Attempting to create table '{table}' using SQLAlchemy Core...")
                Base.metadata.create_all(bind=engine)
                
                # Check again
                if verify_table_exists(table):
                    logger.info(f"Successfully created table '{table}' using SQLAlchemy Core")
                else:
                    logger.error(f"Failed to create table '{table}' using both methods!")
                    raise Exception(f"Could not create table '{table}'")
        
        # Step 3: Initialize premium features
        logger.info("Adding premium features...")
        
        # Get existing feature names to avoid duplicates
        try:
            existing_features = db.session.query(PremiumFeature.name).all()
            existing_names = [name for (name,) in existing_features]
            logger.info(f"Found {len(existing_names)} existing premium features")
        except Exception as e:
            logger.warning(f"Error getting existing features, assuming none exist: {e}")
            existing_names = []
        
        # Add new features
        features_added = 0
        for feature in PREMIUM_FEATURES:
            if feature["name"] not in existing_names:
                new_feature = PremiumFeature(**feature)
                db.session.add(new_feature)
                features_added += 1
        
        if features_added > 0:
            logger.info(f"Added {features_added} new premium features")
            db.session.commit()
        else:
            logger.info("No new premium features needed to be added")
        
        logger.info("Database initialization completed successfully")
        return True
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        return False
    

def verify_table_exists(table_name):
    """Check if a table exists in the database"""
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()

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