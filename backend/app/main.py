from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import threading
import uvicorn
from sqlalchemy import inspect

from app.core.config import settings
from app.db.session import engine
from app.db.functions import get_db_session

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# Import routes after app creation to avoid circular imports
from app.api.routes import register_routes

# Add Telegram authentication middleware
# from app.middleware.telegram_auth import TelegramAuthMiddleware
# app.add_middleware(TelegramAuthMiddleware)

# Register API routes
register_routes(app)

# Initialize the database
try:
    logger.info("Starting database initialization...")
    from app.db.init_db import init_db
    
    # Initialize database
    success = init_db()
    
    if success:
        logger.info("Database initialization completed successfully")
    else:
        logger.error("Database initialization failed - check logs for details")
        
except Exception as e:
    logger.error(f"Error during database initialization: {e}", exc_info=True)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all registered routes"""
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": [method for method in route.methods] if route.methods else [],
        })
    return routes

@app.get("/debug/db")
async def debug_db(db = Depends(get_db_session)):
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    table_info = {}
    
    for table in tables:
        columns = inspector.get_columns(table)
        table_info[table] = [column['name'] for column in columns]
    
    row_counts = {}
    for table in tables:
        try:
            result = db.execute(f"SELECT COUNT(*) FROM {table}")
            count = result.scalar()
            row_counts[table] = count
        except Exception as e:
            row_counts[table] = f"Error: {str(e)}"
    
    return {
        "tables": tables,
        "table_info": table_info,
        "row_counts": row_counts
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)