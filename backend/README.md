# Telegram Business Card Backend

This is the backend for the Telegram Business Card Mini App. It provides the API for managing user profiles, cards, and premium features.

## Telegram Mini App Authentication

This backend implements Telegram Mini App authentication according to the [official documentation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app).

### How Authentication Works

When a user opens the Telegram Mini App, Telegram passes authentication data to the web app through the URL. The web app then forwards this data to the backend for validation. The process is as follows:

1. When the Mini App is loaded in Telegram, it receives initialization data via the `window.Telegram.WebApp.initData` property.
2. The frontend extracts this data and includes it in API requests to the backend:
   - Either as a header: `X-Telegram-Init-Data: <init_data>`
   - Or through the `/api/v1/auth/init` endpoint for initial authentication.

3. The backend validates this data by:
   - Parsing the initialization data
   - Checking the presence of required fields (user, hash)
   - Verifying the hash signature using the bot token
   - Checking that the auth date is recent

4. After validation, the backend:
   - Extracts the user's Telegram ID and other details
   - Finds or creates the corresponding user in the database
   - Provides appropriate access tokens or session information

### Authentication Endpoints

#### `POST /api/v1/auth/init`

Initializes a session based on Telegram authentication data.

**Request:**
```json
{
  "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1672527737&hash=c0c8058c6a962e3363accf844a7693ef0e43309d346fa9f8a26842f33a0a30a3"
}
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "telegram_id": "123456789",
    "username": "johndoe",
    "name": "John Doe",
    "avatar_url": "https://...",
    "premium_tier": 0,
    "premium_expires_at": null
  },
  "is_new_user": false
}
```

### Using Headers for Authentication

The backend also supports authentication via the `X-Telegram-Init-Data` header. When this header is present, the backend automatically validates it and makes the user available in the request context.

For example:
```
GET /api/v1/users/me
X-Telegram-Init-Data: query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22johndoe%22%2C%22language_code%22%3A%22en%22%7D&auth_date=1672527737&hash=c0c8058c6a962e3363accf844a7693ef0e43309d346fa9f8a26842f33a0a30a3
```

### Backward Compatibility

For backward compatibility, the API still supports authentication via the `telegram_id` query parameter, but this method is less secure and should only be used during development. For example:

```
GET /api/v1/users/me?telegram_id=123456789
```

## Configuration

Update the `config.py` file with your Telegram Bot token:

```python
TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN"
```

## Security Notes

1. Always verify the authentication data on the server side.
2. The hash in the init data is created using HMAC-SHA-256 with a secret key derived from the bot token.
3. Do not embed your bot token in the frontend code.

## Setup and Installation

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the development server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

The backend will provide the following API endpoints:

- `POST /api/auth` - Authenticate with Telegram
- `GET /api/cards` - Get all cards for a user
- `GET /api/cards/{id}` - Get a specific card
- `POST /api/cards` - Create a new card
- `PUT /api/cards/{id}` - Update a card
- `DELETE /api/cards/{id}` - Delete a card
- `POST /api/payments` - Process Telegram Stars payment

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py
│   │   │   ├── cards.py
│   │   │   └── payments.py
│   │   └── api.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── database.py
│   │   └── models.py
│   ├── schemas/
│   │   ├── card.py
│   │   ├── payment.py
│   │   └── user.py
│   └── main.py
├── tests/
│   └── test_api.py
├── requirements.txt
└── README.md
```

## Requirements

```
fastapi>=0.95.0
uvicorn>=0.21.0
pydantic>=1.10.7
sqlalchemy>=2.0.9
python-multipart>=0.0.6
python-jose>=3.3.0
passlib>=1.7.4
email-validator>=2.0.0
``` 