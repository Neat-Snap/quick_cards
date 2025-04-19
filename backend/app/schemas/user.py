from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class ContactBase(BaseModel):
    type: str
    value: str
    is_public: bool = True


class ContactCreate(ContactBase):
    pass


class Contact(ContactBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class Project(ProjectBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class SkillCreate(SkillBase):
    pass


class Skill(SkillBase):
    id: int

    class Config:
        orm_mode = True


class CustomLinkBase(BaseModel):
    title: str
    url: str


class CustomLinkCreate(CustomLinkBase):
    pass


class CustomLink(CustomLinkBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    background_type: Optional[str] = None
    background_value: Optional[str] = None
    description: Optional[str] = None
    badge: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    premium_tier: int
    premium_expires_at: Optional[datetime] = None
    avatar_url: Optional[str] = None
    background_type: str
    background_value: str
    description: Optional[str] = None
    badge: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    contacts: List[Contact] = []
    projects: List[Project] = []
    skills: List[Skill] = []
    custom_links: List[CustomLink] = []

    class Config:
        orm_mode = True


class UserPublic(BaseModel):
    id: int
    username: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    background_type: str
    background_value: str
    description: Optional[str] = None
    badge: Optional[str] = None
    contacts: List[Contact] = []
    projects: List[Project] = []
    skills: List[Skill] = []
    custom_links: List[CustomLink] = []

    class Config:
        orm_mode = True 