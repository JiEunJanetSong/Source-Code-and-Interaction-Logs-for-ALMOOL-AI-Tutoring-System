#!/bin/bash
cd "$(dirname "$0")"

# Find Python3 binary
PYTHON=$(command -v python3)
if [ -z "$PYTHON" ]; then
    echo "ERROR: Python3 not found."
    echo "Install it first:"
    echo "  macOS:  brew install python3"
    echo "  Ubuntu: sudo apt install python3 python3-venv"
    exit 1
fi

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Initialize DB if not exists
if [ ! -f "data/almool_chat.db" ]; then
    echo "Initializing database..."
    python3 init_db.py
fi

echo "Starting ALMOOL_Chat Flask server on port 5001..."
echo "Make sure ALMOOL_Study is running on port 8080"
echo ""
python3 run.py
