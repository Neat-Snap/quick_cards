from typing import List, Optional
import logging
from datetime import datetime, timedelta
from app.core.search import get_skill_search
from app.core.validations import validate_string, validate_user_data, validate_contact, validate_project
from app.db.models import User, Contact, Project, Skill, CustomLink, user_skill
from app.schemas import UserResponse
import sys
import os
from sqlalchemy import or_

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
images_path = os.path.join(os.path.dirname(__file__), '..', '..', "..", 'files', "profile")

from app.core.search import get_skill_search
from app.middleware import *
from fastapi import Depends, APIRouter, Request, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.db import *


router = APIRouter(
    prefix="/v1",
    tags=["users"]
)

logger = logging.getLogger(__name__)


@router.post("/users")
async def user_endpoint(request: Request, user: UserResponse):
    data = await request.json()

    if not data or not data.get("id"):
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})

    existing_user = get_user(data["id"])
    if existing_user:
        return JSONResponse(status_code=400, content={"error": "User already registered"})
    
    try:
        success = create_user(data.get("id"), **{k: v for k, v in data.items() if k != "id"})
        if not success:
            return JSONResponse(status_code=500, content={"error": "Failed to create user"})
        
        new_user = get_user(data["id"])
        return JSONResponse(status_code=201, content=new_user)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/users/new/{user_id}")
async def check_new_endpount(user_id: int):
    # auth_uid, error = check_context(context)
    # if not auth_uid or error:
    #     return error
    
    user_data = get_user(user_id)
    is_new = user_data["is_new"]

    return JSONResponse(status_code=200, content={"success": True, "is_new": is_new})


@router.post("/users/new/update")
async def update_new_endpoint(request: Request):
    data = await request.json()
    if not data or "user_id" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})
    
    user_id = data["user_id"]
    
    user_data = get_user(user_id)
    user_data["is_new"] = False
    set_user(user_data)

    return JSONResponse(status_code=200, content={"success": True})


