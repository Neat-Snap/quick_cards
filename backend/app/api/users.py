from typing import List, Optional
from flask import Blueprint, jsonify, request, g
import logging
from datetime import datetime, timedelta
from app.db.session import db
from app.core.search import get_skill_search
from app.db.models import User, Contact, Project, Skill, CustomLink
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

images_path = os.path.join(os.path.dirname(__file__), '..', '..', "..", 'files', "profile")

# Import all database functions from app.db package
from app.db import (
    get_user,
    set_user,
    create_user as db_create_user,
    get_contacts,
    get_contact_by_id,
    set_contact_data,
    create_contact as db_create_contact,
    get_projects,
    get_project_by_id,
    set_project,
    create_project as db_create_project,
    get_skills,
    get_skill_by_id,
    set_skill,
    create_skill,
    add_skill_to_user,
    remove_skill_from_user,
    create_skill_and_add_to_user,
    get_custom_links,
    get_custom_link_by_id,
    set_custom_link,
    create_custom_link as db_create_custom_link
)

logger = logging.getLogger(__name__)

# Create blueprint for user routes
users_bp = Blueprint("users", __name__, url_prefix="/v1")

# Import the helper function
from app.middleware.auth import get_current_user as get_authenticated_user

@users_bp.route("/users", methods=["POST"])
def create_user():
    """Create a new user"""
    data = request.json
    
    if not data or not data.get("id"):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if user exists
    existing_user = get_user(data["id"])
    if existing_user:
        return jsonify({"error": "User already registered"}), 400
    
    # Create user using the database function
    try:
        # Pass all data directly to the create_user function
        success = db_create_user(data.get("id"), **{k: v for k, v in data.items() if k != "id"})
        if not success:
            return jsonify({"error": "Failed to create user"}), 500
            
        # Get the newly created user
        new_user = get_user(data["id"])
        if not new_user:
            return jsonify({"error": "User created but could not be retrieved"}), 500
            
        return jsonify(new_user), 201
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return jsonify({"error": f"Failed to create user: {str(e)}"}), 500

@users_bp.route("/users/me", methods=["GET"])
def get_current_user():
    """Get current user based on authentication data"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get user data from database
    user_data = get_user(user.id)
    if not user_data:
        return jsonify({"error": "User not found"}), 404
    
    # Get related data
    user_contacts = get_contacts(user.id)
    user_projects = get_projects(user.id)
    user_skills = get_skills(user.id)
    user_links = get_custom_links(user.id)
    
    # Combine all data
    full_user_data = {
        **user_data,
        "contacts": user_contacts,
        "projects": user_projects,
        "skills": user_skills,
        "custom_links": user_links
    }
    
    return jsonify(full_user_data)

@users_bp.route("/users/me", methods=["PATCH"])
def update_user():
    """Update current user"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Get current user data
    user_data = get_user(user.id)
    if not user_data:
        return jsonify({"error": "User not found"}), 404
    
    # Update user fields
    updateable_fields = ["username", "name", "avatar_url", "background_type", 
                        "background_value", "description", "badge"]
    for field in updateable_fields:
        if field in data:
            user_data[field] = data[field]
    
    # Set updated user data
    set_user(user_data)
    
    # Return updated user data (excluding related data)
    return jsonify({field: user_data.get(field) for field in 
                   ["id", "username", "name", "avatar_url", "background_type", 
                    "background_value", "description", "badge"]})

@users_bp.route("/users/<user_id>", methods=["GET"])
def get_user_endpoint(user_id):
    """Get a user by id (public profile)"""
    user_data = get_user(user_id)
    if not user_data:
        return jsonify({"error": "User not found"}), 404
    
    # Get related data
    user_contacts = get_contacts(user_id)
    # Filter public contacts only
    public_contacts = [contact for contact in user_contacts if contact.get("is_public", True)]
    
    user_projects = get_projects(user_id)
    user_skills = get_skills(user_id)
    user_links = get_custom_links(user_id)
    
    # Combine all data, excluding sensitive information
    public_fields = ["id", "username", "name", "avatar_url", "background_type", 
                    "background_value", "description", "badge"]
    public_user_data = {field: user_data.get(field) for field in public_fields}
    
    public_user_data.update({
        "contacts": public_contacts,
        "projects": user_projects,
        "skills": user_skills,
        "custom_links": user_links
    })
    
    return jsonify(public_user_data)

