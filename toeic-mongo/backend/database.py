"""
database.py – Kết nối MongoDB Atlas và định nghĩa collections.

Collections (tương đương Supabase tables):
  users          → tài khoản, XP, streak
  user_stats     → độ chính xác theo từng phần TOEIC
  quiz_sessions  → lịch sử làm bài
  vocab_history  → từ vựng đã học qua thơ
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING

_client: AsyncIOMotorClient = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            os.getenv("MONGODB_URL"),
            # Atlas yêu cầu TLS – motor tự bật khi dùng mongodb+srv://
            serverSelectionTimeoutMS=5000,
        )
    return _client


def get_db():
    return get_client()[os.getenv("MONGODB_DB", "toeic_agent")]


# ── Shorthand helpers ─────────────────────────────────────────────
def users_col():    return get_db()["users"]
def stats_col():    return get_db()["user_stats"]
def sessions_col(): return get_db()["quiz_sessions"]
def vocab_col():    return get_db()["vocab_history"]
def flashcards_col(): return get_db()["flashcards"]


# ── Tạo indexes khi app khởi động ────────────────────────────────
async def create_indexes():
    """
    Chạy 1 lần lúc startup.
    Atlas cũng có thể tạo indexes qua UI, nhưng để ở đây cho tiện.
    """
    # users: email phải unique
    await users_col().create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
    ])

    # user_stats: mỗi user chỉ có 1 doc mỗi mode
    await stats_col().create_indexes([
        IndexModel([("user_id", ASCENDING), ("mode", ASCENDING)], unique=True),
    ])

    # quiz_sessions: query nhanh theo user, sort theo thời gian
    await sessions_col().create_indexes([
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
    ])

    # vocab_history: query theo user
    await vocab_col().create_indexes([
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
    ])

    # flashcards: query theo user, sort theo thời gian
    await flashcards_col().create_indexes([
        IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)]),
    ])

    print("✅ MongoDB indexes ready")
