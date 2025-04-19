from flask_sqlalchemy import SQLAlchemy

# Create SQLAlchemy database instance
db = SQLAlchemy()

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