@users_bp.route("/users", methods=["GET"])
def search_users():
    """Search for users by name or skill"""
    try:
        # Get query parameters
        q = request.args.get("q")
        skill = request.args.get("skill")
        limit = int(request.args.get("limit", 10))
        offset = int(request.args.get("offset", 0))
        
        # Start query construction
        query = db.session.query(User).filter(User.is_active == True)
        
        # Apply name/username filter if provided
        if q:
            query = query.filter(
                db.or_(
                    User.name.ilike(f"%{q}%"),
                    User.username.ilike(f"%{q}%")
                )
            )
        
        # Apply skill filter if provided
        if skill:
            query = query.join(User.skills).filter(
                Skill.name.ilike(f"%{skill}%")
            )
        
        # Apply pagination
        users = query.offset(offset).limit(limit).all()
        
        # Format results
        result = []
        for user in users:
            # Extract only the public fields for each user
            user_data = {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "background_type": user.background_type,
                "background_value": user.background_value,
                "description": user.description,
                "badge": user.badge
            }
            result.append(user_data)
            
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error searching users: {str(e)}")
        return jsonify({"error": f"Failed to search users: {str(e)}"}), 500



@users_bp.route("/users/me/avatar", methods=["POST"])
def upload_avatar():
    """Upload a profile avatar"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Check if file is in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    
    # Check if the file has a name
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    # Check if the file is allowed
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "File type not allowed"}), 400
    
    # Create the profile directory if it doesn't exist
    os.makedirs(images_path, exist_ok=True)
    
    # Save the file with user_id as filename
    extension = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{user.id}.{extension}"
    file_path = os.path.join(images_path, filename)
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        file.save(file_path)
        
        # Update the user's avatar_url
        user_data = get_user(user.id)
        if not user_data:
            return jsonify({"error": "User not found"}), 404
            
        # Set avatar_url to the path relative to the API
        avatar_url = f"/files/profile/{filename}"
        user_data["avatar_url"] = avatar_url
        
        # Update user in the database
        set_user(user_data)
        
        return jsonify({
            "success": True,
            "avatar_url": avatar_url
        })
    except Exception as e:
        logger.error(f"Error saving avatar: {str(e)}")
        return jsonify({"error": f"Failed to save avatar: {str(e)}"}), 500


# Contact endpoints
@users_bp.route("/users/me/contacts", methods=["POST"])
def create_contact():
    """Add a contact method to user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data or "type" not in data or "value" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Get existing contacts
    user_contacts = get_contacts(user.id)
    
    # Check premium for multiple contacts (assuming premium tier is in user data)
    user_data = get_user(user.id)
    if len(user_contacts) >= 3 and user_data.get("premium_tier", 0) == 0:
        return jsonify({"error": "Premium subscription required for more than 3 contacts"}), 403
    
    # Create contact
    try:
        contact_data = db_create_contact(
            user_id=user.id,
            contact_type=data["type"],
            value=data["value"],
            is_public=data.get("is_public", True)
        )
        return jsonify(contact_data), 201
    except Exception as e:
        logger.error(f"Error creating contact: {str(e)}")
        return jsonify({"error": f"Failed to create contact: {str(e)}"}), 500