@router.get("/users/me")
async def get_current_user(context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    user_data = get_user(user_id)
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    user_contacts = get_contacts(user_id)
    user_projects = get_projects(user_id)
    user_skills = get_skills(user_id)
    user_links = get_custom_links(user_id)

    full_user_data = {
        **user_data,
        "contacts": user_contacts,
        "projects": user_projects,
        "skills": user_skills,
        "custom_links": user_links
    }

    json_compatible_data = jsonable_encoder(full_user_data)

    return JSONResponse(status_code=200, content=json_compatible_data)


@router.patch("/users/me")
async def update_user(request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    data = await request.json()
    if not data:
        return JSONResponse(status_code=400, content={"error": "No data provided"})
    
    user_data = get_user(user_id)
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    updateable_fields = ["username", "name", "avatar_url", "background_type", 
                        "background_value", "description", "badge"]
    
    for field in updateable_fields:
        if field in data:
            user_data[field] = data[field]

    is_valid, error = validate_user_data(user_data)
    if not is_valid:
        return JSONResponse(status_code=400, content={"error": error or "Invalid user data"})
    
    set_user(user_data)

    json_compatible_data = jsonable_encoder(user_data)
    
    return JSONResponse(status_code=200, content=json_compatible_data)
    

@router.get("/users/{user_id}")
async def get_user_endpoint(user_id: int, context: AuthContext = Depends(get_auth_context)):
    auth_uid, error = check_context(context)
    if not auth_uid or error:
        return error

    user_data = get_user(user_id)

    if len(str(user_id)) > 32 or len(str(user_id)) < 5:
        return JSONResponse(status_code=400, content={"error": "Invalid user ID"})

    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    user_contacts = get_contacts(user_id)
    public_contacts = [contact for contact in user_contacts if contact.get("is_public", True)]
    user_projects = get_projects(user_id)
    user_skills = get_skills(user_id)
    user_links = get_custom_links(user_id)

    public_fields = ["id", "username", "name", "avatar_url", "background_type", 
                    "background_value", "description", "badge"]
    public_user_data = {field: user_data.get(field) for field in public_fields}
    
    public_user_data.update({
        "contacts": public_contacts,
        "projects": user_projects,
        "skills": user_skills,
        "custom_links": user_links
    })
    
    json_compatible_data = jsonable_encoder(public_user_data)
    return JSONResponse(status_code=200, content=json_compatible_data)


@router.get("/users")
async def search_users(q: str = None, skill: str = None, project: str = None, limit: int = 10, offset: int = 0):
    try:
        if limit > 15:
            limit = 15
        
        activated_parameters = [i for i in [q, skill, project] if i is not None]
        validation_string = ""
        for i in activated_parameters:
            validation_string += i
        if not validate_string(validation_string):
            return JSONResponse(status_code=400, content={"error": "Invalid search parameters"})

        with get_db_session() as session:
            query = session.query(User)

            if q:
                query = query.filter(
                    or_(
                        User.name.ilike(f"%{q}%"),
                        User.username.ilike(f"%{q}%")
                    )
                )

            if skill:
                query = query.join(User.skills).filter(
                    Skill.name.ilike(f"%{skill}%")
                )

            if project:
                query = query.join(User.projects).filter(
                    Project.name.ilike(f"%{project}%")
                )
            
            users = query.offset(offset).limit(limit).all()

            result = []
            for user in users:
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

            json_compatible_data = jsonable_encoder(result)
            return JSONResponse(status_code=200, content=json_compatible_data)
    except Exception as e:
        logger.error(f"Error searching users: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to search users: {str(e)}"})
    

@router.post("/users/me/avatar")
async def upload_avatar(context: AuthContext = Depends(get_auth_context), file: UploadFile = File(...)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    if not file:
        return JSONResponse(status_code=400, content={"error": "No file provided"})
    
    if file.filename == '':
        return JSONResponse(status_code=400, content={"error": "No file selected"})
    
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return JSONResponse(status_code=400, content={"error": "File type not allowed"})
    
    os.makedirs(images_path, exist_ok=True)

    extension = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{user_id}.{extension}"
    file_path = os.path.join(images_path, filename)

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            
        file_content = await file.read()
        with open(file_path, "wb") as f:
            f.write(file_content)

        user_data = get_user(user_id)
        if not user_data:
            return JSONResponse(status_code=404, content={"error": "User not found"})
            
        avatar_url = f"/files/profile/{filename}"
        user_data["avatar_url"] = avatar_url

        set_user(user_data)

        return JSONResponse(status_code=200, content={"success": True, "avatar_url": avatar_url})
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to upload avatar: {str(e)}"})
    
    
@router.post("/users/me/contacts")
async def create_contact_endpoint(request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    data = await request.json()
    if not data or "type" not in data or "value" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})
    
    is_valid, validation_error = validate_contact(data)
    if not is_valid:
        return JSONResponse(status_code=400, content={"error": validation_error or "Invalid contact data"})
    
    user_contacts = get_contacts(user_id)
    user_data = get_user(user_id)
    if len(user_contacts) >= 3 and user_data.get("premium_tier", 0) == 0:
        return JSONResponse(status_code=403, content={"error": "Premium subscription required for more than 3 contacts"})
    
    try:
        contact_data = create_contact(
            user_id=user_id,
            contact_type=data["type"],
            value=data["value"],
            is_public=data.get("is_public", True)
        )
        return JSONResponse(status_code=201, content=contact_data)
    except Exception as e:
        logger.error(f"Error creating contact: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to create contact: {str(e)}"})
    
    
@router.patch("/users/me/contacts/{contact_id}")
async def update_contact(contact_id: int, request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    data = await request.json()
    if not data:
        return JSONResponse(status_code=400, content={"error": "No data provided"})
    
    contact = get_contact_by_id(contact_id)
    if not contact or contact.get("user_id") != user_id:
        return JSONResponse(status_code=404, content={"error": "Contact not found"})

    updateable_fields = ["type", "value", "is_public"]
    for field in updateable_fields:
        if field in data:
            contact[field] = data[field]
    
    is_valid, validation_error = validate_contact(contact)
    if not is_valid:
        return JSONResponse(status_code=400, content={"error": validation_error or "Invalid contact data"})
    
    try:
        updated_contact = set_contact_data(contact)
        return JSONResponse(status_code=200, content=updated_contact)
    except Exception as e:
        logger.error(f"Error updating contact: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to update contact: {str(e)}"})
    
    
@router.get("/users/me/contacts")
async def get_user_contacts(context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    try:
        user_contacts = get_contacts(user_id)
        return JSONResponse(status_code=200, content=user_contacts)
    except Exception as e:
        logger.error(f"Error getting contacts: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to get contacts: {str(e)}"})


@router.delete("/users/me/contacts/{contact_id}")
async def delete_contact(contact_id: int, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    try:
        contact = get_contact_by_id(contact_id)
        if not contact or contact.get("user_id") != user_id:
            return JSONResponse(status_code=404, content={"error": "Contact not found"})
        
        with get_db_session() as session:
            contact_obj = session.query(Contact).get(contact_id)
            if contact_obj:
                session.delete(contact_obj)
                session.commit()
        return JSONResponse(status_code=204, content={})
    except Exception as e:
        logger.error(f"Error deleting contact: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to delete contact: {str(e)}"})
    

