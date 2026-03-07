"""
main.py — FastAPI application
Endpoints:
  POST /api/checks  — submit a security check
  GET  /api/checks  — retrieve last 50 checks
"""
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import math

from auth import get_current_user
from database import init_db, save_check, get_last_checks, get_check_by_id, update_check
from export_pdf import generate_check_pdf
from export_excel import generate_checks_excel

# ---------------------------------------------------------------------------
# App bootstrap
# ---------------------------------------------------------------------------
app = FastAPI(title="Security Check API", version="1.0.0")

ALLOWED_ORIGIN = os.getenv("FRONTEND_URL", "https://check-object-demo.vercel.app")
ALLOWED_ORIGINS = {
    "https://check-object-demo.vercel.app",
    "http://localhost:5173",
    ALLOWED_ORIGIN,
}

class CORSMiddlewareCustom(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")

        # Respond to preflight immediately — no auth needed
        if request.method == "OPTIONS":
            resp = Response(status_code=200)
            resp.headers["Access-Control-Allow-Origin"] = origin if origin in ALLOWED_ORIGINS else ""
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept"
            resp.headers["Access-Control-Max-Age"] = "600"
            return resp

        response = await call_next(request)
        if origin in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

app.add_middleware(CORSMiddlewareCustom)


@app.on_event("startup")
def startup():
    init_db()


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------
class CheckPayload(BaseModel):
    store_name: str = Field(..., min_length=1)

    # Block 1 — General security criteria (8 sub-items)
    b1_1: bool = False  # Инструктаж сотрудников ЧОП (15%)
    b1_2: bool = False  # Осмотр уходящего персонала (15%)
    b1_3: bool = False  # Досмотр мусора (15%)
    b1_4: bool = False  # Антикражные рамки (10%)
    b1_5: bool = False  # Эвакуационные выходы (15%)
    b1_6: bool = False  # Правила снятия с охраны (10%)
    b1_7: bool = False  # Правила постановки на охрану (10%)
    b1_8: bool = False  # Серверная без мусора (10%)

    # Block 2 — Staff attendance
    b2_total_staff: int = Field(1, ge=1)   # Штатная численность ЧОП
    b2_absent_posts: int = Field(0, ge=0)  # Кол-во отсутствующих постов

    # Block 3 — Entry groups / КПП (5 sub-items)
    b3_1: bool = False  # Реагирует на сработку рамок (30%)
    b3_2: bool = False  # Входные группы открыты вовремя (15%)
    b3_3: bool = False  # Входные группы закрыты вовремя (15%)
    b3_4: bool = False  # Чистые входные группы (10%)
    b3_5: bool = False  # Сотрудник в зоне видимости камер (30%)

    # Block 4 — Cash desks (3 sub-items, 33.3% each)
    b4_1: bool = False  # Деньги вне денежного ящика отсутствуют
    b4_2: bool = False  # Денежный ящик закрыт
    b4_3: bool = False  # Алармосъемник закрыт

    # Block 5 — Cash room / Инкасса (3 sub-items, 33.3% each)
    b5_1: bool = False  # Дверь закрыта (СКУД)
    b5_2: bool = False  # Сейф закрыт
    b5_3: bool = False  # Денежный ящик отсутствует на столе

    # Block 6 — SKUD doors (dynamic)
    b6_total_doors: int = Field(1, ge=1)    # Кол-во дверей со СКУД
    b6_closed_doors: int = Field(0, ge=0)  # Кол-во закрытых дверей

    # Block 7 — Appearance (6 sub-items)
    b7_1: bool = False  # Внешний вид соответствует договору (25%)
    b7_2: bool = False  # Аккуратность одежды (20%)
    b7_3: bool = False  # Отсутствие татуировок/пирсинга (10%)
    b7_4: bool = False  # Нагрудный бейдж (10%)
    b7_5: bool = False  # Беспроводная гарнитура (10%)
    b7_6: bool = False  # Не отвлекается на телефон (25%)

    # Block 8 — Monitoring room (6 sub-items)
    b8_1: bool = False  # Оператор на рабочем месте (25%)
    b8_2: bool = False  # Реагирует на СРЛ (15%)
    b8_3: bool = False  # Нет посторонних лиц (20%)
    b8_4: bool = False  # Не отвлекается от ДИ (20%)
    b8_5: bool = False  # Нет приема пищи (10%)
    b8_6: bool = False  # Порядок в мониторной (10%)


# ---------------------------------------------------------------------------
# Scoring logic
# ---------------------------------------------------------------------------
def score_block1(p: CheckPayload) -> float:
    """Block 1 — General criteria. Weights: 15/15/15/10/15/10/10/10"""
    weights = [15, 15, 15, 10, 15, 10, 10, 10]
    values  = [p.b1_1, p.b1_2, p.b1_3, p.b1_4, p.b1_5, p.b1_6, p.b1_7, p.b1_8]
    return sum(w for w, v in zip(weights, values) if v)  # 0-100


def score_block2(p: CheckPayload) -> float:
    """Block 2 — Staff attendance percentage.
    Staff ≤5: 1 absent post = 0%
    Staff ≥6: 1 absent post = 50%, 2+ = 0%
    """
    absent = min(p.b2_absent_posts, p.b2_total_staff)
    if absent == 0:
        return 100.0
    if p.b2_total_staff <= 5:
        return 0.0
    else:
        if absent == 1:
            return 50.0
        return 0.0


def score_block3(p: CheckPayload) -> float:
    """Block 3 — КПП. Weights: 30/15/15/10/30"""
    weights = [30, 15, 15, 10, 30]
    values  = [p.b3_1, p.b3_2, p.b3_3, p.b3_4, p.b3_5]
    return sum(w for w, v in zip(weights, values) if v)


def score_block4(p: CheckPayload) -> float:
    """Block 4 — Cash desks. Each sub-item ≈ 33.3%"""
    count = sum([p.b4_1, p.b4_2, p.b4_3])
    return round(count / 3 * 100, 2)


def score_block5(p: CheckPayload) -> float:
    """Block 5 — Инкасса. Each sub-item ≈ 33.3%"""
    count = sum([p.b5_1, p.b5_2, p.b5_3])
    return round(count / 3 * 100, 2)


def score_block6(p: CheckPayload) -> float:
    """Block 6 — SKUD doors. Score = closed_doors / total_doors * 100"""
    if p.b6_total_doors == 0:
        return 0.0
    closed = min(p.b6_closed_doors, p.b6_total_doors)
    return round(closed / p.b6_total_doors * 100, 2)


def score_block7(p: CheckPayload) -> float:
    """Block 7 — Appearance. Weights: 25/20/10/10/10/25"""
    weights = [25, 20, 10, 10, 10, 25]
    values  = [p.b7_1, p.b7_2, p.b7_3, p.b7_4, p.b7_5, p.b7_6]
    return sum(w for w, v in zip(weights, values) if v)


def score_block8(p: CheckPayload) -> float:
    """Block 8 — Monitoring room. Weights: 25/15/20/20/10/10"""
    weights = [25, 15, 20, 20, 10, 10]
    values  = [p.b8_1, p.b8_2, p.b8_3, p.b8_4, p.b8_5, p.b8_6]
    return sum(w for w, v in zip(weights, values) if v)


# Block weights for overall score (must sum to 100)
BLOCK_WEIGHTS = [0.15, 0.15, 0.15, 0.10, 0.10, 0.05, 0.15, 0.15]


def calculate_total(p: CheckPayload) -> tuple[float, str, dict]:
    block_scores = [
        score_block1(p),
        score_block2(p),
        score_block3(p),
        score_block4(p),
        score_block5(p),
        score_block6(p),
        score_block7(p),
        score_block8(p),
    ]
    total = sum(s * w for s, w in zip(block_scores, BLOCK_WEIGHTS))
    total = round(total, 2)

    if total >= 90:
        grade = "отлично"
    elif total >= 76:
        grade = "хорошо"
    elif total >= 50:
        grade = "удовлетворительно"
    else:
        grade = "неудовлетворительно"

    details = {f"block_{i+1}": round(s, 2) for i, s in enumerate(block_scores)}
    return total, grade, details


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.post("/api/checks")
def submit_check(payload: CheckPayload, _user: str = Depends(get_current_user)):
    total, grade, details = calculate_total(payload)
    payload_dict = payload.model_dump()
    check_id = save_check(payload.store_name, total, grade, details, payload_dict)
    return {
        "id": check_id,
        "store_name": payload.store_name,
        "total_score": total,
        "grade": grade,
        "details": details,
        "payload": payload_dict,
    }


@app.get("/api/checks")
def list_checks(_user: str = Depends(get_current_user)):
    return get_last_checks(50)


@app.get("/api/checks/export/excel")
def export_checks_excel(_user: str = Depends(get_current_user)):
    """Export all checks to Excel file."""
    checks = get_last_checks(50)
    if not checks:
        raise HTTPException(status_code=404, detail="No checks to export")
    data = generate_checks_excel(checks)
    from datetime import date
    filename = f"checks-{date.today().isoformat()}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/checks/{check_id}/pdf")
