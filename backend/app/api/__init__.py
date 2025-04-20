"""
API Routes and Endpoints

This package contains all API routes and endpoint handlers.
"""

# Only import register_routes to avoid circular imports
from app.api.routes import register_routes

# Don't import all modules here to avoid circular dependencies
# The modules will be imported by register_routes when needed