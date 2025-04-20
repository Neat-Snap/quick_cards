from typing import List, Optional
from flask import Blueprint, jsonify, request, g
import logging
from datetime import datetime, timedelta

from app.db.session import db
from app.db.models import User, Contact, Project, Skill, CustomLink

logger = logging.getLogger(__name__)

# Create blueprint for user routes
users_bp = Blueprint("users", __name__, url_prefix="/api/v1")

# Import the helper function
from app.api.routes import get_authenticated_user

@users_bp.route("/users", methods=["POST"])
def create_user():
    """Create a new user"""
    data = request.json
    
    if not data or not data.get("telegram_id"):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if user exists
    existing_user = User.query.filter_by(telegram_id=data["telegram_id"]).first()
    if existing_user:
        return jsonify({"error": "User already registered"}), 400
    
    # Create user
    new_user = User(
        telegram_id=data["telegram_id"],
        username=data.get("username"),
        name=data.get("name"),
        email=data.get("email")
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "id": new_user.id,
        "telegram_id": new_user.telegram_id,
        "username": new_user.username,
        "name": new_user.name,
        "email": new_user.email,
        "is_active": new_user.is_active,
        "premium_tier": new_user.premium_tier,
        "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
        "updated_at": new_user.updated_at.isoformat() if new_user.updated_at else None
    }), 201

@users_bp.route("/users/me", methods=["GET"])
def get_current_user():
    """Get current user based on Telegram auth data or telegram_id query param"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    return jsonify({
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "is_active": user.is_active,
        "premium_tier": user.premium_tier,
        "premium_expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        "avatar_url": user.avatar_url,
        "background_type": user.background_type,
        "background_value": user.background_value,
        "description": user.description,
        "badge": user.badge,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        "contacts": [
            {
                "id": contact.id,
                "type": contact.type,
                "value": contact.value,
                "is_public": contact.is_public
            } for contact in user.contacts
        ],
        "projects": [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "avatar_url": project.avatar_url,
                "role": project.role
            } for project in user.projects
        ],
        "skills": [
            {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "image_url": skill.image_url
            } for skill in user.skills
        ],
        "custom_links": [
            {
                "id": link.id,
                "title": link.title,
                "url": link.url
            } for link in user.custom_links
        ]
    })

@users_bp.route("/users/me", methods=["PATCH"])
def update_user():
    """Update current user"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Update user fields
    for field in ["username", "name", "email", "avatar_url", "background_type", 
                 "background_value", "description", "badge"]:
        if field in data:
            setattr(user, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "background_type": user.background_type,
        "background_value": user.background_value,
        "description": user.description,
        "badge": user.badge
    })

@users_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    """Get a user by id (public profile)"""
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "background_type": user.background_type,
        "background_value": user.background_value,
        "description": user.description,
        "badge": user.badge,
        "contacts": [
            {
                "id": contact.id,
                "type": contact.type,
                "value": contact.value,
                "is_public": contact.is_public
            } for contact in user.contacts if contact.is_public
        ],
        "projects": [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "avatar_url": project.avatar_url,
                "role": project.role
            } for project in user.projects
        ],
        "skills": [
            {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "image_url": skill.image_url
            } for skill in user.skills
        ],
        "custom_links": [
            {
                "id": link.id,
                "title": link.title,
                "url": link.url
            } for link in user.custom_links
        ]
    })

@users_bp.route("/users", methods=["GET"])
def search_users():
    """Search for users by name or skill"""
    q = request.args.get("q")
    skill = request.args.get("skill")
    limit = int(request.args.get("limit", 10))
    offset = int(request.args.get("offset", 0))
    
    query = User.query.filter_by(is_active=True)
    
    if q:
        query = query.filter(
            (User.name.ilike(f"%{q}%")) | 
            (User.username.ilike(f"%{q}%"))
        )
    
    if skill:
        query = query.join(User.skills).filter(
            Skill.name.ilike(f"%{skill}%")
        )
    
    users = query.offset(offset).limit(limit).all()
    
    return jsonify([
        {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "avatar_url": user.avatar_url,
            "background_type": user.background_type,
            "background_value": user.background_value,
            "description": user.description,
            "badge": user.badge
        } for user in users
    ])

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
    
    # Check premium for multiple contacts
    if len(user.contacts) >= 3 and user.premium_tier == 0:
        return jsonify({"error": "Premium subscription required for more than 3 contacts"}), 403
    
    contact = Contact(
        user_id=user.id,
        type=data["type"],
        value=data["value"],
        is_public=data.get("is_public", True)
    )
    
    db.session.add(contact)
    db.session.commit()
    
    return jsonify({
        "id": contact.id,
        "type": contact.type,
        "value": contact.value,
        "is_public": contact.is_public
    }), 201