@users_bp.route("/users/me/contacts/<int:contact_id>", methods=["PATCH"])
def update_contact(contact_id):
    """Update a contact in user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get contact data
    contact = get_contact_by_id(contact_id)
    if not contact or contact.get("user_id") != user.id:
        return jsonify({"error": "Contact not found"}), 404
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Update contact fields
    update_fields = ["type", "value", "is_public"]
    for field in update_fields:
        if field in data:
            contact[field] = data[field]
    
    # Set contact id to ensure we update the existing contact
    contact["id"] = contact_id
    
    # Update contact
    try:
        updated_contact = set_contact_data(contact)
        return jsonify(updated_contact)
    except Exception as e:
        logger.error(f"Error updating contact: {str(e)}")
        return jsonify({"error": f"Failed to update contact: {str(e)}"}), 500
    

@users_bp.route("/users/me/contacts", methods=["GET"])
def get_user_contacts():
    """Get all contacts for current user"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get contacts using the database function
    try:
        user_contacts = get_contacts(user.id)
        logger.info(f"Retrieved {len(user_contacts)} contacts for user {user.id}")
        return jsonify(user_contacts)
    except Exception as e:
        logger.error(f"Error getting contacts: {str(e)}")
        return jsonify({"error": f"Failed to get contacts: {str(e)}"}), 500


@users_bp.route("/users/me/contacts/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    """Delete a contact from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get contact data
    contact = get_contact_by_id(contact_id)
    if not contact or contact.get("user_id") != user.id:
        return jsonify({"error": "Contact not found"}), 404
    
    
    try:
        contact_obj = db.session.query(Contact).get(contact_id)
        if contact_obj:
            db.session.delete(contact_obj)
            db.session.commit()
        return "", 204
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}")
        return jsonify({"error": f"Failed to delete contact: {str(e)}"}), 500

@users_bp.route("/users/me/projects", methods=["POST"])
def create_project():
    """Add a project to user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Create project
    try:
        project_data = db_create_project(
            user_id=user.id,
            name=data["name"],
            description=data.get("description"),
            avatar_url=data.get("avatar_url"),
            role=data.get("role"),
            url=f"https://{data.get("url")}"
        )
        return jsonify(project_data), 201
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return jsonify({"error": f"Failed to create project: {str(e)}"}), 500

@users_bp.route("/users/me/projects/<int:project_id>", methods=["PATCH"])
def update_project(project_id):
    """Update a project in user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get project
    project = get_project_by_id(project_id)
    if not project or project.get("user_id") != user.id:
        return jsonify({"error": "Project not found"}), 404
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Update project fields
    update_fields = ["name", "description", "avatar_url", "role", "url"]
    for field in update_fields:
        if field in data:
            project[field] = data[field]
    
    # Set project id to ensure we update the existing project
    project["id"] = project_id
    
    # Update project
    updated_project = set_project(project)
    return jsonify(updated_project)

