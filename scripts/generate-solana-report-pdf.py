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
SOURCE = ROOT / "docs" / "reports" / "solana-integration-report-2026-06-28.md"
OUT_DIR = ROOT / "output" / "pdf"
OUTPUT = OUT_DIR / "ZS-Exchange-Solana-Integration-Report-2026-06-28.pdf"


pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


def para_text(text: str) -> str:
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", text)
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = text.replace("**", "")
    return text


class Diagram(Flowable):
    def __init__(self, kind: str, title: str, height: float = 250):
        super().__init__()
        self.kind = kind
        self.title = title
        self.height = height
        self.width = 170 * mm

    def wrap(self, avail_width, avail_height):
        self.width = avail_width
        return avail_width, self.height

    def draw_box(self, x, y, w, h, title, lines, fill=colors.white, stroke=colors.HexColor("#CBD5E1")):
        c = self.canv
        c.setFillColor(fill)
        c.setStrokeColor(stroke)
        c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#111827"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 10, y + h - 18, title)
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 8.5)
        for i, line in enumerate(lines):
            c.drawString(x + 10, y + h - 36 - i * 13, line)

    def arrow(self, x1, y1, x2, y2):
        c = self.canv
        c.setStrokeColor(colors.HexColor("#64748B"))
        c.setLineWidth(1.3)
        c.line(x1, y1, x2, y2)
        if x2 >= x1:
            c.line(x2, y2, x2 - 6, y2 + 3)
            c.line(x2, y2, x2 - 6, y2 - 3)
        else:
            c.line(x2, y2, x2 + 6, y2 + 3)
            c.line(x2, y2, x2 + 6, y2 - 3)

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(0, self.height - 18, self.title)
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.line(0, self.height - 26, self.width, self.height - 26)

        if self.kind == "architecture":
            self.draw_architecture()
        elif self.kind == "api":
            self.draw_api()
        else:
            self.draw_did()
        c.restoreState()

    def draw_architecture(self):
        y = 105
        w = self.width
        self.draw_box(0, y, 110, 82, "Frontend", ["H5 wallet", "Admin views", "DApp / WC"], colors.HexColor("#FFFFFF"))
        self.draw_box(w * 0.25, y, 125, 82, "Next.js API", ["/api/v1/solana/*", "/api/v1/did/solana/*", "auth protected"], colors.HexColor("#F0FDF4"))
        self.draw_box(w * 0.52, y, 145, 82, "SolanaAdapter", ["SOL/SPL balances", "transfer build", "block / tx / epoch"], colors.HexColor("#EFF6FF"))
        self.draw_box(w * 0.82, y, 95, 82, "Solana RPC", ["mainnet", "devnet", "testnet"], colors.HexColor("#F8FAFC"))
        self.arrow(110, y + 41, w * 0.25, y + 41)
        self.arrow(w * 0.25 + 125, y + 41, w * 0.52, y + 41)
        self.arrow(w * 0.52 + 145, y + 41, w * 0.82, y + 41)
        self.draw_box(w * 0.25, 10, 125, 72, "KeyService", ["m/44'/501'", "derive address", "sign entry"], colors.HexColor("#FFF7ED"))
        self.draw_box(w * 0.52, 10, 145, 72, "DID Solana", ["did:sol", "DID document", "Memo anchor"], colors.HexColor("#FFF7ED"))
        self.arrow(w * 0.25 + 125, 46, w * 0.52, 46)

    def draw_api(self):
        left_x, right_x = 0, self.width * 0.52
        self.draw_box(left_x, 35, self.width * 0.45, 150, "/api/v1/solana", [
            "GET /test - public probe",
            "GET /balance - auth",
            "GET /token-balance - auth",
            "POST /transfer - auth",
            "GET /gas-price - auth",
            "GET /block/latest - auth",
            "GET /transaction/[txHash] - auth",
        ], colors.HexColor("#F0FDF4"))
        self.draw_box(right_x, 72, self.width * 0.45, 113, "/api/v1/did/solana", [
            "POST /create - sensitive",
            "GET /resolve - public",
            "POST /anchor - sensitive",
            "simulate or real Memo anchor",
        ], colors.HexColor("#FFF7ED"))
        c = self.canv
        c.setFillColor(colors.HexColor("#334155"))
        c.setFont("Helvetica", 8.5)
        c.drawString(right_x, 42, "Missing planned routes:")
        c.drawString(right_x, 28, "/solana/tokens, /solana/ico/new, /solana/ico/trending")

    def draw_did(self):
        x0, gap, bw, bh, y = 0, 18, 112, 68, 118
        boxes = [
            ("Create", ["Keypair.generate", "did:sol:pubkey"]),
            ("DID Document", ["Ed25519 key", "blockchainAccountId"]),
            ("Resolve", ["parse did:sol", "rebuild document"]),
            ("Anchor", ["Memo instruction", "send transaction"]),
        ]
        for i, (title, lines) in enumerate(boxes):
            x = x0 + i * (bw + gap)
            self.draw_box(x, y, bw, bh, title, lines, colors.HexColor("#EFF6FF") if i == 3 else colors.white)
            if i < len(boxes) - 1:
                self.arrow(x + bw, y + bh / 2, x + bw + gap, y + bh / 2)
        self.draw_box(38, 20, 145, 62, "Simulation", ["simulate=true", "mock txHash / slot"], colors.HexColor("#FFF7ED"))
        self.draw_box(220, 20, 160, 62, "Real on-chain", ["balance >= 0.001 SOL", "Memo stores summary"], colors.HexColor("#EFF6FF"))
        self.draw_box(417, 20, 120, 62, "Explorer", ["address URL", "tx URL"], colors.white)
        self.arrow(183, 51, 220, 51)
        self.arrow(380, 51, 417, 51)


