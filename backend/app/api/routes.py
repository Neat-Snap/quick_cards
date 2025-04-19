from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import logging

from app.db.session import db
from app.db.models import User, Contact, Project, Skill, CustomLink, PremiumFeature

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprints for different route groups
users_bp = Blueprint("users", __name__, url_prefix="/api/v1")
premium_bp = Blueprint("premium", __name__, url_prefix="/api/v1")

# ===== User Routes =====

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
    """Get current user by telegram_id"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
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
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
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
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    if not data or not data.get("type") or not data.get("value"):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_contact = Contact(
        user_id=user.id,
        type=data["type"],
        value=data["value"],
        is_public=data.get("is_public", True)
    )
    
    db.session.add(new_contact)
    db.session.commit()
    
    return jsonify({
        "id": new_contact.id,
        "user_id": new_contact.user_id,
        "type": new_contact.type,
        "value": new_contact.value,
        "is_public": new_contact.is_public
    }), 201


@users_bp.route("/users/me/contacts/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    """Delete a contact method from user profile"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    contact = Contact.query.filter_by(id=contact_id, user_id=user.id).first()
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    
    db.session.delete(contact)
    db.session.commit()
    
    return jsonify({"message": "Contact deleted successfully"})


# Project endpoints
@users_bp.route("/users/me/projects", methods=["POST"])
def create_project():
    """Add a project to user profile"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Check if user can add more projects
    if user.premium_tier < 2 and len(user.projects) >= 3:
        return jsonify({
            "error": "Free users can only add up to 3 projects. Upgrade to Premium to add more."
        }), 403
    
    data = request.json
    if not data or not data.get("name"):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_project = Project(
        user_id=user.id,
        name=data["name"],
        description=data.get("description"),
        avatar_url=data.get("avatar_url"),
        role=data.get("role")
    )
    
    db.session.add(new_project)
    db.session.commit()
    
    return jsonify({
        "id": new_project.id,
        "user_id": new_project.user_id,
        "name": new_project.name,
        "description": new_project.description,
        "avatar_url": new_project.avatar_url,
        "role": new_project.role
    }), 201


@users_bp.route("/users/me/projects/<int:project_id>", methods=["PATCH"])
def update_project(project_id):
    """Update a project in user profile"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
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
        "user_id": project.user_id,
        "name": project.name,
        "description": project.description,
        "avatar_url": project.avatar_url,
        "role": project.role
    })


@users_bp.route("/users/me/projects/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    """Delete a project from user profile"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    project = Project.query.filter_by(id=project_id, user_id=user.id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    db.session.delete(project)
    db.session.commit()
    
    return jsonify({"message": "Project deleted successfully"})


# Skill endpoints
@users_bp.route("/users/me/skills/<int:skill_id>", methods=["POST"])
def add_skill(skill_id):
    """Add a skill to user profile"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
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
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
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
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
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
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    link = CustomLink.query.filter_by(id=link_id, user_id=user.id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404
    
    db.session.delete(link)
    db.session.commit()
    
    return jsonify({"message": "Link deleted successfully"})


# ===== Premium Routes =====

@premium_bp.route("/premium/features", methods=["GET"])
def get_premium_features():
    """Get all premium features"""
    features = PremiumFeature.query.all()
    
    return jsonify([
        {
            "id": feature.id,
            "name": feature.name,
            "description": feature.description,
            "tier_required": feature.tier_required
        } for feature in features
    ])


@premium_bp.route("/premium/tiers", methods=["GET"])
def get_premium_tiers():
    """Get all premium tiers with their features"""
    # Define the tiers
    tiers = [
        {
            "tier": 1,
            "name": "Basic",
            "price": 4.99,
            "description": "Basic premium features for your card",
            "features": [
                "Custom Background Image",
                "Custom Badge",
                "Skills"
            ]
        },
        {
            "tier": 2,
            "name": "Premium",
            "price": 9.99,
            "description": "Enhanced premium features for your card",
            "features": [
                "Custom Background Image",
                "Custom Badge",
                "Skills",
                "Extended Projects",
                "Animated Elements",
                "Custom Links"
            ]
        },
        {
            "tier": 3,
            "name": "Ultimate",
            "price": 19.99,
            "description": "Complete premium package for your card",
            "features": [
                "Custom Background Image",
                "Custom Badge",
                "Skills",
                "Extended Projects",
                "Animated Elements",
                "Custom Links",
                "Verified Badge",
                "Video Upload"
            ]
        }
    ]
    
    return jsonify(tiers)


@premium_bp.route("/premium/subscribe", methods=["POST"])
def subscribe():
    """Subscribe to a premium tier"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    if not data or "tier" not in data or "payment_method" not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check if tier exists
    tier = data["tier"]
    if tier < 1 or tier > 3:
        return jsonify({"error": "Invalid tier"}), 400
    
    # Simulate payment integration - in a real app, this would call a payment API
    payment_url = None
    if data["payment_method"] == "telegram":
        payment_url = f"https://t.me/YourPaymentBot?start=premium_{tier}_{user.id}"
    elif data["payment_method"] == "card":
        payment_url = f"https://payment.example.com/premium?tier={tier}&user_id={user.id}"
    else:
        return jsonify({"error": "Invalid payment method"}), 400
    
    # For demo purposes, we'll just simulate a successful payment and activate the subscription
    # In a real app, this would be handled by a webhook from the payment provider
    user.premium_tier = tier
    user.premium_expires_at = datetime.now() + timedelta(days=30)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Successfully subscribed to {['Basic', 'Premium', 'Ultimate'][tier-1]} tier",
        "payment_url": payment_url
    })


@premium_bp.route("/premium/status", methods=["GET"])
def get_premium_status():
    """Get user's premium status"""
    telegram_id = request.args.get("telegram_id")
    if not telegram_id:
        return jsonify({"error": "Missing telegram_id parameter"}), 400
    
    user = User.query.filter_by(telegram_id=telegram_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    tier_names = {0: "Free", 1: "Basic", 2: "Premium", 3: "Ultimate"}
    
    return jsonify({
        "premium_tier": user.premium_tier,
        "tier_name": tier_names.get(user.premium_tier, "Unknown"),
        "expires_at": user.premium_expires_at.isoformat() if user.premium_expires_at else None,
        "is_active": user.premium_tier > 0 and (user.premium_expires_at is None or user.premium_expires_at > datetime.now())
    })


def register_routes(app):
    """Register all blueprints/routes with the app"""
    app.register_blueprint(users_bp)
    app.register_blueprint(premium_bp) 