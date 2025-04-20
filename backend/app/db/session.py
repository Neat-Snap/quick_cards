from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create SQLAlchemy database instance for Flask
db = SQLAlchemy()

# Create SQLAlchemy engine and base for direct usage
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Import models after db is defined to avoid circular imports
def init_models():
    # Import models so they are registered with SQLAlchemy
    from app.db.models import User, Contact, Project, Skill, CustomLink, PremiumFeature

# Initialize the database
def init_db():
    from app.db.init_data import initialize_premium_features
    
    # Create tables
    init_models()
    db.create_all()
    
    # Initialize premium features
    initialize_premium_features() 