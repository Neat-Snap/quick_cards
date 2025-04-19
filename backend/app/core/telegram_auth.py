import hmac
import hashlib
import time
from typing import Dict, Optional, Tuple

from app.core.config import settings


def validate_telegram_data(init_data: str) -> Tuple[bool, Optional[Dict], str]:
    """
    Validate the telegram web app init_data received from Telegram.
    
    Returns:
        Tuple of (is_valid, data_dict, error_message)
        - is_valid: Boolean indicating if the data is valid
        - data_dict: Dictionary containing the parsed data if valid, otherwise None
        - error_message: Error message if validation failed, otherwise empty string
    """
    if not init_data:
        return False, None, "No initialization data provided"
    
    # Parse the data
    data_dict = {}
    for item in init_data.split('&'):
        if '=' in item:
            key, value = item.split('=', 1)
            data_dict[key] = value
    
    # Check required fields
    if 'user' not in data_dict:
        return False, None, "No user data found"
    
    if 'hash' not in data_dict:
        return False, None, "No hash value found"
    
    # Extract the hash
    received_hash = data_dict.pop('hash')
    
    # Create the data check string
    data_check_string = '\n'.join([f"{key}={value}" for key, value in sorted(data_dict.items())])
    
    # Calculate the secret key using bot token
    secret_key = hmac.new(
        key=b'WebAppData',
        msg=settings.TELEGRAM_BOT_TOKEN.encode(),
        digestmod=hashlib.sha256
    ).digest()
    
    # Calculate the expected hash
    computed_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # Verify the hash
    if received_hash != computed_hash:
        return False, None, "Data verification failed: hash mismatch"
    
    # Check auth date (optional: validate that the auth date is recent)
    if 'auth_date' in data_dict:
        auth_date = int(data_dict['auth_date'])
        current_time = int(time.time())
        # Reject if auth date is older than 1 day (86400 seconds)
        if current_time - auth_date > 86400:
            return False, None, "Authentication data is outdated"
    
    # Put the hash back for reference
    data_dict['hash'] = received_hash
    
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
        import json
        from urllib.parse import unquote
        
        user_data = unquote(data_dict.get('user', '{}'))
        user_json = json.loads(user_data)
        
        # Extract basic user info
        user_info = {
            'telegram_id': str(user_json.get('id')),
            'username': user_json.get('username'),
            'name': f"{user_json.get('first_name', '')} {user_json.get('last_name', '')}".strip(),
            'language_code': user_json.get('language_code'),
            'is_premium': user_json.get('is_premium', False)
        }
        
        # Store the original user data as well
        user_info['raw_data'] = user_data
        
    except Exception as e:
        user_info['error'] = str(e)
    
    return user_info 