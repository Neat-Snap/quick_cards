import logging
from typing import Optional

from fastapi import Request, Depends
from fastapi.exceptions import HTTPException
from jose import JWTError, jwt
from starlette.status import HTTP_401_UNAUTHORIZED

from app.core.telegram_auth import (
    validate_telegram_data,
    extract_user_info,
    parse_init_data_from_url,
)
from app.db.session import get_db_session
from app.db.models import User
from app.core.config import settings

logger = logging.getLogger(__name__)

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

class AuthContext:
    current_user: Optional[User] = None
    telegram_data: Optional[dict] = None
    telegram_user: Optional[dict] = None
    telegram_auth_error: Optional[str] = None

async def get_auth_context(request: Request) -> AuthContext:
    context = AuthContext()
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split("Bearer ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid JWT: no subject")

            with get_db_session() as session:
                user = session.query(User).get(user_id)
                if user:
                    context.current_user = user
                    logger.debug(f"Authenticated via JWT: {user_id}")
                    return context
                else:
                    logger.warning(f"JWT valid, but user {user_id} not found")
        except JWTError as e:
            logger.debug(f"JWT decode failed: {str(e)}")

    init_data = (
        request.headers.get("X-Telegram-Init-Data")
        or parse_init_data_from_url(str(request.url))
        or (await request.json()).get("initData") if request.headers.get("content-type", "").startswith("application/json") else None
    )

    if not init_data:
        return context

    logger.debug(f"Processing Telegram init data from: {request.url.path}")

    is_valid, data_dict, error_message = validate_telegram_data(init_data)
    if not is_valid:
        context.telegram_auth_error = error_message
        logger.warning(f"Invalid Telegram data: {error_message}")
        return context

    user_info = extract_user_info(data_dict)
    context.telegram_data = data_dict
    context.telegram_user = user_info

    telegram_id = user_info.get("telegram_id")
    if telegram_id:
        with get_db_session() as session:
            user = session.query(User).filter_by(id=telegram_id).first()
            if user:
                context.current_user = user
                logger.debug(f"User authenticated via Telegram: {telegram_id}")
            else:
                logger.debug(f"Telegram user {telegram_id} not found in DB")

    return context


def check_context(context: AuthContext):
    if context.telegram_auth_error:
        return None, HTTPException(status_code=401, detail=context.telegram_auth_error)
    
    if not context.current_user:
        return None, HTTPException(status_code=401, detail="User not found")

    return context.current_user, None

