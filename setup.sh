#!/bin/bash
# ALMOOL Setup Script - Run once after cloning
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== ALMOOL Setup ==="
echo ""

# --- 1. Check PHP ---
PHP=$(command -v php)
if [ -z "$PHP" ]; then
    echo "ERROR: PHP not found."
    echo "  macOS:  brew install php"
    echo "  Ubuntu: sudo apt install php php-sqlite3"
    exit 1
fi
PHP_VERSION=$("$PHP" -v | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
PHP_MAJOR=$(echo "$PHP_VERSION" | cut -d. -f1)
if [ "$PHP_MAJOR" -lt 8 ] 2>/dev/null; then
    echo "ERROR: PHP 8.0+ required (found $PHP_VERSION)"
    exit 1
fi
if ! "$PHP" -m 2>/dev/null | grep -qi sqlite3; then
    echo "ERROR: PHP sqlite3 extension not enabled."
    echo "  Ubuntu: sudo apt install php-sqlite3"
    exit 1
fi
echo "[OK] PHP $PHP_VERSION"

# --- 2. Check Python3 ---
PYTHON=$(command -v python3)
if [ -z "$PYTHON" ]; then
    echo "ERROR: Python3 not found."
    echo "  macOS:  brew install python3"
    echo "  Ubuntu: sudo apt install python3 python3-venv"
    exit 1
fi
PY_VERSION=$("$PYTHON" --version | grep -oE '[0-9]+\.[0-9]+')
echo "[OK] Python $PY_VERSION"

# --- 3. Create venv + install dependencies ---
cd "$ROOT_DIR/ALMOOL_Chat"
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt --quiet
echo "[OK] Python dependencies installed"

# --- 4. .env setup ---
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[OK] Created .env from .env.example"
        echo "     >>> Edit ALMOOL_Chat/.env to add your API keys <<<"
    else
        echo "WARNING: .env.example not found, skipping .env creation"
    fi
else
    echo "[OK] .env already exists"
fi

# --- 5. Initialize databases ---
cd "$ROOT_DIR/ALMOOL_Study"
if [ ! -f "data/almool_study.db" ]; then
    mkdir -p data
    echo "Initializing ALMOOL_Study database..."
    "$PHP" init_db.php
else
    echo "[OK] ALMOOL_Study database exists"
fi

cd "$ROOT_DIR/ALMOOL_Chat"
if [ ! -f "data/almool_chat.db" ]; then
    mkdir -p data
    echo "Initializing ALMOOL_Chat database..."
    python3 init_db.py
else
    echo "[OK] ALMOOL_Chat database exists"
fi

# --- 6. Done ---
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Usage:"
echo "  ./start.sh              # Start both servers"
echo "  ./ALMOOL_Study/start.sh # Start PHP server only  (port 8080)"
echo "  ./ALMOOL_Chat/start.sh  # Start Flask server only (port 5001)"
echo ""
echo "Test user: test / test123"
