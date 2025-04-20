from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

# Create SQLAlchemy database instance for Flask
db = SQLAlchemy()

# Create SQLAlchemy engine and base for direct usage
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize the database
def init_db():
    """Initialize the database - creates tables and sets up initial data"""
    # Import models to register with SQLAlchemy
    from app.db.models import User, Contact, Project, Skill, CustomLink, PremiumFeature
    
    try:
        # Create all tables
        logger.info("Creating database tables...")
        db.create_all()
        logger.info("Database tables created.")
        
        # Initialize premium features
        from app.db.init_db import setup_initial_data
        logger.info("Setting up initial data...")
        setup_initial_data()
        logger.info("Initial data setup complete.")
        
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        return False