"""
API Routes and Endpoints

This package contains all API routes and endpoint handlers.
"""

from app.api.routes import register_routes
from app.api.users import *
from app.api.premium import *
from app.api.auth import *

# Import any endpoint modules
try:
    from app.api.endpoints import *
except ImportError:
    pass  # Optional endpoints directory