@users_bp.route("/users/me/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    """Delete a project from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get project
    project = get_project_by_id(project_id)
    if not project or project.get("user_id") != user.id:
        return jsonify({"error": "Project not found"}), 404
    
    # Use db.session directly since there's no delete function yet
    
    
    try:
        project_obj = db.session.query(Project).get(project_id)
        if project_obj:
            db.session.delete(project_obj)
            db.session.commit()
        return "", 204
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        return jsonify({"error": f"Failed to delete project: {str(e)}"}), 500

@users_bp.route("/users/me/skills/<int:skill_id>", methods=["POST"])
def add_skill_to_user_endpoint(skill_id):
    """Add a skill to user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Check if user has premium for skills
    user_data = get_user(user.id)
    if user_data.get("premium_tier", 0) == 0:
        return jsonify({"error": "Premium subscription required for skills"}), 403
    
    # Get skill
    skill = get_skill_by_id(skill_id)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404
    
    # Add skill to user
    success = add_skill_to_user(user.id, skill_id)
    if not success:
        return jsonify({"error": "Failed to add skill to user"}), 500
    
    return jsonify({"success": True, "skill": skill})
    

@users_bp.route("/users/me/skills/<int:skill_id>", methods=["DELETE"])
def remove_skill_from_user_endpoint(skill_id):
    """Remove a skill from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Remove skill from user
    success = remove_skill_from_user(user.id, skill_id)
    if not success:
        return jsonify({"error": "Failed to remove skill from user"}), 500
    
    return "", 204

@users_bp.route("/skills", methods=["GET"])
def get_skills_endpoint():
    """Get all available skills or search for skills"""
    q = request.args.get("q")
    logger.info(f"Received skills request with query: {q}")
    
    try:
        if q:
            logger.info("Query parameter provided, initiating skill search")
            # If query is provided, use the skill search service
            skill_search = get_skill_search()
            skill_results = skill_search.search_skills(q)
            logger.info(f"Skill search returned {len(skill_results) if skill_results else 0} results")
            
            # If we have predefined skills, check if they exist in DB
            if skill_results:
                logger.info("Processing predefined skills and checking database matches")
                # Check which predefined skills already exist in the DB
                existing_skills = db.session.query(Skill).filter(
                    Skill.name.in_([skill['name'] for skill in skill_results])
                ).all()
                logger.info(f"Found {len(existing_skills)} existing skills in database")
                
                # Create a mapping for quick lookup
                existing_map = {skill.name.lower(): skill for skill in existing_skills}
                
                # Update search results with DB IDs if skills exist
                updated_count = 0
                for skill in skill_results:
                    skill_name_lower = skill['name'].lower()
                    if skill_name_lower in existing_map:
                        db_skill = existing_map[skill_name_lower]
                        skill['id'] = db_skill.id
                        skill['image_url'] = db_skill.image_url or skill['image_url']
                        skill['description'] = db_skill.description or skill['description']
                        updated_count += 1
                logger.info(f"Updated {updated_count} predefined skills with database information")
                
                # Add DB skills to the start of results
                db_skills = db.session.query(Skill).filter(
                    Skill.name.ilike(f"%{q}%")
                ).all()
                logger.info(f"Found {len(db_skills)} additional skills in database matching query")
                
                # Add DB skills that weren't in our predefined results
                added_count = 0
                for db_skill in db_skills:
                    if not any(s['id'] == db_skill.id for s in skill_results):
                        skill_results.append({
                            'id': db_skill.id,
                            'name': db_skill.name,
                            'description': db_skill.description,
                            'image_url': db_skill.image_url,
                            'is_predefined': False,
                            'score': 0.7  # Give custom skills a reasonably high score
                        })
                        added_count += 1
                logger.info(f"Added {added_count} custom skills from database to results")
                
                # Re-sort by score
                skill_results.sort(key=lambda x: x['score'], reverse=True)
                logger.info(f"Returning {len(skill_results)} total skills after sorting")
                
                return jsonify(skill_results)
            
            logger.info("No predefined results found, falling back to database search")
            # If no predefined results, fall back to DB search
            skills = db.session.query(Skill).filter(Skill.name.ilike(f"%{q}%")).all()
            logger.info(f"Database search returned {len(skills)} results")
        else:
            logger.info("No query parameter provided, returning all skills from database")
            # Without query, just return all skills from DB
            skills = db.session.query(Skill).all()
            logger.info(f"Retrieved {len(skills)} total skills from database")
        
        return jsonify([
            {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "image_url": skill.image_url
            } for skill in skills
        ])
    except Exception as e:
        logger.error(f"Error getting skills: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to get skills: {str(e)}"}), 500

