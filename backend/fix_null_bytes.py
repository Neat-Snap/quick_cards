#!/usr/bin/env python3
"""
Script to remove null bytes from Python files,
which can cause 'source code string cannot contain null bytes' errors.
"""

import os
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def fix_file(filepath):
    """Remove null bytes from a file."""
    try:
        # Read the file content
        with open(filepath, 'rb') as f:
            content = f.read()
        
        # Check if it contains null bytes
        if b'\x00' in content:
            logger.info(f"Found null bytes in {filepath}")
            
            # Remove null bytes
            cleaned_content = content.replace(b'\x00', b'')
            
            # Write back the cleaned content
            with open(filepath, 'wb') as f:
                f.write(cleaned_content)
            
            logger.info(f"Cleaned {filepath}")
            return True
        else:
            logger.info(f"No null bytes found in {filepath}")
            return False
            
    except Exception as e:
        logger.error(f"Error processing {filepath}: {e}")
        return False

def fix_directory(directory):
    """Walk through a directory and fix all Python files."""
    fixed_files = 0
    
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith('.py'):
                filepath = os.path.join(root, filename)
                if fix_file(filepath):
                    fixed_files += 1
    
    return fixed_files

if __name__ == "__main__":
    app_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
    logger.info(f"Scanning directory: {app_dir}")
    
    if not os.path.exists(app_dir):
        logger.error(f"Directory not found: {app_dir}")
        sys.exit(1)
    
    fixed_count = fix_directory(app_dir)
    logger.info(f"Fixed {fixed_count} files")
    
    logger.info("Now fixing files in the current directory...")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    fixed_count = fix_directory(current_dir)
    logger.info(f"Fixed {fixed_count} files in the current directory")
    
    logger.info("Completed. Now try running start.py again.") 