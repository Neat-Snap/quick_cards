from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/v1/files",
    tags=["files"]
)

@router.get("/{file_path:path}")
async def get_file(file_path: str):
    safe_path = os.path.normpath(file_path).lstrip('/')
    
    files_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'files')
    
    full_path = os.path.join(files_dir, safe_path)
    
    try:
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            logger.error(f"File not found: {safe_path}")
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(full_path)
    except Exception as e:
        logger.error(f"Error serving file {safe_path}: {e}")
        raise HTTPException(status_code=404, detail="File not found")