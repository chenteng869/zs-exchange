from __future__ import annotations

import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "reports" / "fujian-aged-wine-whitepaper-draft-2026-06-28.md"
OUT_DIR = ROOT / "output" / "pdf"
OUTPUT = OUT_DIR / "Fujian-Aged-Wine-RWA-DID-Whitepaper-2026-06-28.pdf"


FONT_REGULAR = "MicrosoftYaHei"
FONT_BOLD = "MicrosoftYaHei-Bold"

try:
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, r"C:\Windows\Fonts\msyh.ttc"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, r"C:\Windows\Fonts\msyhbd.ttc"))
except Exception:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    FONT_REGULAR = "STSong-Light"
    FONT_BOLD = "STSong-Light"


def para_text(text: str) -> str:
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", text)
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = text.replace("**", "")
    return text


class TokenomicsDiagram(Flowable):
    def __init__(self, height: float = 250):
        super().__init__()
        self.width = 170 * mm
        self.height = height

    def wrap(self, avail_width, avail_height):
        self.width = avail_width
        return avail_width, self.height

    def draw_box(self, x, y, w, h, title, lines, fill):
        c = self.canv
        c.setFillColor(fill)
        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#111827"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 8, y + h - 17, title)
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 8.2)
        for i, line in enumerate(lines):
            c.drawString(x + 8, y + h - 33 - i * 12, line)

    def arrow(self, x1, y1, x2, y2):
        c = self.canv
        c.setStrokeColor(colors.HexColor("#64748B"))
        c.setLineWidth(1.2)
        c.line(x1, y1, x2, y2)
        c.line(x2, y2, x2 - 5, y2 + 3)
        c.line(x2, y2, x2 - 5, y2 - 3)

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(0, self.height - 18, "Asset Anchor and Tokenomics Overview")
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.line(0, self.height - 26, self.width, self.height - 26)

        y = 120
        bw = self.width * 0.23
        gap = self.width * 0.025
        self.draw_box(0, y, bw, 78, "Real Asset", ["100,000,000 bottles", "Fujian aged wine", "Batch DID"], colors.HexColor("#FFF7ED"))
        self.draw_box(bw + gap, y, bw, 78, "Bottle Unit", ["1 bottle", "369 FJW", "Bottle DID"], colors.HexColor("#F0FDF4"))
        self.draw_box((bw + gap) * 2, y, bw, 78, "Total Supply", ["36,900,000,000 FJW", "SPL / ERC mirror", "6 or 9 decimals"], colors.HexColor("#EFF6FF"))
        self.draw_box((bw + gap) * 3, y, bw, 78, "Commerce Loop", ["DID member", "redeem / consume", "AI distribution"], colors.HexColor("#F8FAFC"))
        for i in range(3):
            x = i * (bw + gap) + bw
            self.arrow(x, y + 39, x + gap, y + 39)

        items = [
            ("Reserve", "36%"),
            ("Public", "20%"),
            ("WOPC AI", "12%"),
            ("DID Growth", "7%"),
            ("Liquidity", "6%"),
            ("Treasury", "6%"),
            ("Capital", "5%"),
            ("Team/R&D", "4%"),
            ("Supply", "3%"),
            ("Advisors", "1%"),
        ]
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#111827"))
        c.drawString(0, 88, "Allocation")
        x = 0
        ybar = 55
        scale = self.width / 100
        palette = [
            "#1D4ED8", "#059669", "#F59E0B", "#7C3AED", "#0EA5E9",
            "#64748B", "#DB2777", "#DC2626", "#16A34A", "#A16207",
        ]
        for idx, (_, pct) in enumerate(items):
            value = int(pct.rstrip("%"))
            c.setFillColor(colors.HexColor(palette[idx]))
            c.rect(x, ybar, value * scale, 16, fill=1, stroke=0)
            x += value * scale
        x = 0
        c.setFont("Helvetica", 7.3)
        c.setFillColor(colors.HexColor("#334155"))
        for idx, (name, pct) in enumerate(items):
            c.drawString((idx % 5) * (self.width / 5), 32 - (idx // 5) * 13, f"{name} {pct}")
        c.restoreState()


def make_styles():
    styles = getSampleStyleSheet()
    base = ParagraphStyle(
        "BaseCN",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=9.5,
        leading=14,
        wordWrap="CJK",
        spaceAfter=5,
    )
    return {
        "cover_title": ParagraphStyle("CoverTitle", parent=base, fontName=FONT_BOLD, fontSize=22, leading=30, alignment=TA_CENTER, spaceAfter=12),
        "cover_sub": ParagraphStyle("CoverSub", parent=base, fontName=FONT_REGULAR, fontSize=12, leading=17, alignment=TA_CENTER, textColor=colors.HexColor("#475569"), spaceAfter=8),
        "title": ParagraphStyle("TitleCN", parent=base, fontName=FONT_BOLD, fontSize=20, leading=28, alignment=TA_CENTER, spaceAfter=12),
        "h1": ParagraphStyle("H1CN", parent=base, fontSize=15, leading=20, textColor=colors.HexColor("#0F172A"), spaceBefore=10, spaceAfter=7),
        "h2": ParagraphStyle("H2CN", parent=base, fontSize=12.5, leading=17, textColor=colors.HexColor("#1D4ED8"), spaceBefore=8, spaceAfter=5),
        "h3": ParagraphStyle("H3CN", parent=base, fontSize=11.2, leading=15, textColor=colors.HexColor("#334155"), spaceBefore=6, spaceAfter=4),
        "body": base,
        "small": ParagraphStyle("SmallCN", parent=base, fontSize=8.1, leading=10.6, spaceAfter=0),
        "code": ParagraphStyle("Code", parent=styles["Code"], fontName="Courier", fontSize=8, leading=10, leftIndent=8, rightIndent=8),
        "bullet": ParagraphStyle("BulletCN", parent=base, leftIndent=14, firstLineIndent=-8),
    }


def table_from(lines: list[str], styles, width: float) -> Table:
    rows = []
    for line in lines:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{3,}:?", c or "") for c in cells):
            continue
        rows.append([Paragraph(para_text(c), styles["small"]) for c in cells])
    col_count = max(len(row) for row in rows)
    for row in rows:
        while len(row) < col_count:
            row.append(Paragraph("", styles["small"]))
    table = Table(rows, colWidths=[width / col_count] * col_count, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF2FF")),
        ("FONTNAME", (0, 0), (-1, -1), FONT_REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D7DEE8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return table


def parse_markdown(markdown: str, styles, width: float):
    story = []
    lines = markdown.splitlines()
    i = 0
    in_code = False
    code_lines: list[str] = []
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                story.append(Preformatted("\n".join(code_lines), styles["code"]))
                story.append(Spacer(1, 5))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if not stripped or stripped == "---":
            story.append(Spacer(1, 3))
            i += 1
            continue

        if stripped.startswith("|") and "|" in stripped[1:]:
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            story.append(table_from(table_lines, styles, width))
            story.append(Spacer(1, 7))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(para_text(stripped[2:]), styles["title"]))
            i += 1
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(para_text(stripped[3:]), styles["h1"]))
            i += 1
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(para_text(stripped[4:]), styles["h2"]))
            i += 1
            continue
        if stripped.startswith("#### "):
            story.append(Paragraph(para_text(stripped[5:]), styles["h3"]))
            i += 1
            continue

        if re.match(r"^[-*]\s+", stripped):
            story.append(Paragraph(para_text(re.sub(r"^[-*]\s+", "", stripped)), styles["bullet"], bulletText="-"))
            i += 1
            continue

        numbered = re.match(r"^(\d+)\.\s+(.*)", stripped)
        if numbered:
            story.append(Paragraph(para_text(numbered.group(2)), styles["bullet"], bulletText=numbered.group(1) + "."))
            i += 1
            continue

        paragraph = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if not nxt or nxt == "---" or nxt.startswith(("#", "|", "```", "- ")) or re.match(r"^\d+\.\s+", nxt):
                break
            paragraph.append(nxt)
            i += 1
        story.append(Paragraph(para_text(" ".join(paragraph)), styles["body"]))
    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(doc.leftMargin, 12 * mm, "Fujian Aged Wine RWA-DID Whitepaper")
    canvas.drawRightString(A4[0] - doc.rightMargin, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=18 * mm,
        title="Fujian Aged Wine RWA-DID Whitepaper",
        author="Codex",
    )
    story = [
        Spacer(1, 28),
        Paragraph("福建老酒 RWA-DID 全球生态白皮书", styles["cover_title"]),
        Paragraph("36,900,000,000 FJW · 100,000,000 Bottles · 369 FJW Per Bottle", styles["cover_sub"]),
        Paragraph("DID + Fujian Aged Wine + WOPC AI Commerce + Frontier Research Lab + Capital Market Collaboration", styles["cover_sub"]),
        Spacer(1, 20),
        TokenomicsDiagram(255),
        Spacer(1, 20),
        Paragraph("内部讨论稿：本文件不构成证券发行文件、投资招揽、收益承诺或公开募资承诺。涉及上市公司或资本市场协同的表述，须以正式公告、授权协议及法律意见为准。", styles["body"]),
        PageBreak(),
    ]
    story.extend(parse_markdown(markdown, styles, doc.width))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
