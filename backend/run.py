import sys
import os
import threading
import uvicorn
import logging

logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.bot import bot

def run_bot():
    bot.infinity_polling()

if __name__ == "__main__":
    thread = threading.Thread(target=run_bot, daemon=True)
    thread.start()

    logger.info("Started the bot")
    
    # Do not import app directly to avoid circular imports
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)