#!/bin/bash
cd "$(dirname "$0")"

# Find PHP binary
PHP=$(command -v php)
if [ -z "$PHP" ]; then
    echo "ERROR: PHP not found."
    echo "Install it first:"
    echo "  macOS:  brew install php"
    echo "  Ubuntu: sudo apt install php php-sqlite3"
    exit 1
fi

# Check PHP version >= 8.0
PHP_VERSION=$("$PHP" -v | head -1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
PHP_MAJOR=$(echo "$PHP_VERSION" | cut -d. -f1)
if [ "$PHP_MAJOR" -lt 8 ] 2>/dev/null; then
    echo "ERROR: PHP 8.0+ required (found $PHP_VERSION)"
    exit 1
fi

# Check SQLite3 extension
if ! "$PHP" -m 2>/dev/null | grep -qi sqlite3; then
    echo "ERROR: PHP sqlite3 extension not enabled."
    echo "  Ubuntu: sudo apt install php-sqlite3"
    exit 1
fi

# Initialize DB if not exists
if [ ! -f "data/almool_study.db" ]; then
    echo "Initializing database..."
    "$PHP" init_db.php
fi

echo "Starting ALMOOL_Study PHP server on port 8080..."
echo "PHP: $PHP (v$PHP_VERSION)"
echo "Access at http://localhost:8080/"
"$PHP" -S localhost:8080 router.php