def make_styles():
    styles = getSampleStyleSheet()
    base = ParagraphStyle(
        "BaseCN",
        parent=styles["Normal"],
        fontName="STSong-Light",
        fontSize=9.6,
        leading=14,
        wordWrap="CJK",
        spaceAfter=5,
    )
    return {
        "cover_title": ParagraphStyle("CoverTitle", parent=base, fontName="Helvetica-Bold", fontSize=19, leading=25, alignment=TA_CENTER, spaceAfter=12),
        "cover_body": ParagraphStyle("CoverBody", parent=base, fontName="Helvetica", fontSize=9.8, leading=14, alignment=TA_LEFT, spaceAfter=5),
        "title": ParagraphStyle("TitleCN", parent=base, fontSize=20, leading=28, alignment=TA_CENTER, spaceAfter=12),
        "h1": ParagraphStyle("H1CN", parent=base, fontSize=15, leading=20, textColor=colors.HexColor("#0F172A"), spaceBefore=10, spaceAfter=7),
        "h2": ParagraphStyle("H2CN", parent=base, fontSize=12.5, leading=17, textColor=colors.HexColor("#1E3A8A"), spaceBefore=8, spaceAfter=5),
        "h3": ParagraphStyle("H3CN", parent=base, fontSize=11.2, leading=15, textColor=colors.HexColor("#334155"), spaceBefore=6, spaceAfter=4),
        "body": base,
        "small": ParagraphStyle("SmallCN", parent=base, fontSize=8.4, leading=11, spaceAfter=0),
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
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
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

        if stripped.startswith("!["):
            i += 1
            continue

        if not stripped:
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
            if story:
                story.append(PageBreak())
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
            if not nxt or nxt.startswith(("#", "|", "```", "![", "- ")) or re.match(r"^\d+\.\s+", nxt):
                break
            paragraph.append(nxt)
            i += 1
        story.append(Paragraph(para_text(" ".join(paragraph)), styles["body"]))

    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(doc.leftMargin, 12 * mm, "ZS Exchange Solana Integration Report")
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
        title="ZS Exchange Solana Integration Report",
        author="Codex",
    )
    width = doc.width
    story = [
        Paragraph("ZS Exchange Solana Integration Report", styles["cover_title"]),
        Paragraph("Generated from project source scan and Solana integration report. Date: 2026-06-28.", styles["cover_body"]),
        Spacer(1, 8),
        Diagram("architecture", "Figure 1 - Solana Integration Architecture", 235),
        Spacer(1, 12),
        Diagram("api", "Figure 2 - Solana API Route Coverage", 240),
        Spacer(1, 12),
        Diagram("did", "Figure 3 - Solana DID Anchor Flow", 230),
        PageBreak(),
    ]
    story.extend(parse_markdown(markdown, styles, width))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
