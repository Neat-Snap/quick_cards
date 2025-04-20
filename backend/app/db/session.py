"""
Database session management module
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, inspect
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

# Function to initialize the database - this is a simple wrapper
# that will call the actual implementation in init_db.py
def init_db():
    """Initialize database tables and data"""
    logger.info("Starting database initialization...")
    
    try:
        # Import here to avoid circular imports
        from app.db.init_db import init_db as impl_init_db
        
        # Call the implementation
        result = impl_init_db()
        
        if result:
            logger.info("Database initialization completed successfully")
        else:
            logger.error("Database initialization failed")
            
        return result
    except Exception as e:
        logger.error(f"Error in database initialization: {e}", exc_info=True)
        return False