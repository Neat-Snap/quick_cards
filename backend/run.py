"""
Run script for the Telegram Business Card backend application
"""

import sys
import os
import threading

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.bot import bot

def run_bot():
    bot.infinity_polling()

if __name__ == "__main__":
    thread = threading.Thread(target=run_bot, daemon=True)
    thread.start()
    app.run(host="0.0.0.0", port=8000, debug=True)