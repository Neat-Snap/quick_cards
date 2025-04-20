import hmac
import hashlib
import time
import json
import urllib.parse
from typing import Dict, Optional, Tuple
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN   # ваш реальный токен

def validate_telegram_data(init_data: str) -> Tuple[bool, Optional[Dict], str]:
    """
    Возвращает (ok, parsed_dict, error).
    """
    try:
        # parse_qsl сразу ДЕКОДИРУЕТ значения + превращает '+' в пробел
        pairs = urllib.parse.parse_qsl(init_data, strict_parsing=True)
    except ValueError:
        return False, None, "init_data is not a valid query string"

    data = dict(pairs)

    # 1. достаём и убираем hash
    if "hash" not in data:
        return False, None, "hash missing"
    received_hash = data.pop("hash")

    # 2. собираем data_check_string (только раскодированные значения!)
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))

    # 3. secret_key = HMAC_SHA256("WebAppData", bot_token)
    secret_key = hmac.new(
        key=b"WebAppData",
        msg=BOT_TOKEN.encode(),
        digestmod=hashlib.sha256
    ).digest()

    # 4. вычисляем hash
    calculated = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated, received_hash):
        return False, None, "hash mismatch"

    # всё ок
    data["hash"] = received_hash          # вернём обратно, если нужно
    return True, data, ""

# def validate_telegram_data(init_data: str) -> Tuple[bool, Optional[Dict], str]:
#     """
#     Validate the Telegram Web App init_data received from Telegram using HMAC‑SHA256.
#     Logs each step for debugging.
#     Returns (is_valid, data_dict, error_message).
#     """
#     if not init_data:
#         return False, None, "No initialization data provided"

#     logger.info(f"Init data: {init_data}")

#     # If passed as full URL, extract tgWebAppData param
#     if "tgWebAppData=" in init_data and not init_data.startswith("user="):
#         try:
#             parts = init_data.split("tgWebAppData=", 1)
#             init_data = parts[1].split("&", 1)[0]
#             init_data = urllib.parse.unquote(init_data)
#             logger.info(f"Parsed tgWebAppData: {init_data}")
#         except Exception as e:
#             return False, None, f"Failed to parse tgWebAppData: {e}"

#     # Parse key=value pairs
#     data_dict: Dict[str, str] = {}
#     for item in init_data.split("&"):
#         if "=" in item:
#             k, v = item.split("=", 1)
#             data_dict[k] = v

#     # Ensure we have at least a user field
#     if "user" not in data_dict:
#         return False, None, "Missing user field in init data"

#     # Must have either hash or signature
#     has_hash = "hash" in data_dict
#     has_signature = "signature" in data_dict
#     if not has_hash and not has_signature:
#         return False, None, "No signature or hash found"

#     # If hash-based validation:
#     if has_hash:
#         logger.info("Hash is in data dict")
#         received_hash = data_dict.pop("hash")
#         # Remove signature if present
#         signature = data_dict.pop("signature", None)

#         logger.info(f"Received hash: {received_hash}")

#         # Build the data_check_string from the remaining keys
#         data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data_dict.items()))
#         logger.info(f"Data check string:\n{data_check_string}")

#         # Compute secret_key = HMAC_SHA256(bot_token, "WebAppData")
#         secret_key = hmac.new(
#             key=b"WebAppData",
#             msg=settings.TELEGRAM_BOT_TOKEN.encode(),
#             digestmod=hashlib.sha256
#         ).digest()
#         logger.info(f"Secret key: {secret_key}")

#         # Compute HMAC of data_check_string
#         computed_hash = hmac.new(
#             key=secret_key,
#             msg=data_check_string.encode(),
#             digestmod=hashlib.sha256
#         ).hexdigest()
#         logger.info(f"Computed hash: {computed_hash}")
#         logger.info(f"Received hash: {received_hash}")

#         # Constant‑time compare
#         if not hmac.compare_digest(computed_hash, received_hash):
#             logger.error("Hash mismatch!")
#             return False, None, "Data verification failed: hash mismatch"

#         # Put fields back for further use
#         data_dict["hash"] = received_hash
#         if signature:
#             data_dict["signature"] = signature

#     # (Optional) Ed25519 signature case
#     elif has_signature:
#         logger.warning("Ed25519 signature validation not implemented — accepting for now")
#         # You can implement Ed25519 verify here if needed
#         # data_dict stays as-is

#     # (Optional) Check freshness
#     if "auth_date" in data_dict:
#         try:
#             auth_date = int(data_dict["auth_date"])
#             if time.time() - auth_date > 86400:
#                 logger.warning("Auth date is older than 24h")
#                 # return False, None, "Authentication data is outdated"
#         except ValueError:
#             return False, None, "Invalid auth_date format"

#     return True, data_dict, ""


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