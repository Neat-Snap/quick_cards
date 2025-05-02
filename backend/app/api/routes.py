from fastapi import FastAPI
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def register_routes(app: FastAPI) -> FastAPI:
    from app.api.auth import router as auth_router
    from app.api.users import router as users_router
    from app.api.premium import router as premium_router
    from app.api.file_routes import router as files_router
    
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(premium_router)
    app.include_router(files_router)
    
    logger.info(f"Registered auth router: {auth_router.prefix}")
    logger.info(f"Registered users router: {users_router.prefix}")
    logger.info(f"Registered premium router: {premium_router.prefix}")
    logger.info(f"Registered files router: {files_router.prefix}")
    
    return app