@router.post("/users/me/projects")
async def create_project_endpoint(request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    data = await request.json()
    if not data or "name" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})
    
    is_valid, validation_error = validate_project(data)
    if not is_valid:
        return JSONResponse(status_code=400, content={"error": validation_error or "Invalid project data"})
    
    try:
        project_data = create_project(
            user_id=user_id,
            name=data["name"],
            description=data.get("description"),
            avatar_url=data.get("avatar_url"),
            role=data.get("role"),
            url=f"https://{data.get('url')}"
        )
        return JSONResponse(status_code=201, content=project_data)
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to create project: {str(e)}"})


@router.patch("/users/me/projects/{project_id}")
async def update_project_endpoint(project_id: int, request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    project = get_project_by_id(project_id)
    if not project or project.get("user_id") != user_id:
        return JSONResponse(status_code=404, content={"error": "Project not found"})
    
    data = await request.json()
    if not data:
        return JSONResponse(status_code=400, content={"error": "No data provided"})
    
    updateable_fields = ["name", "description", "avatar_url", "role", "url"]
    for field in updateable_fields:
        if field in data:
            project[field] = data[field]
    
    is_valid, validation_error = validate_project(project)
    if not is_valid:
        return JSONResponse(status_code=400, content={"error": validation_error or "Invalid project data"})
    
    try:
        updated_project = set_project(project)
        return JSONResponse(status_code=200, content=updated_project)
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to update project: {str(e)}"})
    

@router.delete("/users/me/projects/{project_id}")
async def delete_project(project_id: int, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    project = get_project_by_id(project_id)
    if not project or project.get("user_id") != user_id:
        return JSONResponse(status_code=404, content={"error": "Project not found"})
    
    try:
        with get_db_session() as session:
            project_obj = session.query(Project).get(project_id)
            if project_obj:
                session.delete(project_obj)
                session.commit()
        return JSONResponse(status_code=204, content={})
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to delete project: {str(e)}"})


@router.post("/users/me/skills/{skill_id}")
async def add_skill_to_user_endpoint(skill_id: int, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    user_data = get_user(user_id)
    if user_data.get("premium_tier", 0) == 0:
        return JSONResponse(status_code=403, content={"error": "Premium subscription required for skills"})
    
    skill = get_skill_by_id(skill_id)
    if not skill:
        return JSONResponse(status_code=404, content={"error": "Skill not found"})
    
    success = add_skill_to_user(user_id, skill_id)
    if not success:
        return JSONResponse(status_code=500, content={"error": "Failed to add skill to user"})
    
    return JSONResponse(status_code=200, content={"success": True, "skill": skill})
    

@router.delete("/users/me/skills/{skill_id}")
async def remove_skill_from_user_endpoint(skill_id: int, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    success = remove_skill_from_user(user_id, skill_id)
    if not success:
        return JSONResponse(status_code=500, content={"error": "Failed to remove skill from user"})
    
    return JSONResponse(status_code=204, content={})


@router.get("/skills")
async def get_skills_endpoint(q: str = None):    
    try:
        if not validate_string(q):
            return JSONResponse(status_code=400, content={"error": "Invalid search parameters"})
        
        with get_db_session() as session:
            if q:
                skill_search = get_skill_search()
                skill_results = skill_search.search_skills(q)
                if skill_results:
                    existing_skills = session.query(Skill).filter(
                        Skill.name.in_([skill['name'] for skill in skill_results])
                    ).all()
                    
                    existing_map = {skill.name.lower(): skill for skill in existing_skills}
                    
                    updated_count = 0
                    for skill in skill_results:
                        skill_name_lower = skill['name'].lower()
                        if skill_name_lower in existing_map:
                            db_skill = existing_map[skill_name_lower]
                            skill['id'] = db_skill.id
                            skill['image_url'] = db_skill.image_url or skill['image_url']
                            skill['description'] = db_skill.description or skill['description']
                            updated_count += 1
                    
                    db_skills = session.query(Skill).filter(
                        Skill.name.ilike(f"%{q}%")
                    ).all()
                    
                    added_count = 0
                    for db_skill in db_skills:
                        if not any(s.get('id') == db_skill.id for s in skill_results):
                            skill_results.append({
                                'id': db_skill.id,
                                'name': db_skill.name,
                                'description': db_skill.description,
                                'image_url': db_skill.image_url,
                                'is_predefined': False,
                                'score': 0.7  # Give custom skills a reasonably high score
                            })
                            added_count += 1
                    
                    skill_results.sort(key=lambda x: x.get('score', 0), reverse=True)
                    
                    return JSONResponse(status_code=200, content=skill_results)
                
                skills = session.query(Skill).filter(Skill.name.ilike(f"%{q}%")).all()
            else:
                skills = session.query(Skill).all()
            
            return JSONResponse(status_code=200, content=[
                {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "image_url": skill.image_url,
                    "is_predefined": skill.is_predefined
                } for skill in skills
            ])
    except Exception as e:
        import traceback
        print("Full traceback:")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": f"Failed to get skills: {str(e)}"})


@router.post("/skills")
async def create_skill_endpoint(request: Request, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    user_data = get_user(user_id)
    if user_data.get("premium_tier", 0) == 0:
        return JSONResponse(status_code=403, content={"error": "Premium subscription required for skills"})
    
    data = await request.json()
    if not data or "name" not in data:
        return JSONResponse(status_code=400, content={"error": "Missing required fields"})
    
    try:
        with get_db_session() as session:
            existing_skill = session.query(Skill).filter(
                Skill.name.ilike(data['name'])
            ).first()
            
            if existing_skill:
                existing_user_skill = session.query(user_skill).filter_by(
                    user_id=user_id, skill_id=existing_skill.id
                ).first()
                
                if not existing_user_skill:
                    session.execute(
                        user_skill.insert().values(
                            user_id=user_id,
                            skill_id=existing_skill.id
                        )
                    )
                    session.commit()
                
                return JSONResponse(status_code=200, content={
                    "success": True,
                    "message": "Existing skill added to user",
                    "skill": {
                        "id": existing_skill.id,
                        "name": existing_skill.name,
                        "description": existing_skill.description,
                        "image_url": existing_skill.image_url,
                        "is_predefined": existing_skill.is_predefined
                    }
                })
            
            skill_search = get_skill_search()
            predefined_skill = skill_search.get_predefined_skill(data['name'])
            
            if predefined_skill:
                new_skill = Skill(
                    name=predefined_skill['name'],
                    description=predefined_skill.get('description') or data.get('description', ''),
                    image_url=predefined_skill.get('image_url') or data.get('image_url', ''),
                    is_predefined=True
                )
                msg = "Predefined skill created and added to user"
            else:
                new_skill = Skill(
                    name=data['name'],
                    description=data.get('description', ''),
                    image_url=data.get('image_url', ''),
                    is_predefined=False
                )
                msg = "Custom skill created and added to user"
            
            session.add(new_skill)
            session.flush()  
            
            session.execute(
                user_skill.insert().values(
                    user_id=user_id,
                    skill_id=new_skill.id
                )
            )
            session.commit()
            
            return JSONResponse(status_code=201, content={
                "success": True,
                "message": msg,
                "skill": {
                    "id": new_skill.id,
                    "name": new_skill.name,
                    "description": new_skill.description,
                    "image_url": new_skill.image_url,
                    "is_predefined": new_skill.is_predefined
                }
            })
    except Exception as e:
        logger.error(f"Error creating skill: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to create skill: {str(e)}"})


@router.post("/skills/upload-image")
async def upload_skill_image(
    context: AuthContext = Depends(get_auth_context),
    file: UploadFile = File(...),
    skill_id: Optional[int] = Form(None)
):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    user_data = get_user(user_id)
    if user_data.get("premium_tier", 0) == 0:
        return JSONResponse(status_code=403, content={"error": "Premium subscription required for skills"})
    
    if file.filename == '':
        return JSONResponse(status_code=400, content={"error": "No file selected"})
        
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'svg'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return JSONResponse(status_code=400, content={"error": "File type not allowed"})
    
    skills_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'files', 'skills')
    os.makedirs(skills_path, exist_ok=True)
    
    extension = file.filename.rsplit('.', 1)[1].lower()
    
    if skill_id:
        filename = f"{user_id}_{skill_id}.{extension}"
    else:
        import time
        timestamp = int(time.time())
        filename = f"{user_id}_{timestamp}.{extension}"
    
    file_path = os.path.join(skills_path, filename)
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            
        file_content = await file.read()
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        image_url = f"/v1/files/skills/{filename}"
        
        return JSONResponse(status_code=200, content={
            "success": True,
            "image_url": image_url
        })
    except Exception as e:
        logger.error(f"Error saving skill image: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to save skill image: {str(e)}"})


@router.delete("/users/me/links/{link_id}")
async def delete_custom_link(link_id: int, context: AuthContext = Depends(get_auth_context)):
    user_id, error = check_context(context)
    if not user_id or error:
        return error
    
    link = get_custom_link_by_id(link_id)
    if not link or link.get("user_id") != user_id:
        return JSONResponse(status_code=404, content={"error": "Custom link not found"})
    
    try:
        with get_db_session() as session:
            link_obj = session.query(CustomLink).get(link_id)
            if link_obj:
                session.delete(link_obj)
                session.commit()
        return JSONResponse(status_code=204, content={})
    except Exception as e:
        logger.error(f"Error deleting custom link: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Failed to delete custom link: {str(e)}"})