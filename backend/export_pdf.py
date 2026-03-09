"""
export_pdf.py — generate PDF for a single check
"""
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

# Checklist items (mirrors frontend checklistData.js)
BLOCK1_ITEMS = [
    ("b1_1", "Инструктаж сотрудников ЧОП за 15–20 мин до открытия", 15),
    ("b1_2", "Осмотр уходящего персонала при выходе", 15),
    ("b1_3", "Досмотр мусора с участием ЧОП", 15),
    ("b1_4", "Антикражные рамки исправны, проверяются при открытии", 10),
    ("b1_5", "Эвакуационные выходы ничем не заставлены", 15),
    ("b1_6", "Соблюдены правила снятия магазина с охраны", 10),
    ("b1_7", "Соблюдены правила постановки магазина на охрану", 10),
    ("b1_8", "В серверной отсутствует мусор и посторонние предметы", 10),
]
BLOCK3_ITEMS = [
    ("b3_1", "Сотрудник ЧОП реагирует на сработку антикражных рамок", 30),
    ("b3_2", "Входные группы открыты вовремя", 15),
    ("b3_3", "Входные группы закрыты вовремя", 15),
    ("b3_4", "Входные группы чистые (отсутствует мусор)", 10),
    ("b3_5", "Сотрудник в зоне видимости камер, у антикражных рамок", 30),
]
BLOCK4_ITEMS = [
    ("b4_1", "Деньги отсутствуют вне денежного ящика", "33.3"),
    ("b4_2", "Денежный ящик визуально закрыт", "33.3"),
    ("b4_3", "Алармосъемник закрыт на неработающей кассе", "33.3"),
]
BLOCK5_ITEMS = [
    ("b5_1", "Дверь в помещение инкассы закрыта (СКУД)", "33.3"),
    ("b5_2", "Сейф в инкассе закрыт в отсутствие сотрудников", "33.3"),
    ("b5_3", "Денежный ящик отсутствует на столе кассира", "33.3"),
]
BLOCK7_ITEMS = [
    ("b7_1", "Внешний вид соответствует договору (костюм, обувь, рубашка)", 25),
    ("b7_2", "Одежда аккуратная: подходит по размеру, не мятая", 20),
    ("b7_3", "Отсутствие татуировок и пирсинга на видимых частях тела", 10),
    ("b7_4", "Наличие нагрудного бейджа", 10),
    ("b7_5", "Наличие беспроводной гарнитуры", 10),
    ("b7_6", "Сотрудник не отвлекается на телефон/гаджет на посту", 25),
]
BLOCK8_ITEMS = [
    ("b8_1", "Оператор ВН ЧОП находится на рабочем месте", 25),
    ("b8_2", "Сотрудник реагирует на сработку СРЛ", 15),
    ("b8_3", "В помещении мониторной отсутствуют посторонние лица", 20),
    ("b8_4", "Оператор не отвлекается от выполнения должностных инструкций", 20),
    ("b8_5", "Нет приема пищи в мониторной (допускаются напитки)", 10),
    ("b8_6", "В мониторной порядок, отсутствует еда и товар", 10),
]

BLOCK_DEFS = [
    (1, "Общие критерии безопасности", BLOCK1_ITEMS),
    (3, "КПП (входные группы)", BLOCK3_ITEMS),
    (4, "Кассы", BLOCK4_ITEMS),
    (5, "Инкасса", BLOCK5_ITEMS),
    (7, "ЧОП — Внешний вид", BLOCK7_ITEMS),
    (8, "Мониторка", BLOCK8_ITEMS),
]


def _score_str(details: dict, block_num: int) -> str:
    val = details.get(f"block_{block_num}")
    return f"{val}%" if val is not None else "—"


def _make_table(data, col_widths=None):
    t = Table(data, colWidths=col_widths)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), (0.39, 0.4, 0.96)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return t


