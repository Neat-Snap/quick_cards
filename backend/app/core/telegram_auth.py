import hmac
import hashlib
import time
import json
import urllib.parse
from typing import Dict, Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN

def validate_telegram_data(init_data: str) -> Tuple[bool, Optional[Dict], str]:
    try:
        pairs = urllib.parse.parse_qsl(init_data, strict_parsing=True)
    except ValueError:
        return False, None, "init_data is not a valid query string"

    data = dict(pairs)

    if "hash" not in data:
        return False, None, "hash missing"
    received_hash = data.pop("hash")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))

    secret_key = hmac.new(
        key=b"WebAppData",
        msg=BOT_TOKEN.encode(),
        digestmod=hashlib.sha256
    ).digest()

    calculated = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated, received_hash):
        return False, None, "hash mismatch"
    logger.info(f"Hash is valid")

    data["hash"] = received_hash
    return True, data, ""


def extract_user_info(data_dict: Dict) -> Dict:
    user_info = {}
    
    try:
        user_data = urllib.parse.unquote(data_dict.get('user', '{}'))
        user_json = json.loads(user_data)
        
        user_info = {
            'telegram_id': str(user_json.get('id')),
            'username': user_json.get('username'),
            'name': f"{user_json.get('first_name', '')} {user_json.get('last_name', '')}".strip(),
            'language_code': user_json.get('language_code'),
            'is_premium': user_json.get('is_premium', False),
            'photo_url': user_json.get('photo_url')
        }
        
        user_info['raw_data'] = user_data
        
    except Exception as e:
        user_info['error'] = str(e)
    
    return user_info


def parse_init_data_from_url(url: str) -> str:
    try:
        if "tgWebAppData=" not in url:
            return ""
        
        parts = url.split("tgWebAppData=", 1)
        if len(parts) < 2:
            return ""
            
        init_data = parts[1]
        
        if "&" in init_data:
            init_data = init_data.split("&", 1)[0]
            
        init_data = urllib.parse.unquote(init_data)
        
        return init_data
    except Exception:
        return ""