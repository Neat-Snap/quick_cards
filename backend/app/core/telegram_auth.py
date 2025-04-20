import hmac
import hashlib
import time
import json
import urllib.parse
from typing import Dict, Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

def validate_telegram_data(init_data: str) -> Tuple[bool, Optional[Dict], str]:
    """
    Validate the telegram web app init_data received from Telegram.
    
    Args:
        init_data: The init data string from Telegram. Can be:
            - Raw init_data from post request
            - URL encoded data from tgWebAppData parameter in URL
    
    Returns:
        Tuple of (is_valid, data_dict, error_message)
        - is_valid: Boolean indicating if the data is valid
        - data_dict: Dictionary containing the parsed data if valid, otherwise None
        - error_message: Error message if validation failed, otherwise empty string
    """
    if not init_data:
        return False, None, "No initialization data provided"
    
    logger.info(f"Init data: {init_data}")
    
    # Check if this is from URL parameter (tgWebAppData)
    # In that case, it's already URL encoded
    if init_data.startswith("user="):
        # It's already in the right format
        pass
    # If it might be a full URL with tgWebAppData parameter
    elif "tgWebAppData=" in init_data:
        try:
            # Extract just the tgWebAppData part from the URL
            parts = init_data.split("tgWebAppData=", 1)
            if len(parts) > 1:
                init_data = parts[1]
                # If there are other URL params after this one, remove them
                if "&" in init_data:
                    init_data = init_data.split("&", 1)[0]
                # URL decode once to get the actual init_data string
                init_data = urllib.parse.unquote(init_data)
        except Exception as e:
            return False, None, f"Failed to parse tgWebAppData parameter: {str(e)}"
    
    # Parse the data
    data_dict = {}
    for item in init_data.split('&'):
        if '=' in item:
            key, value = item.split('=', 1)
            data_dict[key] = value
    
    # DEVELOPMENT MODE: Skip validation for faster development
    # Just uncomment this section if you need to bypass validation temporarily
    """
    if 'user' in data_dict:
        try:
            user_data = urllib.parse.unquote(data_dict.get('user', '{}'))
            user_json = json.loads(user_data)
            if user_json.get('id') in [1215863434]:  # List of allowed developer IDs
                logger.warning("DEVELOPER MODE: Skipping hash validation!")
                return True, data_dict, ""
        except Exception:
            pass
    """
    
    # Check required fields
    if 'user' not in data_dict:
        return False, None, "Missing user field in init data"
    
    # Check if we have hash or signature
    has_hash = 'hash' in data_dict
    has_signature = 'signature' in data_dict
    
    if not has_hash and not has_signature:
        return False, None, "No signature or hash found"
    
    # Handle hash-based validation
    if has_hash:
        logger.info("Hash is in data dict")
        received_hash = data_dict.pop('hash')
        logger.info(f"Received hash: {received_hash}")

        # Собираем строку:
        data_check_string = '\n'.join(f"{k}={v}" for k, v in sorted(data_dict.items()))
        logger.info(f"Data check string: {data_check_string}")

        # Правильный secret_key
        secret_key = hmac.new(
            key=settings.TELEGRAM_BOT_TOKEN.encode(),
            msg=b'WebAppData',
            digestmod=hashlib.sha256
        ).digest()
        logger.info(f"Secret key: {secret_key}")

        # Считаем и сравниваем
        computed_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        logger.info(f"Computed hash: {computed_hash}")
        logger.info(f"Received hash: {received_hash}")
        
        # Verify the hash
        if received_hash != computed_hash:
            # FOR TESTING ONLY: Bypass validation for specific users or IPs
            # Try to extract telegram_id to see if this is a developer
            try:
                user_data = urllib.parse.unquote(data_dict.get('user', '{}'))
                user_json = json.loads(user_data)
                # List your developer telegram IDs here
                if user_json.get('id') in [1215863434]:  # Example ID
                    logger.warning("DEVELOPER OVERRIDE: Allowing invalid hash for developer!")
                    data_dict['hash'] = received_hash
                    return True, data_dict, ""
            except Exception as e:
                logger.error(f"Error checking developer override: {e}")
                
            logger.error(f"Data check string: {data_check_string}")
            return False, None, "Data verification failed: hash mismatch"
        
        # Put the hash back for reference
        data_dict['hash'] = received_hash
    
    # Handle Ed25519 signature validation
    elif has_signature:
        # This is the newer Ed25519 signature method
        # Currently we'll just accept it without validation for development
        logger.warning("Ed25519 signature validation not fully implemented - accepting without validation")
        if 'user' in data_dict:
            try:
                user_data = urllib.parse.unquote(data_dict.get('user', '{}'))
                user_json = json.loads(user_data)
                # Add logic to restrict to specific users if needed
            except Exception:
                pass
        return True, data_dict, ""
    
    # Check auth date (optional: validate that the auth date is recent)
    if 'auth_date' in data_dict:
        try:
            auth_date = int(data_dict['auth_date'])
            current_time = int(time.time())
            # Reject if auth date is older than 1 day (86400 seconds)
            if current_time - auth_date > 86400:
                logger.warning(f"Auth date too old: {auth_date}, current: {current_time}")
                # FOR DEVELOPMENT: Skip this check
                # return False, None, "Authentication data is outdated"
                pass
        except (ValueError, TypeError):
            return False, None, "Invalid auth_date format"
    
    return True, data_dict, ""


def extract_user_info(data_dict: Dict) -> Dict:
    """
    Extract user information from the validated telegram data.
    
    Args:
        data_dict: The validated dictionary from the init_data
        
    Returns:
        Dictionary containing user information
    """
    user_info = {}
    
    # Try to parse the user field which contains JSON
    try:
        user_data = urllib.parse.unquote(data_dict.get('user', '{}'))
        user_json = json.loads(user_data)
        
        # Extract basic user info
        user_info = {
            'telegram_id': str(user_json.get('id')),
            'username': user_json.get('username'),
            'name': f"{user_json.get('first_name', '')} {user_json.get('last_name', '')}".strip(),
            'language_code': user_json.get('language_code'),
            'is_premium': user_json.get('is_premium', False),
            'photo_url': user_json.get('photo_url')
        }
        
        # Store the original user data as well
        user_info['raw_data'] = user_data
        
    except Exception as e:
        user_info['error'] = str(e)
    
    return user_info


def parse_init_data_from_url(url: str) -> str:
    """
    Extract the init_data from a Telegram Web App URL.
    
    Args:
        url: The complete URL that might contain tgWebAppData
        
    Returns:
        The extracted init_data string or empty string if not found
    """
    try:
        if "tgWebAppData=" not in url:
            return ""
        
        # Extract just the tgWebAppData part
        parts = url.split("tgWebAppData=", 1)
        if len(parts) < 2:
            return ""
            
        init_data = parts[1]
        
        # If there are other URL params after this one, remove them
        if "&" in init_data:
            init_data = init_data.split("&", 1)[0]
            
        # URL decode to get the actual init_data string
        init_data = urllib.parse.unquote(init_data)
        
        return init_data
    except Exception:
        return ""