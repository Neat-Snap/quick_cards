from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Float, Table
from sqlalchemy.sql import func

from app.db.session import db

# Association table for skills
user_skill = db.Table(
    "user_skill",
    db.Column("user_id", db.Integer, db.ForeignKey("users.id")),
    db.Column("skill_id", db.Integer, db.ForeignKey("skills.id"))
)

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, index=True)
    username = db.Column(db.String, index=True)
    name = db.Column(db.String)
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    reffed_by = db.Column(db.Integer, nullable=True)
    referrals = db.Column(db.Integer, default=0)
    
    # Premium status
    premium_tier = db.Column(db.Integer, default=0)  # 0=Free, 1=Basic, 2=Premium, 3=Ultimate
    premium_expires_at = db.Column(db.DateTime, nullable=True)
    
    # Card settings
    avatar_url = db.Column(db.String, nullable=True)
    background_type = db.Column(db.String, default="color")  # color, gradient, image
    background_value = db.Column(db.String, default="#FFFFFF")  # color code, gradient info, or image URL
    description = db.Column(db.Text, nullable=True)
    badge = db.Column(db.String, nullable=True)
    
    # Relationships
    contacts = db.relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    projects = db.relationship("Project", back_populates="user", cascade="all, delete-orphan")
    skills = db.relationship("Skill", secondary=user_skill, back_populates="users")
    custom_links = db.relationship("CustomLink", back_populates="user", cascade="all, delete-orphan")


class Contact(db.Model):
    __tablename__ = "contacts"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    type = db.Column(db.String)  # phone, email, etc.
    value = db.Column(db.String)
    is_public = db.Column(db.Boolean, default=True)
    
    user = db.relationship("User", back_populates="contacts")


class Project(db.Model):
    __tablename__ = "projects"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    name = db.Column(db.String)
    description = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String, nullable=True)
    role = db.Column(db.String, nullable=True)
    url = db.Column(db.String, nullable=True)
    
    user = db.relationship("User", back_populates="projects")


class Skill(db.Model):
    __tablename__ = "skills"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    name = db.Column(db.String, unique=True)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String, nullable=True)
    
    users = db.relationship("User", secondary=user_skill, back_populates="skills")


class CustomLink(db.Model):
    __tablename__ = "custom_links"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    title = db.Column(db.String)
    url = db.Column(db.String)
    
    user = db.relationship("User", back_populates="custom_links")


class PremiumFeature(db.Model):
    __tablename__ = "premium_features"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    name = db.Column(db.String, unique=True)
    description = db.Column(db.Text)
    tier_required = db.Column(db.Integer)  # 1=Basic, 2=Premium, 3=Ultimate 