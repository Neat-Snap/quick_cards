import logging
from sqlalchemy.orm import Session

from app.db.session import db, Base, engine
from app.db.models import PremiumFeature
from app.db.init_data import PREMIUM_FEATURES
from app.db.functions import (
    # Helper functions
    commit_with_error_handling,
    
    # User functions
    get_user,
    set_user,
    create_user,
    
    # Contact functions
    get_contacts,
    get_contact_by_id,
    set_contact_data,
    create_contact,
    
    # Project functions
    get_projects,
    get_project_by_id,
    set_project,
    create_project,
    
    # Skill functions
    get_skill_by_id,
    get_skills,
    set_skill,
    create_skill,
    add_skill_to_user,
    remove_skill_from_user,
    create_skill_and_add_to_user,
    
    # CustomLink functions
    get_custom_links,
    get_custom_link_by_id,
    set_custom_link,
    create_custom_link,
    
    # PremiumFeature functions
    get_premium_feature_by_id,
    get_premium_features_by_tier,
    set_premium_feature,
    create_premium_feature
)

# Define __all__ to expose all functions
__all__ = [
    # Database session objects
    'db', 'Base', 'engine',
    
    # Helper functions
    'commit_with_error_handling',
    
    # User functions
    'get_user',
    'set_user',
    'create_user',
    
    # Contact functions
    'get_contacts',
    'get_contact_by_id',
    'set_contact_data',
    'create_contact',
    
    # Project functions
    'get_projects',
    'get_project_by_id',
    'set_project',
    'create_project',
    
    # Skill functions
    'get_skill_by_id',
    'get_skills',
    'set_skill',
    'create_skill',
    'add_skill_to_user',
    'remove_skill_from_user',
    'create_skill_and_add_to_user',
    
    # CustomLink functions
    'get_custom_links',
    'get_custom_link_by_id',
    'set_custom_link',
    'create_custom_link',
    
    # PremiumFeature functions
    'get_premium_feature_by_id',
    'get_premium_features_by_tier',
    'set_premium_feature',
    'create_premium_feature'
]

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