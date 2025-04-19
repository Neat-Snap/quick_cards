@echo off
echo Fixing potential null bytes in Python files...
python fix_null_bytes.py

echo.
echo Starting Telegram Business Card backend server...
python start.py 