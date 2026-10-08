

"""
chains.py – Tất cả AI logic dùng LangChain + tự động trace lên LangSmith.

Mỗi hàm ở đây đều được wrap bằng @traceable nên LangSmith sẽ:
  - Hiển thị input / output của từng call
  - Đo latency, token usage, cost
  - Group theo run_name để dễ filter
"""

import json
import os
import base64
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langsmith import traceable

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List

# ── Model ──────────────────────────────────────────────────────────
# Sử dụng gemini-1.5-flash cho tốc độ phản hồi nhanh, mượt hoặc gemini-1.5-pro nếu cần suy luận sâu
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_output_tokens=1000,
)

json_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_output_tokens=800,
)

ocr_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_output_tokens= 2048,
    temperature=0.2,
)

question_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_output_tokens= 4000,
    temperature=0.2,
)

# ── 1. AGENT ANALYZER ─────────────────────────────────────────────
_analyze_prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là AI agent TOEIC. Phân tích dữ liệu học viên và đưa ra nhận xét ngắn gọn bằng tiếng Việt, không dùng bullet, thân thiện."),
    ("human", "Dữ liệu: {summary}\nPhân tích 2-3 câu: điểm mạnh/yếu rõ nhất và gợi ý luyện gì tiếp theo.")
])

_analyze_chain = _analyze_prompt | llm | StrOutputParser()


@traceable(name="agent_analyze", tags=["agent", "analysis"])
async def run_agent_analyze(summary: str) -> str:
    """Agent phân tích điểm yếu tổng thể và gợi ý lộ trình."""
    return await _analyze_chain.ainvoke({"summary": summary})


# ── 2. SESSION RESULT ANALYZER ────────────────────────────────────
_session_prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là AI tutor TOEIC thân thiện. Trả lời tiếng Việt, tối đa 2-3 câu, không markdown."),
    ("human", "Học viên vừa làm {total} câu TOEIC ({mode}), đúng {correct}/{total} ({acc}%). Nhận xét kết quả và gợi ý tiếp theo.")
])

_session_chain = _session_prompt | llm | StrOutputParser()


@traceable(name="session_result_analysis", tags=["agent", "session"])
async def run_session_analysis(mode: str, total: int, correct: int, acc: int) -> str:
    """Phân tích sau mỗi quiz session."""
    return await _session_chain.ainvoke({
        "mode": mode, "total": total, "correct": correct, "acc": acc
    })


# ── 3. TUTOR CHAT ─────────────────────────────────────────────────
_chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là AI tutor TOEIC chuyên nghiệp và thân thiện. Trả lời bằng tiếng Việt, tối đa 150 từ, không dùng markdown."),
    ("human", "{question}")
])

_chat_chain = _chat_prompt | llm | StrOutputParser()


@traceable(name="tutor_chat", tags=["chat"])
async def run_tutor_chat(question: str, history: list[dict]) -> str:
    """Chat tự do với AI tutor, kèm history."""
    # Build messages với history
    messages = [("system", "Bạn là AI tutor TOEIC chuyên nghiệp và thân thiện. Trả lời bằng tiếng Việt, tối đa 150 từ, không markdown.")]
    for m in history[-6:]:  # giữ 6 tin nhắn gần nhất
        role = "human" if m["role"] == "user" else "ai"
        messages.append((role, m["content"]))
    messages.append(("human", question))

    prompt = ChatPromptTemplate.from_messages(messages)
    chain = prompt | llm | StrOutputParser()
    return await chain.ainvoke({})


# ── 4. VOCAB POEM GENERATOR ───────────────────────────────────────
_poem_system = """Bạn là AI tạo thơ học từ vựng TOEIC.
Trả lời CHỈ JSON hợp lệ, không markdown, không preamble.
Format: {{"word":"...","phonetic":"IPA","meaning":"nghĩa tiếng Việt","poem":"4-6 câu thơ có vần điệu","example":"câu TOEIC mẫu – dịch tiếng Việt"}}"""
_poem_prompt = ChatPromptTemplate.from_messages([
    ("system", _poem_system),
    ("human", 'Tạo thơ học từ "{word}"')
])
_poem_chain = _poem_prompt | json_llm | StrOutputParser()