@users_bp.route("/skills", methods=["POST"])
def create_skill_endpoint():
    """Create a new custom skill"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Check if user has premium for skills
    user_data = get_user(user.id)
    if user_data.get("premium_tier", 0) == 0:
        return jsonify({"error": "Premium subscription required for skills"}), 403
    
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Check if a similar skill already exists
        existing_skill = db.session.query(Skill).filter(
            Skill.name.ilike(data['name'])
        ).first()
        
        if existing_skill:
            # If skill exists, just add it to the user
            success = add_skill_to_user(user.id, existing_skill.id)
            if not success:
                return jsonify({"error": "Failed to add skill to user"}), 500
            
            return jsonify({
                "success": True,
                "message": "Existing skill added to user",
                "skill": {
                    "id": existing_skill.id,
                    "name": existing_skill.name,
                    "description": existing_skill.description,
                    "image_url": existing_skill.image_url
                }
            })
        
        # Check if this is a predefined skill
        skill_search = get_skill_search()
        predefined_skill = skill_search.get_predefined_skill(data['name'])
        
        if predefined_skill:
            # Create the predefined skill in the DB
            new_skill = Skill(
                name=predefined_skill['name'],
                description=predefined_skill.get('description') or data.get('description', ''),
                image_url=predefined_skill.get('image_url') or data.get('image_url', '')
            )
            db.session.add(new_skill)
            db.session.flush()  # Get the ID without committing
            
            # Add the skill to the user
            user_skill = user_skills.insert().values(
                user_id=user.id,
                skill_id=new_skill.id
            )
            db.session.execute(user_skill)
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Predefined skill created and added to user",
                "skill": {
                    "id": new_skill.id,
                    "name": new_skill.name,
                    "description": new_skill.description,
                    "image_url": new_skill.image_url
                }
            })
        
        # Create a new custom skill
        new_skill = Skill(
            name=data['name'],
            description=data.get('description', ''),
            image_url=data.get('image_url', '')
        )
        db.session.add(new_skill)
        db.session.flush()  # Get the ID without committing
        
        # Add the skill to the user
        user_skill = user_skills.insert().values(
            user_id=user.id,
            skill_id=new_skill.id
        )
        db.session.execute(user_skill)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Custom skill created and added to user",
            "skill": {
                "id": new_skill.id,
                "name": new_skill.name,
                "description": new_skill.description,
                "image_url": new_skill.image_url
            }
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating skill: {str(e)}")
        return jsonify({"error": f"Failed to create skill: {str(e)}"}), 500

@users_bp.route("/skills/upload-image", methods=["POST"])
def upload_skill_image():
    """Upload a skill image"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Check if user has premium for skills
    user_data = get_user(user.id)
    if user_data.get("premium_tier", 0) == 0:
        return jsonify({"error": "Premium subscription required for skills"}), 403
    
    # Check if file is in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    
    # Check if the file has a name
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    # Check if the file is allowed
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'svg'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "File type not allowed"}), 400
    
    # Create the skills directory if it doesn't exist
    skills_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'files', 'skills')
    os.makedirs(skills_path, exist_ok=True)
    
    # Generate a unique filename
    import uuid
    file_uuid = str(uuid.uuid4())
    extension = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{file_uuid}.{extension}"
    file_path = os.path.join(skills_path, filename)
    
    try:
        file.save(file_path)
        
        # Return the URL to the uploaded image
        image_url = f"/files/skills/{filename}"
        
        return jsonify({
            "success": True,
            "image_url": image_url
        })
    except Exception as e:
        logger.error(f"Error saving skill image: {str(e)}")
        return jsonify({"error": f"Failed to save skill image: {str(e)}"}), 500


@users_bp.route("/users/me/links/<int:link_id>", methods=["DELETE"])
def delete_custom_link(link_id):
    """Delete a custom link from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Get link
    link = get_custom_link_by_id(link_id)
    if not link or link.get("user_id") != user.id:
        return jsonify({"error": "Custom link not found"}), 404
    
    # Use db.session directly since there's no delete function yet
    
    
    try:
        link_obj = db.session.query(CustomLink).get(link_id)
        if link_obj:
            db.session.delete(link_obj)
            db.session.commit()
        return "", 204
    except Exception as e:
        logger.error(f"Error deleting custom link: {str(e)}")
        return jsonify({"error": f"Failed to delete custom link: {str(e)}"}), 500