"""
main.py – FastAPI + MongoDB Atlas + LangChain + LangSmith
Thay thế toàn bộ Supabase bằng MongoDB Motor (async).
"""

import os, uuid
from datetime import datetime, timezone
from typing import Dict, Optional, List


from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

load_dotenv()

# ── LangSmith tracing ─────────────────────────────────────────────
os.environ.setdefault("LANGCHAIN_TRACING_V2", os.getenv("LANGCHAIN_TRACING_V2", "true"))
os.environ.setdefault("LANGCHAIN_PROJECT",    os.getenv("LANGCHAIN_PROJECT", "toeic-ai-agent"))
os.environ.setdefault("LANGCHAIN_API_KEY",    os.getenv("LANGCHAIN_API_KEY", ""))

from database import create_indexes, users_col, stats_col, sessions_col, vocab_col, flashcards_col
from auth import hash_password, verify_password, create_token, get_current_user, require_user
from chains import run_agent_analyze, run_session_analysis, run_tutor_chat, run_poem_generator, run_flashcard_generator, run_agent_generate

app = FastAPI(title="TOEIC AI Agent", version="3.0-mongo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await create_indexes()


# ── Schemas ───────────────────────────────────────────────────────
class RegisterReq(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=50, description="Mật khẩu từ 6-50 ký tự")
    full_name: Optional[str] = ""

class LoginReq(BaseModel):
    email: EmailStr
    password: str

# class ChatMessage(BaseModel):
#     role: str
#     content: str

class ChatReq(BaseModel):
    question: str
    history: list[dict] = []
    # history: List[ChatMessage] = []

class AnalyzeReq(BaseModel):
    stats: dict

class SessionReq(BaseModel):
    mode: str
    total: int
    correct: int

class PoemReq(BaseModel):
    word: str

class StatsReq(BaseModel):
    mode: str
    done: int
    correct: int

class FlashCard(BaseModel):
    word: str
    part_of_speech: Optional[str] = ""
    ipa: Optional[str] = ""
    meaning: Optional[str] = ""

class FlashcardDeck(BaseModel):
    cards: List[FlashCard]
    deck_name: str

# ── Health ────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    # Ping MongoDB để kiểm tra kết nối
    from database import get_client
    try:
        await get_client().admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    return {
        "status": "ok",
        "database": "mongodb_atlas",
        "db_status": db_status,
        "langsmith_project": os.getenv("LANGCHAIN_PROJECT"),
        "langsmith_tracing": os.getenv("LANGCHAIN_TRACING_V2"),
    }


# ══ AUTH ══════════════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register(req: RegisterReq):
    if await users_col().find_one({"email": req.email}):
        raise HTTPException(400, "Email đã được sử dụng")

    uid = str(uuid.uuid4())
    await users_col().insert_one({
        "_id":        uid,
        "email":      req.email,
        "password":   hash_password(req.password),
        "full_name":  req.full_name or "",
        "xp":         0,
        "streak":     0,
        "created_at": datetime.now(timezone.utc),
    })
    return {
        "access_token": create_token(uid),
        "token_type": "bearer",
        "user_id": uid,
        "email": req.email,
        "full_name": req.full_name or "",
    }


@app.post("/api/auth/login")
async def login(req: LoginReq):
    user = await users_col().find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Email hoặc mật khẩu không đúng")

    return {
        "access_token": create_token(user["_id"]),
        "token_type": "bearer",
        "user_id": user["_id"],
        "email": user["email"],
        "full_name": user.get("full_name", ""),
    }


@app.get("/api/me")
async def get_me(user=Depends(require_user)):
    uid = user["_id"]
    stats_docs = await stats_col().find({"user_id": uid}).to_list(None)
    stats = {d["mode"]: {"done": d["done"], "correct": d["correct"]} for d in stats_docs}
    for m in ["reading", "grammar", "vocab", "listening"]:
        stats.setdefault(m, {"done": 0, "correct": 0})
    return {
        "profile": {
            "id":        uid,
            "email":     user["email"],
            "full_name": user.get("full_name", ""),
            "xp":        user.get("xp", 0),
            "streak":    user.get("streak", 0),
        },
        "stats": stats,
    }


# ══ STATS ════════════════════════════════════════════════════════

@app.post("/api/stats/upsert")
async def upsert_stats(req: StatsReq, user=Depends(require_user)):
    uid = user["_id"]
    existing = await stats_col().find_one({"user_id": uid, "mode": req.mode})
    if existing:
        await stats_col().update_one(
            {"user_id": uid, "mode": req.mode},
            {"$inc": {"done": req.done, "correct": req.correct},
             "$set": {"updated_at": datetime.now(timezone.utc)}}
        )
    else:
        await stats_col().insert_one({
            "user_id":    uid,
            "mode":       req.mode,
            "done":       req.done,
            "correct":    req.correct,
            "updated_at": datetime.now(timezone.utc),
        })
    # Cộng XP
    xp_gain = req.correct * 20 + (req.done - req.correct) * 5
    await users_col().update_one({"_id": uid}, {"$inc": {"xp": xp_gain}})
    return {"ok": True}


# ══ AGENT ════════════════════════════════════════════════════════

# @app.post("/api/agent/analyze")
# async def agent_analyze(req: AnalyzeReq, user=Depends(get_current_user)):
#     """Agent phân tích điểm yếu → LangSmith: agent_analyze"""
#     stats = req.stats
#     labels = {"reading":"Reading","grammar":"Grammar","vocab":"Vocabulary","listening":"Listening"}
#     with_data = [m for m in stats if stats[m].get("done", 0) > 0]

#     if not with_data:
#         return {"message": "Hãy làm bài để Agent theo dõi điểm yếu và đề xuất lộ trình!", "weakest": None}

#     summary = ", ".join(
#         f"{labels[m]}: {round(stats[m]['correct']/stats[m]['done']*100)}% ({stats[m]['done']} câu)"
#         for m in with_data
#     )
#     weakest = min(with_data, key=lambda m: stats[m]["correct"] / stats[m]["done"])

#     try:
#         message = await run_agent_analyze(summary)
#     except Exception:
#         acc = round(stats[weakest]["correct"] / stats[weakest]["done"] * 100)
#         message = f"Bạn đang yếu nhất ở {labels[weakest]} ({acc}%). Hãy luyện thêm!"

#     return {"message": message, "weakest": weakest}

class AnalyzeReq(BaseModel):
    stats: dict

@app.post("/api/agent/analyze")
async def agent_analyze_endpoint(req: AnalyzeReq):
    """API: Gọi khi load HomeTab để lấy lời khuyên"""
    stats = req.stats
    labels = {"reading":"Reading", "grammar":"Grammar", "vocab":"Vocabulary", "listening":"Listening"}
    with_data = [m for m in stats if stats[m].get("done", 0) > 0]

    if not with_data:
        return {"message": "Hãy làm bài test ban đầu để Agent theo dõi và đề xuất lộ trình!", "weakest": None}

    summary = ", ".join(
        f"{labels.get(m, m)}: {round(stats[m]['correct']/stats[m]['done']*100)}% ({stats[m]['done']} câu)"
        for m in with_data
    )
    weakest = min(with_data, key=lambda m: stats[m]["correct"] / stats[m]["done"])

    try:
        message = await run_agent_analyze(summary)
    except Exception as e:
        print(f"Lỗi AI Analyze: {e}")
        acc = round(stats[weakest]["correct"] / stats[weakest]["done"] * 100)
        message = f"Bạn đang yếu nhất ở {labels.get(weakest, weakest)} ({acc}%). Hãy tập trung luyện thêm phần này nhé!"

    return {"message": message, "weakest": weakest}


class GenerateReq(BaseModel):
    stats: dict
    mode: str 

@app.post("/api/agent/generate")
async def agent_generate_endpoint(req: GenerateReq):
    """API: Gọi khi bấm 'Luyện tập cùng AI' để lấy 15 câu hỏi"""
    stats = req.stats
    mode = req.mode
    labels = {"reading":"Reading", "grammar":"Grammar", "vocab":"Vocabulary", "listening":"Listening"}
    mode_label = labels.get(mode, mode)
    
    # Tính toán trình độ
    mode_stats = stats.get(mode, {"correct": 0, "done": 0})
    acc = round((mode_stats["correct"] / mode_stats["done"]) * 100) if mode_stats["done"] > 0 else 0

    # Phân loại độ khó Prompt
    if acc < 40:
        difficulty = "Beginner (A1-A2) - Từ vựng/ngữ pháp cơ bản, câu ngắn, dễ hiểu."
    elif acc < 75:
        difficulty = "Intermediate (B1-B2) - Câu hỏi có bẫy nhẹ, từ vựng thông dụng trong công việc."
    else:
        difficulty = "Advanced (C1-C2) - Ngữ pháp phức tạp, từ vựng học thuật cao, bẫy tinh vi."

    try:
        # Chạy Agent Generate
        generated_data = await run_agent_generate(mode_label, acc, difficulty)
        return {"questions": generated_data["questions"]}
    except Exception as e:
        print(f"Lỗi AI Generate: {e}")
        raise HTTPException(status_code=500, detail="AI đang bận, không thể soạn câu hỏi. Thử lại sau nhé!")

@app.post("/api/agent/session-result")
async def session_result(req: SessionReq, user=Depends(get_current_user)):
    """Phân tích + lưu session → MongoDB + LangSmith: session_result_analysis"""
    acc = round(req.correct / req.total * 100) if req.total > 0 else 0
    est = 300 + round(acc * 5.95)
    labels = {"reading":"Reading","grammar":"Grammar","vocab":"Vocabulary","listening":"Listening"}

    try:
        message = await run_session_analysis(
            mode=labels.get(req.mode, req.mode),
            total=req.total, correct=req.correct, acc=acc,
        )
    except Exception:
        message = f"Bạn đạt {acc}% – {'Tốt lắm!' if acc >= 70 else 'Cố gắng luyện thêm!'}"

    if user:
        await sessions_col().insert_one({
            "user_id":    user["_id"],
            "mode":       req.mode,
            "total":      req.total,
            "correct":    req.correct,
            "accuracy":   acc,
            "est_score":  est,
            "agent_msg":  message,
            "created_at": datetime.now(timezone.utc),
        })

    return {"message": message, "accuracy": acc, "estimated_score": est}


# ══ CHAT ════════════════════════════════════════════════════════

@app.post("/api/chat")
async def chat(req: ChatReq, user=Depends(get_current_user)):
    """Chat AI tutor → LangSmith: tutor_chat"""
    try:
        reply = await run_tutor_chat(req.question, req.history)
    except Exception as e:
        raise HTTPException(500, str(e))
    return {"text": reply}



# ══ VOCAB ════════════════════════════════════════════════════════

@app.post("/api/vocab/poem")
async def generate_poem(req: PoemReq, user=Depends(get_current_user)):
    """Tạo thơ + lưu MongoDB → LangSmith: vocab_poem_generator"""
    try:
        data = await run_poem_generator(req.word)
    except Exception as e:
        raise HTTPException(500, f"Lỗi tạo thơ: {e}")

    if user:
        await vocab_col().insert_one({
            "user_id":    user["_id"],
            "word":       req.word,
            "meaning":    data.get("meaning"),
            "poem":       data.get("poem"),
            "example":    data.get("example"),
            "created_at": datetime.now(timezone.utc),
        })
    return data


@app.get("/api/vocab/history")
async def vocab_history(user=Depends(require_user)):
    docs = await vocab_col().find(
        {"user_id": user["_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(None)
    for d in docs:
        if "created_at" in d:
            d["created_at"] = d["created_at"].isoformat()
    return {"history": docs}


@app.get("/api/sessions")
async def get_sessions(user=Depends(require_user)):
    docs = await sessions_col().find(
        {"user_id": user["_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(None)
    for d in docs:
        if "created_at" in d:
            d["created_at"] = d["created_at"].isoformat()
    return {"sessions": docs}

@app.post("/api/flashcards/generate-from-image")
async def generate_flashcards_from_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        image_bytes = await file.read()
        mime = file.content_type or "image/jpeg"
        flashcards = await run_flashcard_generator(image_bytes, mime)
    except Exception as e:
        raise HTTPException(500, f"Lỗi tạo flashcard: {e}")
    finally:
        try:
            await file.close()
        except Exception:
            pass
    return {"flashcards": flashcards}


@app.post("/api/flashcards/save")
async def save_flashcard(flashcard: FlashcardDeck, user=Depends(get_current_user)):
    try:
        if user is not None:
            await flashcards_col().insert_one({
                "user_id":    user["_id"],
                "cards": [card.model_dump() for card in flashcard.cards],
                "deck_name": flashcard.deck_name,
                # "word":       flashcard.word,
                # "part_of_speech": flashcard.part_of_speech,
                # "ipa":        flashcard.ipa,
                # "meaning":    flashcard.meaning,
                "created_at": datetime.now(timezone.utc),
            })
        else:
            await flashcards_col().insert_one({
                "cards": [card.model_dump() for card in flashcard.cards],
                "deck_name": flashcard.deck_name,
                })
    except Exception as e:
        raise HTTPException(500, f"Lỗi lưu flashcard: {e}")
    return {"message": "Flashcard đã được lưu thành công."}


@app.get("/api/flashcards") 
async def get_my_flashcards(current_user_id: str):
    try:
        # In ra để xem frontend truyền lên id gì và collection có dữ liệu không
        print("🔍 Đang tìm flashcard với current_user_id:", current_user_id)
        
        # Test thử lấy tất cả không điều kiện xem có ra 4 bộ không
        all_docs = await flashcards_col().find().to_list(length=100)
        print("📊 Tổng số bản ghi thực tế trong collection flashcards:", len(all_docs))
        if len(all_docs) > 0:
            print("💡 Tên trường chứa ID trong DB là:", list(all_docs[0].keys()))
        cursor = flashcards_col().find({"user_id": current_user_id}).sort("created_at", -1)
        
        saved_decks = []
        # SỬA Ở ĐÂY: Thêm chữ 'async' vào trước vòng lặp for
        async for deck in cursor: 
            deck["_id"] = str(deck["_id"])
            
            if "cards" in deck:
                for card in deck["cards"]:
                    if "_id" in card:
                        card["_id"] = str(card["_id"])
            
            saved_decks.append(deck)
            
        return {"success": True, "data": saved_decks}
        
    except Exception as e:
        print("Lỗi khi lấy dữ liệu:", e)
        return {"success": False, "message": "Không thể tải kho Flashcard"}