@users_bp.route("/users/me/contacts/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    """Remove a contact method from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    contact = Contact.query.filter_by(id=contact_id, user_id=user.id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    
    db.session.delete(contact)
    db.session.commit()
    
    return jsonify({"message": "Contact deleted"})

# Project endpoints
@users_bp.route("/users/me/projects", methods=["POST"])
def create_project():
    """Add a project to user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check premium for multiple projects
    if len(user.projects) >= 3 and user.premium_tier == 0:
        return jsonify({"error": "Premium subscription required for more than 3 projects"}), 403
    
    project = Project(
        user_id=user.id,
        name=data["name"],
        description=data.get("description"),
        avatar_url=data.get("avatar_url"),
        role=data.get("role")
    )
    
    db.session.add(project)
    db.session.commit()
    
    return jsonify({
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "avatar_url": project.avatar_url,
        "role": project.role
    }), 201

@users_bp.route("/users/me/projects/<int:project_id>", methods=["PATCH"])
def update_project(project_id):
    """Update a project in user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Update project fields
    for field in ["name", "description", "avatar_url", "role"]:
        if field in data:
            setattr(project, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "avatar_url": project.avatar_url,
        "role": project.role
    })

@users_bp.route("/users/me/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    """Remove a project from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    db.session.delete(project)
    db.session.commit()
    
    return jsonify({"message": "Project deleted"})

# Skill endpoints
@users_bp.route("/users/me/skills/<int:skill_id>", methods=["POST"])
def add_skill(skill_id):
    """Add a skill to user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Check if user can add skills
    if user.premium_tier < 1:
        return jsonify({
            "error": "Adding skills requires at least Basic Premium subscription."
        }), 403
    
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404
    
    if skill in user.skills:
        return jsonify({"error": "Skill already added"}), 400
    
    user.skills.append(skill)
    db.session.commit()
    
    return jsonify({"message": "Skill added successfully"})

@users_bp.route("/users/me/skills/<int:skill_id>", methods=["DELETE"])
def remove_skill(skill_id):
    """Remove a skill from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    skill = Skill.query.get(skill_id)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404
    
    if skill not in user.skills:
        return jsonify({"error": "Skill not in user profile"}), 400
    
    user.skills.remove(skill)
    db.session.commit()
    
    return jsonify({"message": "Skill removed successfully"})

@users_bp.route("/skills", methods=["GET"])
def get_skills():
    """Get all available skills or search by name"""
    q = request.args.get("q")
    limit = int(request.args.get("limit", 50))
    
    query = Skill.query
    
    if q:
        query = query.filter(Skill.name.ilike(f"%{q}%"))
    
    skills = query.limit(limit).all()
    
    return jsonify([
        {
            "id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "image_url": skill.image_url
        } for skill in skills
    ])

# Custom links (premium feature)
@users_bp.route("/users/me/links", methods=["POST"])
def add_custom_link():
    """Add a custom link to user profile (premium feature)"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    # Check premium tier
    if user.premium_tier < 2:
        return jsonify({
            "error": "Adding custom links requires Premium subscription."
        }), 403
    
    data = request.json
    if not data or not data.get("title") or not data.get("url"):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_link = CustomLink(
        user_id=user.id,
        title=data["title"],
        url=data["url"]
    )
    
    db.session.add(new_link)
    db.session.commit()
    
    return jsonify({
        "id": new_link.id,
        "user_id": new_link.user_id,
        "title": new_link.title,
        "url": new_link.url
    }), 201

@users_bp.route("/users/me/links/<int:link_id>", methods=["DELETE"])
def delete_custom_link(link_id):
    """Delete a custom link from user profile"""
    user, error = get_authenticated_user()
    if error:
        return error
    
    link = CustomLink.query.filter_by(id=link_id, user_id=user.id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404
    
    db.session.delete(link)
    db.session.commit()
    
    return jsonify({"message": "Link deleted successfully"})