@traceable(name="vocab_poem_generator", tags=["vocab", "poem"])
async def run_poem_generator(word: str) -> dict:
    """Tạo bài thơ để ghi nhớ từ vựng TOEIC."""
    raw = await _poem_chain.ainvoke({"word": word})
    # Clean và parse JSON
    clean = raw.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

# ── 5. OCR FLASHCARD GENERATOR ───────────────────────────────────

_ocr_system = """Bạn là chuyên gia AI trích xuất từ vựng TOEIC từ ảnh. Trả lời CHỈ JSON hợp lệ, không markdown, không preamble.
Format: {{"deck_name": "Từ vựng trích xuất", "cards": [{{"word": "...", "part_of_speech": "...", "ipa": "...", "meaning": "..."}}]}}"""

_ocr_prompt = ChatPromptTemplate.from_messages([
    ("system", _ocr_system),
    ("human", [
        {
            "type": "image_url",
            # Chỉ khai báo 1 biến là image_url ở đây
            "image_url": {"url": "{image_url}"} 
        }
    ])
])

_ocr_chain = _ocr_prompt | ocr_llm | StrOutputParser()


@traceable(name="ocr_generator", tags=["ocr"])
async def run_flashcard_generator(image_bytes: bytes, mime_type: str) -> dict:

    """Nhận dạng chữ từ ảnh và trả về JSON với văn bản đã extract và ngôn ngữ."""
    
    # 2. Tạo chuỗi base64
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    
    # 3. TỰ NỐI CHUỖI Data URI (để nhúng đúng chuẩn mime_type)
    full_image_data_uri = f"data:{mime_type};base64,{image_base64}"
    
    # 4. TRUYỀN ĐÚNG TÊN BIẾN "image_url" VÀO CHUỖI ĐÃ NỐI
    raw = await _ocr_chain.ainvoke({"image_url": full_image_data_uri})
    
    # Làm sạch kết quả JSON
    clean = raw.strip().replace("```json", "").replace("```", "").strip()
    
    return json.loads(clean)

# ── 6. QUESTION GENERATOR ───────────────────────────────────────

class QuestionModel(BaseModel):
    id: str = Field(description="Mã câu hỏi (vd: q1, q2)")
    question: str = Field(description="Nội dung câu hỏi tiếng Anh")
    options: List[str] = Field(description="Mảng 4 đáp án (vd: ['A. text', 'B. text', 'C. text', 'D. text'])")
    answer: str = Field(description="Đáp án đúng (A, B, C, hoặc D)")
    explanation: str = Field(description="Giải thích ngắn gọn tiếng Việt tại sao đúng")

class QuizResponse(BaseModel):
    questions: List[QuestionModel] = Field(description="Danh sách 15 câu hỏi")

_generate_prompt = ChatPromptTemplate.from_messages([
    ("system", "Bạn là chuyên gia ra đề TOEIC. Luôn trả về dữ liệu tuân thủ nghiêm ngặt định dạng JSON được yêu cầu."),
    ("human", """Học viên cần luyện kỹ năng: {mode_label}.
Tỷ lệ làm đúng hiện tại của kỹ năng này là: {acc}%.
Hãy tạo 15 câu hỏi trắc nghiệm với độ khó tương ứng: {difficulty}.""")
])

# Ép LLM luôn trả về JSON khớp với cấu trúc QuizResponse
_generate_chain = _generate_prompt | question_llm.with_structured_output(QuizResponse)

@traceable(name="agent_generate_questions", tags=["agent", "generation"])
async def run_agent_generate(mode_label: str, acc: int, difficulty: str) -> dict:
    """Agent tạo sinh câu hỏi trắc nghiệm dựa vào trình độ."""
    result = await _generate_chain.ainvoke({
        "mode_label": mode_label,
        "acc": acc,
        "difficulty": difficulty
    })
    return result.model_dump()