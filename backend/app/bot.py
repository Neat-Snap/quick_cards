import telebot
from app.core.config import settings
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from app.db.functions import get_user, set_user, update_user_premium_status
from app.constants import *
from datetime import datetime, timedelta
import requests
import logging
from app.main import app
# Initialize the bot
bot = telebot.TeleBot(settings.TELEGRAM_BOT_TOKEN)

logger = logging.getLogger(__name__)


def get_premium_tier(amount_in_stars):
    for tier in PREMIUM_TIERS:
        if tier["price"] == amount_in_stars:
            return tier
    return None

# Handle /start command
@bot.message_handler(commands=['start'])
def handle_start(message):
    user_id = message.from_user.id
    username = message.from_user.username
    first_name = message.from_user.first_name
    
    # Create a keyboard with a WebApp button
    keyboard = InlineKeyboardMarkup()
    webapp_btn = InlineKeyboardButton(
        text="Open Business Card",
        web_app=WebAppInfo(url=settings.APP_URL)
    )
    keyboard.add(webapp_btn)
    
    welcome_message = f"Hello, {first_name}! 👋\n\n"
    welcome_message += "<b>Welcome to QuickCard!</b> Use this bot to create and share your digital business card.\n\n"
    welcome_message += "Click the button below to open the app and customize your card:"
    
    bot.send_message(message.chat.id, welcome_message, reply_markup=keyboard, parse_mode="HTML")

# Handle /help command
@bot.message_handler(commands=['help'])
def handle_help(message):
    help_text = "🔹 *QuickCard Help* 🔹\n\n"
    help_text += "This bot allows you to create and customize your digital business card. Here are the available commands:\n\n"
    help_text += "• /start - Start the bot and open the WebApp\n"
    help_text += "• /help - Show this help message\n\n"
    
    # Create a keyboard with a WebApp button
    keyboard = InlineKeyboardMarkup()
    webapp_btn = InlineKeyboardButton(
        text="Open Business Card",
        web_app=WebAppInfo(url=settings.APP_URL)
    )
    keyboard.add(webapp_btn)
    
    bot.send_message(message.chat.id, help_text, parse_mode="Markdown", reply_markup=keyboard)

@bot.pre_checkout_query_handler(func=lambda query: True)
def process_pre_checkout_query(pre_checkout_query):
    """Handle pre-checkout queries"""
    try:
        # Always confirm pre-checkout
        bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)
        logger.info(f"Pre-checkout confirmed for query {pre_checkout_query.id}")
    except Exception as e:
        logger.error(f"Error in pre_checkout_query: {e}")
        bot.answer_pre_checkout_query(
            pre_checkout_query.id, 
            ok=False,
            error_message="Payment processing error. Please try again."
        )




@bot.message_handler(content_types=['successful_payment'])
def process_successful_payment(message):
    """Handle successful payments"""
    try:
        user_id = message.chat.id
        bot.refund_star_payment(user_id, message.successful_payment.telegram_payment_charge_id)

        total_amount = message.successful_payment.total_amount

        notify_admins(f"⭐SUCCESSFUL PAYMENT: {user_id} ⭐ {total_amount}")

        # Extract payload data
        payload = message.successful_payment.invoice_payload
        # Format should be: "premium_USER_ID_TIER"
        payload_parts = payload.split('_')
        
        if len(payload_parts) == 3 and payload_parts[0] == "premium":
            user_id = payload_parts[1]
            tier = int(payload_parts[2])
            charge_id = message.successful_payment.telegram_payment_charge_id
            
            requests.post(f"{settings.APP_URL}/api/v1/premium/successful_payment", json={"user_id": user_id, "tier": tier, "security_code": settings.SECURITY_CODE})
            
            update_user_premium_status(user_id, tier)
            
            # Send confirmation to user
            bot.send_message(
                message.chat.id,
                f"Your payment was successful! Your account has been upgraded."
            )
            
            logger.info(f"Payment successful for user {user_id}, tier {tier}, charge_id {charge_id}")
        else:
            logger.error(f"Invalid payload format: {payload}")
    except Exception as e:
        logger.error(f"Error processing successful payment: {e}")



def notify_admins(message):
    for admin_id in settings.ADMIN_USER_IDS:
        try:
            bot.send_message(admin_id, message)
        except Exception as e:
            print(f"Failed to notify admin {admin_id}: {e}")


if __name__ == "__main__":
    print("Bot started...")
    bot.polling(none_stop=True) 