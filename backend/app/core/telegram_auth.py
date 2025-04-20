import hmac
import hashlib
import time
import json
import urllib.parse
from typing import Dict, Optional, Tuple

from app.core.config import settings


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
    
    # Check if this is from URL parameter (tgWebAppData)
    # In that case, it's already URL encoded
    print(f"Init data: {init_data}")
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
    
    # Check required fields
    if 'user' not in data_dict and 'hash' not in data_dict:
        return False, None, "Missing required fields in init data"
    
    # Extract the hash or signature (depending on auth method)
    if 'hash' in data_dict:
        print("Hash is in data dict")
        received_hash = data_dict.pop('hash')
        
        # Create the data check string
        data_check_string = '\n'.join([f"{key}={value}" for key, value in sorted(data_dict.items())])
        
        # Calculate the secret key using bot token
        secret_key = hmac.new(
            key=b'WebAppData',
            msg=settings.TELEGRAM_BOT_TOKEN.encode(),
            digestmod=hashlib.sha256
        ).digest()

        print("Secret key: ", secret_key)
        
        # Calculate the expected hash
        computed_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()

        print("Computed hash: ", computed_hash)
        
        # Verify the hash
        if received_hash != computed_hash:
            return False, None, "Data verification failed: hash mismatch"
        
        # Put the hash back for reference
        data_dict['hash'] = received_hash
    elif 'signature' in data_dict:
        # This is the newer Ed25519 signature method
        # Currently not fully implemented
        return False, None, "Ed25519 signature validation not yet implemented"
    else:
        return False, None, "No signature or hash found"
    
    # Check auth date (optional: validate that the auth date is recent)
    if 'auth_date' in data_dict:
        try:
            auth_date = int(data_dict['auth_date'])
            current_time = int(time.time())
            # Reject if auth date is older than 1 day (86400 seconds)
            if current_time - auth_date > 86400:
                return False, None, "Authentication data is outdated"
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