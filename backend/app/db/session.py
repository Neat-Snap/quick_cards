from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
import logging
from contextlib import contextmanager


from app.core.config import settings

logger = logging.getLogger(__name__)


engine = create_engine(settings.DATABASE_URL)
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(SessionFactory)

@contextmanager
def get_db_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"[DB] Error in session: {e}", exc_info=True)
        raise
    finally:
        session.close()


# def init_db():
#     """Initialize database tables and data"""
#     logger.info("Starting database initialization...")
    
#     try:
#         # Import here to avoid circular imports
#         from app.db.init_db import init_db as impl_init_db
        
#         # Call the implementation
#         result = impl_init_db()
        
#         if result:
#             logger.info("Database initialization completed successfully")
#         else:
#             logger.error("Database initialization failed")
            
#         return result
#     except Exception as e:
#         logger.error(f"Error in database initialization: {e}", exc_info=True)
#         return False