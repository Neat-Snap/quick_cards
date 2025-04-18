# Telegram Business Card Creator Backend

This is the backend API for the Telegram Business Card Creator app, built with Python and FastAPI.

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