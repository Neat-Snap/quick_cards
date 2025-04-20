"""
Application Middleware Components

Contains request middleware and processing functions.
"""

from app.middleware.telegram_auth import init_telegram_auth_middleware
from app.middleware.auth import auth_required, get_current_user