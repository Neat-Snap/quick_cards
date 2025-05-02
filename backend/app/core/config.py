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

    SECURITY_CODE: str = "bb899b244736f664d1e0549f6ae2f267e098c30eb633976242cdd8eec630ec87e91144a5d80c2d6d2f800c8ae2560380c9e3dee124b8db20910eb50d8b56b7644774bed2751abecfc32cbee3efe6e1e2e925ffa9fd1b4843842177d2765c3876afaa231591b9a1c13cd1c5a1a9e944e2bedeb422ca05956120ca6ad7ca466e53c90a30cd83bff186a8dc854fe1c199546ba4f19ce780cddf8b6f41438c63e129"
    
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