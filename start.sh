#!/bin/bash
# Start both ALMOOL servers
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Starting ALMOOL Servers ==="
echo ""

# Start PHP server in background
cd "$ROOT_DIR/ALMOOL_Study"
PHP=$(command -v php)
if [ -z "$PHP" ]; then
    echo "ERROR: PHP not found. Run ./setup.sh first."
    exit 1
fi

if [ ! -f "data/almool_study.db" ]; then
    "$PHP" init_db.php
fi

echo "Starting ALMOOL_Study on http://localhost:8080 ..."
"$PHP" -S localhost:8080 router.php &
PHP_PID=$!

# Clean up PHP server on exit
trap "kill $PHP_PID 2>/dev/null; echo ''; echo 'Servers stopped.'" EXIT

# Start Flask server in foreground
cd "$ROOT_DIR/ALMOOL_Chat"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

if [ ! -f "data/almool_chat.db" ]; then
    python3 init_db.py
fi

echo "Starting ALMOOL_Chat on http://localhost:5001 ..."
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""
python3 run.py
