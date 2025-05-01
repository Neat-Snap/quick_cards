from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Float, Table, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

user_skill = Table(
    "user_skill",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("skill_id", Integer, ForeignKey("skills.id"))
)

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String, index=True)
    name = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    reffed_by = Column(Integer, nullable=True)
    referrals = Column(Integer, default=0)
    
    premium_tier = Column(Integer, default=0)  # 0=Free, 1=Basic, 2=Premium, 3=Ultimate
    premium_expires_at = Column(DateTime, nullable=True)
    
    avatar_url = Column(String, nullable=True)
    background_type = Column(String, default="color")  # color, gradient, image
    background_value = Column(String, default="#FFFFFF")  # color code, gradient info, or image URL
    description = Column(Text, nullable=True)
    badge = Column(String, nullable=True)
    
    contacts = relationship("Contact", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("Skill", secondary=user_skill, back_populates="users")
    custom_links = relationship("CustomLink", back_populates="user", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    type = Column(String)  # phone, email, etc.
    value = Column(String)
    is_public = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="contacts")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    name = Column(String)
    description = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    role = Column(String, nullable=True)
    url = Column(String, nullable=True)
    
    user = relationship("User", back_populates="projects")


class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    is_predefined = Column(Boolean, default=False)
    
    users = relationship("User", secondary=user_skill, back_populates="skills")

    def __repr__(self):
        return f"<Skill(id={self.id}, name='{self.name}')>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image_url": self.image_url,
            "category": self.category,
            "is_predefined": self.is_predefined
        }


class CustomLink(Base):
    __tablename__ = "custom_links"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    title = Column(String)
    url = Column(String)
    
    user = relationship("User", back_populates="custom_links")


class PremiumFeature(Base):
    __tablename__ = "premium_features"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(Text)
    tier_required = Column(Integer)  # 1=Basic, 2=Premium, 3=Ultimate 