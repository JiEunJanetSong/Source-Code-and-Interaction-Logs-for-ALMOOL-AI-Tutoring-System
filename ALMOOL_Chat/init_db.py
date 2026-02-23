#!/usr/bin/env python3
"""Initialize SQLite database for ALMOOL_Chat"""
import sqlite3
import os
from hashlib import sha3_256
from Crypto.Hash import keccak

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'almool_chat.db')

PWPrefix = "@#+-*$ITtujnK#$JbI@#_)#@IIFJ)#KK^(CJEM<W4h983u)"
PWSuffix = ")$JFNELKFM%LK&M#$(F)$JEMMFKGKT]]n3-*vdhe83#!~"


def keccak_256(s):
    """Replicate js-sha3 keccak_256"""
    k = keccak.new(digest_bits=256)
    k.update(s.encode())
    return k.hexdigest()


def encrypt_string(pw):
    """Replicate client-side encryptString (login.js)"""
    min_hash = 'f' * 64
    max_hash = '0' * 64
    for i in range(100000):
        h = keccak_256(f"{pw}-{i}")
        if h < min_hash:
            min_hash = h
        if h > max_hash:
            max_hash = h
    return keccak_256(f"{min_hash}-{pw}-{max_hash}")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    if os.path.exists(DB_PATH):
        print(f"Database already exists at {DB_PATH}")
        print("Delete it first to re-initialize.")
        return

    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    cursor.execute("""CREATE TABLE UserInfo (
        ID TEXT PRIMARY KEY,
        PW TEXT DEFAULT '',
        nowCount INTEGER DEFAULT 0,
        maxCount INTEGER DEFAULT 50,
        email TEXT DEFAULT '',
        joinDate TEXT,
        joinState TEXT DEFAULT 'success',
        userType TEXT DEFAULT 'none'
    )""")

    cursor.execute("""CREATE TABLE QuestionLog (
        ID TEXT,
        bookIndex INTEGER DEFAULT -1,
        problemID TEXT DEFAULT '',
        contents TEXT DEFAULT '',
        role TEXT DEFAULT 'user',
        timestamp TEXT,
        showLogToUser INTEGER DEFAULT 1,
        contentType TEXT DEFAULT 'plain',
        examID TEXT DEFAULT ''
    )""")

    cursor.execute("CREATE INDEX idx_questionlog_id ON QuestionLog(ID)")
    cursor.execute("CREATE INDEX idx_questionlog_timestamp ON QuestionLog(timestamp)")

    # Create test user (password: test123)
    # Replicate client-side keccak_256 encryption, then server-side SHA3_256 wrapping
    encrypted = encrypt_string("test123")
    test_pw = sha3_256((PWPrefix + encrypted + PWSuffix).encode()).hexdigest()
    cursor.execute(
        "INSERT INTO UserInfo (ID, PW, nowCount, maxCount, email, joinDate, joinState, userType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("test", test_pw, 0, 50, "test@test.com", "2024-01-01 00:00:00", "success", "none")
    )

    db.commit()
    db.close()

    print(f"Database initialized at {DB_PATH}")
    print("Test user: test / test123")

if __name__ == "__main__":
    init_db()
