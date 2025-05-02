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
    """Serve files from the files directory"""
    # Sanitize file path to prevent directory traversal attacks
    safe_path = os.path.normpath(file_path).lstrip('/')
    
    # Determine the base files directory
    files_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'files')
    
    # Full path to the file
    full_path = os.path.join(files_dir, safe_path)
    
    try:
        # Check if file exists
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            logger.error(f"File not found: {safe_path}")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Use FastAPI's FileResponse to serve the file
        return FileResponse(full_path)
    except Exception as e:
        logger.error(f"Error serving file {safe_path}: {e}")
        raise HTTPException(status_code=404, detail="File not found")