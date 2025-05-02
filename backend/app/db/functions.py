import logging
from typing import Dict, List, Optional, Union, Any
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.exc import NoResultFound

from datetime import datetime, timedelta
from app.db.session import get_db_session
from app.db.models import User, Contact, Project, Skill, CustomLink, PremiumFeature

logger = logging.getLogger(__name__)

# User functions
def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user data by user_id."""
    try:
        with get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User not found: {user_id}")
                return None
            
            return {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "premium_tier": user.premium_tier,
                "premium_expires_at": user.premium_expires_at,
                "avatar_url": user.avatar_url,
                "background_type": user.background_type,
                "background_value": user.background_value,
                "description": user.description,
                "badge": user.badge,
                "reffed_by": user.reffed_by,
                "referrals": user.referrals
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving user {user_id}: {str(e)}")
        raise

def set_user(user_data: Dict[str, Any]):
    """Create or update user data."""
    try:
        user_id = user_data.get("id")
        if not user_id:
            logger.error("No user_id provided for user update")
            raise ValueError("user_id is required")
            
        with get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if user:
                # Update existing user
                for key, value in user_data.items():
                    if hasattr(user, key) and key != "id":
                        setattr(user, key, value)
            else:
                # Create new user
                user = User(**user_data)
                session.add(user)
            
        logger.info(f"User {user_id} saved successfully")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error while saving user: {str(e)}")
        raise

def create_user(user_id: str, **kwargs) -> bool:
    """
    Create a new user.
    
    Args:
        user_id: Unique user identifier (required)
        **kwargs: Optional user attributes (username, name, etc.)
    """
    try:
        with get_db_session() as session:
            # Check if user already exists
            existing_user = session.query(User).filter(User.id == user_id).first()
            if existing_user:
                logger.warning(f"User already exists: {user_id}")
                return False
                
            # Create user object with required and optional fields
            user_data = {"id": user_id, **kwargs}
            user = User(**user_data)
            session.add(user)
        
        logger.info(f"Created new user: {user_id}")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating user: {str(e)}")
        raise

# Contact functions
def get_contacts(user_id: str) -> List[Dict[str, Any]]:
    """Get all contacts for a user."""
    try:
        with get_db_session() as session:
            contacts = session.query(Contact).filter(Contact.user_id == user_id).all()
            return [
                {
                    "id": contact.id,
                    "user_id": contact.user_id,
                    "type": contact.type,
                    "value": contact.value,
                    "is_public": contact.is_public
                }
                for contact in contacts
            ]
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving contacts for user {user_id}: {str(e)}")
        raise

def get_contact_by_id(contact_id: int) -> Optional[Dict[str, Any]]:
    """Get contact by id."""
    try:
        with get_db_session() as session:
            contact = session.query(Contact).filter(Contact.id == contact_id).first()
            if not contact:
                logger.warning(f"Contact not found: {contact_id}")
                return None
                
            return {
                "id": contact.id,
                "user_id": contact.user_id,
                "type": contact.type,
                "value": contact.value,
                "is_public": contact.is_public
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving contact {contact_id}: {str(e)}")
        raise

def set_contact_data(contact_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update contact data."""
    try:
        contact_id = contact_data.get("id")
        
        with get_db_session() as session:
            if contact_id:
                # Update existing contact
                contact = session.query(Contact).filter(Contact.id == contact_id).first()
                if not contact:
                    logger.warning(f"Contact not found for update: {contact_id}")
                    raise NoResultFound(f"Contact with id {contact_id} not found")
                    
                for key, value in contact_data.items():
                    if hasattr(contact, key) and key != "id":
                        setattr(contact, key, value)
            else:
                # Create new contact
                if "user_id" not in contact_data:
                    logger.error("No user_id provided for new contact")
                    raise ValueError("user_id is required for new contact")
                    
                contact = Contact(**contact_data)
                session.add(contact)
                
            # Flush to get the ID if it's a new contact
            session.flush()
            contact_id = contact.id
            
        logger.info(f"Contact {contact_id} saved successfully")
        return get_contact_by_id(contact_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while saving contact: {str(e)}")
        raise

def create_contact(user_id: str, contact_type: str, value: str, is_public: bool = True) -> Dict[str, Any]:
    """
    Create a new contact for a user.
    
    Args:
        user_id: ID of the user this contact belongs to
        contact_type: Type of contact (phone, email, etc.)
        value: Contact value (phone number, email address, etc.)
        is_public: Whether this contact is publicly visible (default: True)
    """
    try:
        with get_db_session() as session:
            # Check if user exists
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"Cannot create contact: User not found: {user_id}")
                raise ValueError(f"User not found: {user_id}")
                
            # Create contact
            contact = Contact(
                user_id=user_id,
                type=contact_type,
                value=value,
                is_public=is_public
            )
            session.add(contact)
            session.flush()
            
            # Get the new contact's ID
            contact_id = contact.id
            
        logger.info(f"Created new contact (ID: {contact_id}) for user: {user_id}")
        
        return get_contact_by_id(contact_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating contact: {str(e)}")
        raise

# Project functions
def get_projects(user_id: str) -> List[Dict[str, Any]]:
    """Get all projects for a user."""
    try:
        with get_db_session() as session:
            projects = session.query(Project).filter(Project.user_id == user_id).all()
            return [
                {
                    "id": project.id,
                    "user_id": project.user_id,
                    "name": project.name,
                    "description": project.description,
                    "avatar_url": project.avatar_url,
                    "role": project.role,
                    "url": project.url
                }
                for project in projects
            ]
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving projects for user {user_id}: {str(e)}")
        raise

def get_project_by_id(project_id: int) -> Optional[Dict[str, Any]]:
    """Get project by id."""
    try:
        with get_db_session() as session:
            project = session.query(Project).filter(Project.id == project_id).first()
            if not project:
                logger.warning(f"Project not found: {project_id}")
                return None
                
            return {
                "id": project.id,
                "user_id": project.user_id,
                "name": project.name,
                "description": project.description,
                "avatar_url": project.avatar_url,
                "role": project.role,
                "url": project.url
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving project {project_id}: {str(e)}")
        raise

def set_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update project data."""
    try:
        project_id = project_data.get("id")
        
        with get_db_session() as session:
            if project_id:
                # Update existing project
                project = session.query(Project).filter(Project.id == project_id).first()
                if not project:
                    logger.warning(f"Project not found for update: {project_id}")
                    raise NoResultFound(f"Project with id {project_id} not found")
                    
                for key, value in project_data.items():
                    if hasattr(project, key) and key != "id":
                        setattr(project, key, value)
            else:
                # Create new project
                if "user_id" not in project_data:
                    logger.error("No user_id provided for new project")
                    raise ValueError("user_id is required for new project")
                    
                project = Project(**project_data)
                session.add(project)
                
            # Flush to get the ID if it's a new project
            session.flush()
            project_id = project.id
            
        logger.info(f"Project {project_id} saved successfully")
        return get_project_by_id(project_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while saving project: {str(e)}")
        raise

def create_project(user_id: str, name: str, description: str = None, 
                  avatar_url: str = None, role: str = None, url: str = None) -> Dict[str, Any]:
    """
    Create a new project for a user.
    
    Args:
        user_id: ID of the user this project belongs to
        name: Name of the project (required)
        description: Project description (optional)
        avatar_url: URL to project avatar image (optional)
        role: User's role in the project (optional)
        url: URL to the project (optional)
    """
    try:
        with get_db_session() as session:
            # Check if user exists
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"Cannot create project: User not found: {user_id}")
                raise ValueError(f"User not found: {user_id}")
                
            # Create project
            project = Project(
                user_id=user_id,
                name=name,
                description=description,
                avatar_url=avatar_url,
                role=role,
                url=url
            )
            session.add(project)
            session.flush()
            
            # Get the new project's ID
            project_id = project.id
            
        logger.info(f"Created new project (ID: {project_id}) for user: {user_id}")
        
        return get_project_by_id(project_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating project: {str(e)}")
        raise

# Skill functions
def get_skill_by_id(skill_id: int) -> Optional[Dict[str, Any]]:
    """Get skill by id."""
    try:
        with get_db_session() as session:
            skill = session.query(Skill).filter(Skill.id == skill_id).first()
            if not skill:
                logger.warning(f"Skill not found: {skill_id}")
                return None
                
            return {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "image_url": skill.image_url,
                "is_predefined": skill.is_predefined
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving skill {skill_id}: {str(e)}")
        raise

def get_skills(user_id: str) -> List[Dict[str, Any]]:
    """Get all skills for a user."""
    try:
        with get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User not found: {user_id}")
                return []
                
            return [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "image_url": skill.image_url,
                    "is_predefined": skill.is_predefined
                }
                for skill in user.skills
            ]
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving skills for user {user_id}: {str(e)}")
        raise

def set_skill(skill_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update skill data."""
    try:
        skill_id = skill_data.get("id")
        
        with get_db_session() as session:
            if skill_id:
                # Update existing skill
                skill = session.query(Skill).filter(Skill.id == skill_id).first()
                if not skill:
                    logger.warning(f"Skill not found for update: {skill_id}")
                    raise NoResultFound(f"Skill with id {skill_id} not found")
                    
                for key, value in skill_data.items():
                    if hasattr(skill, key) and key != "id":
                        setattr(skill, key, value)
            else:
                # Create new skill
                # Check if skill with same name already exists
                existing_skill = session.query(Skill).filter(Skill.name == skill_data.get("name")).first()
                if existing_skill:
                    logger.info(f"Skill with name '{skill_data.get('name')}' already exists, using existing one")
                    return get_skill_by_id(existing_skill.id)
                    
                skill = Skill(**skill_data)
                session.add(skill)
                
            # Flush to get the ID if it's a new skill
            session.flush()
            skill_id = skill.id
            
        logger.info(f"Skill {skill_id} saved successfully")
        return get_skill_by_id(skill_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while saving skill: {str(e)}")
        raise

def create_skill(name: str, description: str = None, image_url: str = None, is_predefined: bool = False) -> Dict[str, Any]:
    """
    Create a new skill (if it doesn't already exist).
    
    Args:
        name: Name of the skill (required, unique)
        description: Skill description (optional)
        image_url: URL to skill image (optional)
    """
    try:
        with get_db_session() as session:
            # Check if skill already exists
            existing_skill = session.query(Skill).filter(Skill.name == name).first()
            if existing_skill:
                logger.info(f"Skill already exists: '{name}', returning existing one")
                return get_skill_by_id(existing_skill.id)
                
            # Create skill
            skill = Skill(
                name=name,
                description=description,
                image_url=image_url,
                is_predefined=is_predefined
            )
            session.add(skill)
            session.flush()
            
            # Get the new skill's ID
            skill_id = skill.id
            
        logger.info(f"Created new skill (ID: {skill_id}): {name}")
        
        return get_skill_by_id(skill_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating skill: {str(e)}")
        raise

def add_skill_to_user(user_id: str, skill_id: int) -> bool:
    """Add a skill to a user."""
    try:
        with get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User not found: {user_id}")
                return False
                
            skill = session.query(Skill).filter(Skill.id == skill_id).first()
            if not skill:
                logger.warning(f"Skill not found: {skill_id}")
                return False
                
            if skill not in user.skills:
                user.skills.append(skill)
                
        logger.info(f"Added skill {skill_id} to user {user_id}")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error while adding skill {skill_id} to user {user_id}: {str(e)}")
        raise

def remove_skill_from_user(user_id: str, skill_id: int) -> bool:
    """Remove a skill from a user."""
    try:
        with get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User not found: {user_id}")
                return False
                
            skill = session.query(Skill).filter(Skill.id == skill_id).first()
            if not skill:
                logger.warning(f"Skill not found: {skill_id}")
                return False
                
            if skill in user.skills:
                user.skills.remove(skill)
                
        logger.info(f"Removed skill {skill_id} from user {user_id}")
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database error while removing skill {skill_id} from user {user_id}: {str(e)}")
        raise

def create_skill_and_add_to_user(user_id: str, name: str, 
                                description: str = None, image_url: str = None, is_predefined: bool = False) -> Dict[str, Any]:
    """
    Create a new skill (if needed) and add it to a user.
    
    Args:
        user_id: ID of the user to add the skill to
        name: Name of the skill
        description: Skill description (optional)
        image_url: URL to skill image (optional)
    """
    try:
        # First check if user exists
        with get_db_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"Cannot add skill: User not found: {user_id}")
                raise ValueError(f"User not found: {user_id}")
        
        # Create or get existing skill
        skill_data = create_skill(name, description, image_url, is_predefined)
        skill_id = skill_data["id"]
        
        # Add skill to user
        success = add_skill_to_user(user_id, skill_id)
        if not success:
            logger.warning(f"Failed to add skill {skill_id} to user {user_id}")
            raise ValueError(f"Failed to add skill to user")
            
        logger.info(f"Created skill '{name}' and added to user {user_id}")
        return skill_data
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating skill and adding to user: {str(e)}")
        raise

# CustomLink functions
def get_custom_links(user_id: str) -> List[Dict[str, Any]]:
    """Get all custom links for a user."""
    try:
        with get_db_session() as session:
            links = session.query(CustomLink).filter(CustomLink.user_id == user_id).all()
            return [
                {
                    "id": link.id,
                    "user_id": link.user_id,
                    "title": link.title,
                    "url": link.url
                }
                for link in links
            ]
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving custom links for user {user_id}: {str(e)}")
        raise

def get_custom_link_by_id(link_id: int) -> Optional[Dict[str, Any]]:
    """Get custom link by id."""
    try:
        with get_db_session() as session:
            link = session.query(CustomLink).filter(CustomLink.id == link_id).first()
            if not link:
                logger.warning(f"Custom link not found: {link_id}")
                return None
                
            return {
                "id": link.id,
                "user_id": link.user_id,
                "title": link.title,
                "url": link.url
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving custom link {link_id}: {str(e)}")
        raise

def set_custom_link(link_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update custom link data."""
    try:
        link_id = link_data.get("id")
        
        with get_db_session() as session:
            if link_id:
                # Update existing link
                link = session.query(CustomLink).filter(CustomLink.id == link_id).first()
                if not link:
                    logger.warning(f"Custom link not found for update: {link_id}")
                    raise NoResultFound(f"Custom link with id {link_id} not found")
                    
                for key, value in link_data.items():
                    if hasattr(link, key) and key != "id":
                        setattr(link, key, value)
            else:
                # Create new link
                if "user_id" not in link_data:
                    logger.error("No user_id provided for new custom link")
                    raise ValueError("user_id is required for new custom link")
                    
                link = CustomLink(**link_data)
                session.add(link)
                
            # Flush to get the ID if it's a new link
            session.flush()
            link_id = link.id
            
        logger.info(f"Custom link {link_id} saved successfully")
        return get_custom_link_by_id(link_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while saving custom link: {str(e)}")
        raise

def create_custom_link(user_id: str, title: str, url: str) -> Dict[str, Any]:
    """
    Create a new custom link for a user.
    
    Args:
        user_id: ID of the user this link belongs to
        title: Title/label of the link
        url: URL to link to
    """
    try:
        with get_db_session() as session:
            # Check if user exists
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"Cannot create custom link: User not found: {user_id}")
                raise ValueError(f"User not found: {user_id}")
                
            # Create custom link
            link = CustomLink(
                user_id=user_id,
                title=title,
                url=url
            )
            session.add(link)
            session.flush()
            
            # Get the new link's ID
            link_id = link.id
            
        logger.info(f"Created new custom link (ID: {link_id}) for user: {user_id}")
        
        return get_custom_link_by_id(link_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating custom link: {str(e)}")
        raise

# PremiumFeature functions
def get_premium_feature_by_id(feature_id: int) -> Optional[Dict[str, Any]]:
    """Get premium feature by id."""
    try:
        with get_db_session() as session:
            feature = session.query(PremiumFeature).filter(PremiumFeature.id == feature_id).first()
            if not feature:
                logger.warning(f"Premium feature not found: {feature_id}")
                return None
                
            return {
                "id": feature.id,
                "name": feature.name,
                "description": feature.description,
                "tier_required": feature.tier_required
            }
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving premium feature {feature_id}: {str(e)}")
        raise

def get_premium_features_by_tier(tier: int) -> List[Dict[str, Any]]:
    """Get all premium features available for a given tier."""
    try:
        with get_db_session() as session:
            features = session.query(PremiumFeature).filter(PremiumFeature.tier_required <= tier).all()
            return [
                {
                    "id": feature.id,
                    "name": feature.name,
                    "description": feature.description,
                    "tier_required": feature.tier_required
                }
                for feature in features
            ]
    except SQLAlchemyError as e:
        logger.error(f"Database error while retrieving premium features for tier {tier}: {str(e)}")
        raise

def set_premium_feature(feature_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update premium feature data."""
    try:
        feature_id = feature_data.get("id")
        
        with get_db_session() as session:
            if feature_id:
                # Update existing feature
                feature = session.query(PremiumFeature).filter(PremiumFeature.id == feature_id).first()
                if not feature:
                    logger.warning(f"Premium feature not found for update: {feature_id}")
                    raise NoResultFound(f"Premium feature with id {feature_id} not found")
                    
                for key, value in feature_data.items():
                    if hasattr(feature, key) and key != "id":
                        setattr(feature, key, value)
            else:
                # Create new feature
                # Check if feature with same name already exists
                existing_feature = session.query(PremiumFeature).filter(
                    PremiumFeature.name == feature_data.get("name")
                ).first()
                if existing_feature:
                    logger.info(f"Premium feature with name '{feature_data.get('name')}' already exists, using existing one")
                    return get_premium_feature_by_id(existing_feature.id)
                    
                feature = PremiumFeature(**feature_data)
                session.add(feature)
                
            # Flush to get the ID if it's a new feature
            session.flush()
            feature_id = feature.id
            
        logger.info(f"Premium feature {feature_id} saved successfully")
        return get_premium_feature_by_id(feature_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while saving premium feature: {str(e)}")
        raise

def create_premium_feature(name: str, description: str, tier_required: int) -> Dict[str, Any]:
    """
    Create a new premium feature.
    
    Args:
        name: Name of the feature (unique)
        description: Description of the feature
        tier_required: Minimum premium tier required to access this feature
    """
    try:
        with get_db_session() as session:
            # Check if feature already exists
            existing_feature = session.query(PremiumFeature).filter(PremiumFeature.name == name).first()
            if existing_feature:
                logger.info(f"Premium feature already exists: '{name}', returning existing one")
                return get_premium_feature_by_id(existing_feature.id)
                
            # Create premium feature
            feature = PremiumFeature(
                name=name,
                description=description,
                tier_required=tier_required
            )
            session.add(feature)
            session.flush()
            
            # Get the new feature's ID
            feature_id = feature.id
            
        logger.info(f"Created new premium feature (ID: {feature_id}): {name}")
        
        return get_premium_feature_by_id(feature_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating premium feature: {str(e)}")
        raise

def update_user_premium_status(user_id, tier):
    """Update user's premium status"""
    try:
        # Get current user data
        user_data = get_user(user_id)
        if not user_data:
            logger.error(f"User not found for ID: {user_id}")
            return False
        
        # Update premium tier and expiration (30 days from now)
        user_data["premium_tier"] = tier
        user_data["premium_expires_at"] = datetime.now() + timedelta(days=30)
        
        # Save updated user data
        set_user(user_data)
        logger.info(f"Updated premium status for user {user_id} to tier {tier}")
        return True
    except Exception as e:
        logger.error(f"Error updating premium status: {e}")
        return False