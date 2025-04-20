"""
Consolidated database initialization module that properly sequences table creation and data loading
"""

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

def verify_table_exists(table_name):
    """Check if a table exists in the database"""
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()

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