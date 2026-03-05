"""
database.py — SQLite initialization and helpers
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "checks.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the checks table if it doesn't exist."""
    conn = get_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS checks (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT    NOT NULL,
                store_name TEXT   NOT NULL,
                total_score REAL  NOT NULL,
                grade      TEXT   NOT NULL,
                details    TEXT   NOT NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()


def save_check(store_name: str, total_score: float, grade: str, details: dict) -> int:
    """Insert a new check record and return its id."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO checks (timestamp, store_name, total_score, grade, details)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                store_name,
                round(total_score, 2),
                grade,
                json.dumps(details, ensure_ascii=False),
            ),
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_last_checks(n: int = 50) -> list[dict]:
    """Return the last n checks ordered by newest first."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM checks ORDER BY id DESC LIMIT ?", (n,)
        ).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            item["details"] = json.loads(item["details"])
            result.append(item)
        return result
    finally:
        conn.close()
