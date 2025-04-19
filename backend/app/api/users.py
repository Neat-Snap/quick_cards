from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db import models
from app.schemas import user as schemas

router = APIRouter()


@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = db.query(models.User).filter(models.User.telegram_id == user.telegram_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/me/", response_model=schemas.User)
def get_current_user(telegram_id: str, db: Session = Depends(get_db)):
    """Get current user by telegram_id"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.patch("/users/me/", response_model=schemas.User)
def update_user(user_update: schemas.UserUpdate, telegram_id: str, db: Session = Depends(get_db)):
    """Update current user"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/users/{user_id}", response_model=schemas.UserPublic)
def read_user(user_id: int, db: Session = Depends(get_db)):
    """Get a user by id (public profile)"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("/users/", response_model=List[schemas.UserPublic])
def search_users(
    q: Optional[str] = None,
    skill: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search for users by name or skill"""
    query = db.query(models.User).filter(models.User.is_active == True)
    
    if q:
        query = query.filter(
            (models.User.name.ilike(f"%{q}%")) | 
            (models.User.username.ilike(f"%{q}%"))
        )
    
    if skill:
        query = query.join(models.User.skills).filter(
            models.Skill.name.ilike(f"%{skill}%")
        )
    
    return query.offset(offset).limit(limit).all()


# Contact endpoints
@router.post("/users/me/contacts/", response_model=schemas.Contact)
def create_contact(
    contact: schemas.ContactCreate,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Add a contact method to user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_contact = models.Contact(**contact.dict(), user_id=db_user.id)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact


@router.delete("/users/me/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Delete a contact method from user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_contact = db.query(models.Contact).filter(
        models.Contact.id == contact_id,
        models.Contact.user_id == db_user.id
    ).first()
    
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    db.delete(db_contact)
    db.commit()
    return {"message": "Contact deleted successfully"}


# Project endpoints
@router.post("/users/me/projects/", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Add a project to user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user can add more projects
    if db_user.premium_tier < 2 and len(db_user.projects) >= 3:
        raise HTTPException(
            status_code=403, 
            detail="Free users can only add up to 3 projects. Upgrade to Premium to add more."
        )
    
    db_project = models.Project(**project.dict(), user_id=db_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.patch("/users/me/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_update: schemas.ProjectCreate, 
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Update a project in user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == db_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.dict()
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/users/me/projects/{project_id}")
def delete_project(
    project_id: int,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Delete a project from user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == db_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}


# Skill endpoints
@router.post("/users/me/skills/{skill_id}")
def add_skill(
    skill_id: int,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Add a skill to user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user can add skills
    if db_user.premium_tier < 1:
        raise HTTPException(
            status_code=403, 
            detail="Adding skills requires at least Basic Premium subscription."
        )
    
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if db_skill in db_user.skills:
        raise HTTPException(status_code=400, detail="Skill already added")
    
    db_user.skills.append(db_skill)
    db.commit()
    return {"message": "Skill added successfully"}


@router.delete("/users/me/skills/{skill_id}")
def remove_skill(
    skill_id: int,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Remove a skill from user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    if db_skill not in db_user.skills:
        raise HTTPException(status_code=400, detail="Skill not in user profile")
    
    db_user.skills.remove(db_skill)
    db.commit()
    return {"message": "Skill removed successfully"}


@router.get("/skills/", response_model=List[schemas.Skill])
def get_skills(
    q: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all available skills or search by name"""
    query = db.query(models.Skill)
    
    if q:
        query = query.filter(models.Skill.name.ilike(f"%{q}%"))
    
    return query.limit(limit).all()


# Custom links (premium feature)
@router.post("/users/me/links/", response_model=schemas.CustomLink)
def add_custom_link(
    link: schemas.CustomLinkCreate,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Add a custom link to user profile (premium feature)"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check premium tier
    if db_user.premium_tier < 2:
        raise HTTPException(
            status_code=403, 
            detail="Adding custom links requires Premium subscription."
        )
    
    db_link = models.CustomLink(**link.dict(), user_id=db_user.id)
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link


@router.delete("/users/me/links/{link_id}")
def delete_custom_link(
    link_id: int,
    telegram_id: str,
    db: Session = Depends(get_db)
):
    """Delete a custom link from user profile"""
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_link = db.query(models.CustomLink).filter(
        models.CustomLink.id == link_id,
        models.CustomLink.user_id == db_user.id
    ).first()
    
    if not db_link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(db_link)
    db.commit()
    return {"message": "Link deleted successfully"} 