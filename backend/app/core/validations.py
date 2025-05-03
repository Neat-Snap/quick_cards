import re
from datetime import datetime

ALLOWED_PREMIUM_TIERS = {0, 1, 2, 3}
ALLOWED_BACKGROUND_TYPES = {"color", "gradient", "image"}
ALLOWED_CONTACT_TYPES = {"phone", "email", "telegram", "website"}

def validate_string(string: str) -> bool:
    if not isinstance(string, str):
        return False
    if any(c in string for c in ['"', '/', '\\', ';', '|', '`', '$', '!', '=', '+', '-']):
        return False
    return True


def validate_date_iso(s: str) -> bool:
    if not isinstance(s, str):
        return False
    try:
        datetime.fromisoformat(s)
        return True
    except ValueError:
        return False

def validate_user_data(user_data: dict):
    uid = user_data.get("id")
    if uid is not None:
        if not isinstance(uid, int) or uid < 0:
            return False, "Invalid or missing user id"

    username = user_data.get("username")
    if username is not None:
        if not isinstance(username, str) or len(username) > 100 or not validate_string(username):
            return False, "Invalid username"

    name = user_data.get("name")
    if name is not None:
        if not isinstance(name, str) or not (1 < len(name) <= 100) or not validate_string(name):
            return False, "Invalid name"

    badge = user_data.get("badge")
    if badge is not None:
        if not isinstance(badge, str) or not (1 < len(badge) <= 20) or not validate_string(badge):
            return False, "Invalid badge"

    tier = user_data.get("premium_tier")
    if tier is not None:
        if tier not in ALLOWED_PREMIUM_TIERS:
            return False, "Invalid premium tier"

    btype = user_data.get("background_type")
    if btype is not None:
        if btype not in ALLOWED_BACKGROUND_TYPES:
            return False, "Invalid background type"

    bval = user_data.get("background_value")
    if bval is not None:
        if not isinstance(bval, str) or len(bval) > 255:
            return False, "Invalid background value"
        if (user_data.get("background_type") == "color") and not re.fullmatch(r"^#(?:[0-9A-Fa-f]{6})$", bval):
            return False, "Invalid color value"

    desc = user_data.get("description")
    if desc is not None:
        if not isinstance(desc, str) or len(desc) > 1000 or not validate_string(desc):
            return False, "Invalid description"

    contacts = user_data.get("contacts")
    if contacts is not None:
        if not isinstance(contacts, list):
            return False, "Contacts must be a list"
        for c in contacts:
            if not isinstance(c, dict):
                return False, "Each contact must be a dict"
            ctype = c.get("type")
            if ctype not in ALLOWED_CONTACT_TYPES:
                return False, f"Invalid contact type: {ctype}"
            is_pub = c.get("is_public")
            if not isinstance(is_pub, bool):
                return False, "Contact is_public must be a boolean"

    projects = user_data.get("projects")
    if projects is not None:
        if not isinstance(projects, list):
            return False, "Projects must be a list"
        for p in projects:
            if not isinstance(p, dict):
                return False, "Each project must be a dict"
            pname = p.get("name")
            if pname is not None:
                if not isinstance(pname, str) or not (1 <= len(pname) <= 100) or not validate_string(pname):
                    return False, "Invalid project name"
            pdesc = p.get("description")
            if pdesc is not None and (not isinstance(pdesc, str) or len(pdesc) > 1000 or not validate_string(pdesc)):
                return False, "Invalid project description"
            prole = p.get("role")
            if prole is not None and (not isinstance(prole, str) or len(prole) > 100 or not validate_string(prole)):
                return False, "Invalid project role"

    links = user_data.get("custom_links")
    if links is not None:
        if not isinstance(links, list):
            return False, "Custom links must be a list"
        for l in links:
            title = l.get("title")
            if title is not None:
                if not isinstance(title, str) or not (1 <= len(title) <= 100) or not validate_string(title):
                    return False, "Invalid custom link title"

    return True, None


def validate_contact(contact_data):
    if not isinstance(contact_data, dict):
        return False, "Contact data must be a dictionary"

    ctype = contact_data.get("type")
    value = contact_data.get("value")

    if ctype not in ALLOWED_CONTACT_TYPES:
        return False, "Invalid contact type"

    if not isinstance(value, str) or not value:
        return False, "Contact value must be a non-empty string"

    if ctype == "phone":
        if not re.fullmatch(r"^\+?\d{7,16}$", value):
            return False, "Invalid phone number format"
    elif ctype == "email":
        if not re.fullmatch(r"^[^@]+@[^@]+\.[^@]+$", value) or len(value) > 100:
            return False, "Invalid email format"
    elif ctype == "telegram":
        if not re.fullmatch(r"^[a-zA-Z0-9_]{5,32}$", value):
             False, "Invalid Telegram username"
    elif ctype == "linkedin":
        if not value.startswith("https://www.linkedin.com/") or len(value) > 255:
            return False, "Invalid LinkedIn URL"
    elif ctype == "github":
        if not re.fullmatch(r"^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$", value):
            return False, "Invalid GitHub username"
    elif ctype == "website":
        if not re.fullmatch(r"^https?://[^\s/$.?#].[^\s]*$", value) or len(value) > 255:
            return False, "Invalid website URL"

    is_public = contact_data.get("is_public")
    if not isinstance(is_public, bool):
        return False, "is_public must be a boolean"

    return True, None

def validate_project(project_data):
    if not isinstance(project_data, dict):
        return False, "Project data must be a dictionary"

    name = project_data.get("name")
    if not isinstance(name, str) or not (1 <= len(name) <= 100) or not validate_string(name):
        return False, "Invalid project name"

    description = project_data.get("description")
    if description is not None:
        if not isinstance(description, str) or len(description) > 1000 or not validate_string(description):
            return False, "Invalid project description"

    role = project_data.get("role")
    if role is not None:
        if not isinstance(role, str) or len(role) > 100 or not validate_string(role):
            return False, "Invalid project role"

    return True, None