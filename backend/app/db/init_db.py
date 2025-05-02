import logging
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import SessionLocal, engine
from app.db.models import Base, PremiumFeature
from app.db.init_data import PREMIUM_FEATURES

logger = logging.getLogger(__name__)


def verify_table_exists(table_name: str) -> bool:
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def init_db():
    logger.info("Starting comprehensive database initialization...")

    try:
        # Step 1: Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created all tables")

        all_tables = ['users', 'contacts', 'projects', 'skills', 'custom_links', 'premium_features', 'user_skill']
        for table in all_tables:
            if verify_table_exists(table):
                logger.info(f"Table '{table}' exists")
            else:
                logger.error(f"Table '{table}' does not exist!")
                raise Exception(f"Table '{table}' was not created")

        db = SessionLocal()
        try:
            existing_features = db.query(PremiumFeature.name).all()
            existing_names = [name for (name,) in existing_features]
            logger.info(f"Found {len(existing_names)} existing premium features")

            features_added = 0
            for feature in PREMIUM_FEATURES:
                if feature["name"] not in existing_names:
                    db.add(PremiumFeature(**feature))
                    features_added += 1

            if features_added > 0:
                db.commit()
                logger.info(f"Added {features_added} new premium features")
            else:
                logger.info("No new premium features needed")

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error while inserting premium features: {e}")
            raise
        finally:
            db.close()

        logger.info("Database initialization completed successfully")
        return True

    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        return False
