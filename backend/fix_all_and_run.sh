#!/bin/bash

echo "===================================================================="
echo "Fixing the backend to resolve null byte issues and ensure proper API"
echo "===================================================================="

# First fix the auth file specifically
echo "1. Fixing auth.py file..."
python3 fix_auth_file.py
if [ $? -ne 0 ]; then
    echo "Failed to fix auth file!"
    exit 1
fi

# Then check for null bytes in all other Python files
echo "2. Fixing any remaining null bytes in Python files..."
python3 fix_null_bytes.py
if [ $? -ne 0 ]; then
    echo "Failed to fix null bytes!"
    exit 1
fi

echo "3. All files fixed successfully!"
echo ""

echo "===================================================================="
echo "Starting Telegram Business Card backend server..."
echo "===================================================================="
python3 start.py 