def generate_check_pdf(check: dict) -> bytes:
    """Generate PDF bytes for a single check."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    styles = getSampleStyleSheet()
    story = []

    p = check.get("payload") or {}
    d = check.get("details") or {}
    comments = p.get("comments") or {}

    # Header
    story.append(Paragraph(f"Чек-лист: {check.get('store_name', '')}", ParagraphStyle(name="Title", fontName="Helvetica-Bold", fontSize=16)))
    story.append(Spacer(1, 6 * mm))
    meta = f"Дата: {check.get('timestamp', '')}  |  {check.get('total_score', '')}% — {check.get('grade', '')}"
    story.append(Paragraph(meta, styles["Normal"]))
    story.append(Spacer(1, 8 * mm))

    # Block 1
    b1_score = _score_str(d, 1)
    b1_data = [["Статус", "Пункт", "Вес %", "Комментарий"]]
    b1_data.extend([
        [("✅" if p.get(k) else "☐"), label, str(w), (comments.get(k) or "")]
        for k, label, w in BLOCK1_ITEMS
    ])
    story.append(Paragraph(f"Блок 1: Общие критерии безопасности (балл: {b1_score})", ParagraphStyle(name="Block", fontName="Helvetica-Bold", fontSize=9)))
    story.append(_make_table(b1_data, [15 * mm, 100 * mm, 20 * mm, 50 * mm]))
    story.append(Spacer(1, 6 * mm))

    # Block 2 — numeric / multi-checks
    total_staff = p.get("b2_total_staff", "—")
    b2_checks = p.get("b2_checks") or []
    b2_score = _score_str(d, 2)
    if b2_checks:
        b2_data = [["По штату", str(total_staff), ""]]
        b2_data.append(["Дата и время", "Отсутствует постов", "По факту"])
        for c in b2_checks:
            ap = c.get("absent_posts", 0) if isinstance(c, dict) else 0
            fact = (total_staff - ap) if isinstance(total_staff, (int, float)) else "—"
            b2_data.append([c.get("datetime", "—"), str(ap), str(fact)])
    else:
        absent = p.get("b2_absent_posts", "—")
        fact = (total_staff - absent) if isinstance(total_staff, (int, float)) and isinstance(absent, (int, float)) else "—"
        b2_data = [["По штату", str(total_staff), ""], ["Отсутствует постов", str(absent), ""], ["По факту", str(fact), ""]]
    story.append(Paragraph(f"Блок 2: % присутствия сотрудников ЧОП (балл: {b2_score})", ParagraphStyle(name="Block", fontName="Helvetica-Bold", fontSize=9)))
    story.append(_make_table(b2_data, [50 * mm, 30 * mm, 50 * mm]))
    story.append(Spacer(1, 6 * mm))

    # Blocks 3–5
    for block_num, title, items in BLOCK_DEFS[1:4]:
        score = _score_str(d, block_num)
        data = [["Статус", "Пункт", "Вес %", "Комментарий"]]
        data.extend([
            [("✅" if p.get(k) else "☐"), label, str(w), (comments.get(k) or "")]
            for k, label, w in items
        ])
        story.append(Paragraph(f"Блок {block_num}: {title} (балл: {score})", ParagraphStyle(name="Block", fontName="Helvetica-Bold", fontSize=9)))
        story.append(_make_table(data, [15 * mm, 100 * mm, 20 * mm, 50 * mm]))
        story.append(Spacer(1, 6 * mm))

    # Block 6 — doors
    b6_score = _score_str(d, 6)
    closed = p.get("b6_closed_doors", "—")
    total = p.get("b6_total_doors", "—")
    b6_data = [["Закрыто дверей", f"{closed} из {total}", ""]]
    story.append(Paragraph(f"Блок 6: Двери (СКУД) (балл: {b6_score})", ParagraphStyle(name="Block", fontName="Helvetica-Bold", fontSize=9)))
    story.append(_make_table(b6_data, [50 * mm, 30 * mm, 100 * mm]))
    story.append(Spacer(1, 6 * mm))

    # Blocks 7–8
    for block_num, title, items in BLOCK_DEFS[4:]:
        score = _score_str(d, block_num)
        data = [["Статус", "Пункт", "Вес %", "Комментарий"]]
        data.extend([
            [("✅" if p.get(k) else "☐"), label, str(w), (comments.get(k) or "")]
            for k, label, w in items
        ])
        story.append(Paragraph(f"Блок {block_num}: {title} (балл: {score})", ParagraphStyle(name="Block", fontName="Helvetica-Bold", fontSize=9)))
        story.append(_make_table(data, [15 * mm, 100 * mm, 20 * mm, 50 * mm]))
        story.append(Spacer(1, 6 * mm))

    doc.build(story)
    return buffer.getvalue()