def export_check_pdf(check_id: int, _user: str = Depends(get_current_user)):
    """Export single check to PDF file."""
    check = get_check_by_id(check_id)
    if check is None:
        raise HTTPException(status_code=404, detail="Check not found")
    data = generate_check_pdf(check)
    import re
    safe_name = re.sub(r"[^\w\s-]", "", check.get("store_name", "check")).strip().replace(" ", "-") or "check"
    safe_date = (check.get("timestamp") or "").replace("/", "-").replace(":", "-")[:16]
    filename = f"check-{safe_name}-{safe_date}.pdf"
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/checks/{check_id}")
def get_check(check_id: int, _user: str = Depends(get_current_user)):
    from fastapi import HTTPException
    item = get_check_by_id(check_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Check not found")
    return item


@app.put("/api/checks/{check_id}")
def edit_check(check_id: int, payload: CheckPayload, _user: str = Depends(get_current_user)):
    from fastapi import HTTPException
    total, grade, details = calculate_total(payload)
    payload_dict = payload.model_dump()
    updated = update_check(check_id, payload.store_name, total, grade, details, payload_dict)
    if not updated:
        raise HTTPException(status_code=404, detail="Check not found")
    return {
        "id": check_id,
        "store_name": payload.store_name,
        "total_score": total,
        "grade": grade,
        "details": details,
        "payload": payload_dict,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/version")
def version():
    """Debug: confirms which build is running on Render"""
    return {"version": "history-edit-v4", "allowed_origins": list(ALLOWED_ORIGINS)}
