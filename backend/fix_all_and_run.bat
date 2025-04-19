@echo off
echo ====================================================================
echo Fixing the backend to resolve null byte issues and ensure proper API
echo ====================================================================

REM First fix the auth file specifically
echo 1. Fixing auth.py file...
python fix_auth_file.py
if %ERRORLEVEL% NEQ 0 (
    echo Failed to fix auth file!
    pause
    exit /b 1
)

REM Then check for null bytes in all other Python files
echo 2. Fixing any remaining null bytes in Python files...
python fix_null_bytes.py
if %ERRORLEVEL% NEQ 0 (
    echo Failed to fix null bytes!
    pause
    exit /b 1
)

echo 3. All files fixed successfully!
echo.

echo ====================================================================
echo Starting Telegram Business Card backend server...
echo ====================================================================
python start.py

pause 