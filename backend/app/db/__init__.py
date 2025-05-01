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
    'create_premium_feature',

    'update_user_premium_status'
]