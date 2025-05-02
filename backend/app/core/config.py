from typing import Optional, List
import os

class Settings:
    PROJECT_NAME: str = "Telegram Business Card"
    API_V1_STR: str = "/api/v1"

    APP_URL: str = "https://face-cards.ru"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "maskotter"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "tbc"
    DATABASE_URL: Optional[str] = None
    
    SECRET_KEY: str = "95d3763fb5bca12c56d527d7d3d6a6d8147cda13ed87e012bd1728fdc21b47fc"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 1
    
    TELEGRAM_BOT_TOKEN: str = "7762206500:AAGvP48wGoOpkK4aetC3FFFBceLTT1e9Ylo"
    
    ADMIN_USER_IDS: List[str] = [1215863434]

    def __init__(self):
       self.DATABASE_URL = os.getenv(
                "DATABASE_URL", 
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

settings = Settings()