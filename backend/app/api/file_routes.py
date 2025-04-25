from flask import Blueprint, send_from_directory, current_app, jsonify
import os
import logging

logger = logging.getLogger(__name__)


files_bp = Blueprint("files", __name__, url_prefix="/v1/files")

@files_bp.route("/<path:file_path>", methods=["GET"])
def get_file(file_path):
    """Serve files from the files directory"""
    # Sanitize file path to prevent directory traversal attacks
    safe_path = os.path.normpath(file_path).lstrip('/')
    
    # Determine the base files directory
    files_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'files')
    
    try:
        # Use Flask's send_from_directory to safely serve the file
        return send_from_directory(files_dir, safe_path)
    except Exception as e:
        logger.error(f"Error serving file {safe_path}: {e}")
        return jsonify({"error": "File not found"}), 404
