from typing import Optional, List
import os

class Settings:
    PROJECT_NAME: str = "Telegram Business Card"
    API_V1_STR: str = "/api/v1"
    
    # Database settings - Using SQLite for development
    USE_SQLITE: bool = True  # Set to False to use PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "telegram_business_card"
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "YOUR_SECRET_KEY_HERE"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = "YOUR_TELEGRAM_BOT_TOKEN"  # Add your bot token here
    
    # Admin users - List of telegram_id values for admin users
    # These users will receive notifications about new users, security issues, etc.
    ADMIN_USER_IDS: List[str] = ["ADMIN_TELEGRAM_ID_1", "ADMIN_TELEGRAM_ID_2"]
    
    # Payment Integration (for premium features)
    PAYMENT_API_KEY: str = "YOUR_PAYMENT_API_KEY"  # Change in production

    def __init__(self):
        if self.USE_SQLITE:
            self.DATABASE_URL = "sqlite:///./telegram_business_card.db"
        else:
            self.DATABASE_URL = os.getenv(
                "DATABASE_URL", 
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

settings = Settings() 