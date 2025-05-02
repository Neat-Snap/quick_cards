from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
import logging

from app.db import get_user, create_user, set_user
from app.core.telegram_auth import validate_telegram_data, extract_user_info
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/v1/auth",
    tags=["auth"]
)

security = HTTPBearer()

def create_access_token(identity: str):
    from datetime import timedelta, datetime
    expires_delta = timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": identity, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


@router.get("/auth_health")
async def auth_health():
    return JSONResponse(status_code=200, content={"status": "ok"})


@router.post("/init")
async def initialize_from_telegram(request: Request):
    logger.info("Auth init endpoint called")
    
    try:
        telegram_user = getattr(request.state, 'telegram_user', None)
        
        if telegram_user:
            telegram_id = telegram_user.get('telegram_id')
            user_info = telegram_user
            logger.info(f"Using telegram_user from middleware: {telegram_id}")
        else:
            data = await request.json()
            init_data = data.get('initData') if data else None
            
            if not init_data:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "error": "No initData provided"}
                )
                
            is_valid, data_dict, error_message = validate_telegram_data(init_data)
            
            if not is_valid:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "error": f"Invalid initData: {error_message}"}
                )
                
            user_info = extract_user_info(data_dict)
            telegram_id = user_info.get('telegram_id')
            
            if not telegram_id:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "error": "Could not extract Telegram user ID"}
                )
        
        is_new_user = False
        user_id = str(telegram_id)
        user_data = get_user(user_id)
        
        if not user_data:
            is_new_user = True
            logger.info(f"Creating new user with id: {user_id}")
            
            success = create_user(
                user_id=user_id,
                username=user_info.get('username', ''),
                name=user_info.get('first_name', '') + (f" {user_info.get('last_name', '')}" if user_info.get('last_name') else ''),
                avatar_url=user_info.get('photo_url', ''),
                background_type="color",
                background_value="#f0f0f0",
                description="",
                badge="New User"
            )
            
            if not success:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "error": "Failed to create user"}
                )
                
            user_data = get_user(user_id)
            if not user_data:
                return JSONResponse(
                    status_code=500,
                    content={"success": False, "error": "User created but could not be retrieved"}
                )
                
            logger.info(f"New user created with ID: {user_id}")
        
        token = create_access_token(identity=str(user_id))
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "token": token,
                "user": {
                    "id": user_id,
                    "username": user_data.get("username", ""),
                    "first_name": user_info.get('first_name', ''),
                    "last_name": user_info.get('last_name', ''),
                    "avatar_url": user_data.get("avatar_url", ""),
                    "background_color": user_data.get("background_value", "#f0f0f0") if user_data.get("background_type", "") == "color" else "#f0f0f0",
                    "description": user_data.get("description", ""),
                    "badge": user_data.get("badge", "New User"),
                    "is_premium": user_data.get("premium_tier", 0) > 0
                },
                "is_new_user": is_new_user
            }
        )
    except Exception as e:
        logger.error(f"Error in auth_init: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


@router.post("/validate")
async def validate_token(request: Request):
    logger.info("Auth validate endpoint called")
    
    try:
        data = await request.json()
        token = data.get('token') if data else None
        
        if not token:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "No token provided"}
            )
        
        try:
            logger.debug(f"Validating token: {token[:10]}...")
            
            decoded = decode_token(token)
            
            logger.debug(f"Decoded token: {decoded}")
            
            user_id = decoded['sub']  # 'sub' is the JWT subject (user id)
            
            user_data = get_user(user_id)
            if not user_data:
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "error": f"User not found for ID: {user_id}"}
                )
                
            return JSONResponse(
                status_code=200,
                content={"success": True, "valid": True, "user_id": user_id}
            )
        except JWTError as e:
            logger.error(f"Token validation error: {str(e)}")
            return JSONResponse(
                status_code=401,
                content={"success": False, "valid": False, "error": str(e)}
            )
    except Exception as e:
        logger.error(f"Error in auth_validate: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )