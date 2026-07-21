#!/usr/bin/env python3
"""Verridia baskı derlemelerinden A5 okuma PDF'leri üretir."""

from __future__ import annotations

import argparse
import hashlib
import html
import re
from pathlib import Path

from PIL import Image as PILImage
from PIL import ImageEnhance
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image as RLImage,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = Path(r"C:\Windows\Fonts")
OUTPUT_DIR = ROOT / "output" / "pdf"

BOOKS = {
    "1": {
        "source": ROOT / "roman" / "derleme" / "VERRIDIA_KITAP1_BASKI.md",
        "output": OUTPUT_DIR / "VERRIDIA_KITAP1_KIZIL_HAFTA_A5.pdf",
        "digital_output": OUTPUT_DIR / "VERRIDIA_KITAP1_KIZIL_HAFTA_DIJITAL_EDISYON.pdf",
        "cover": ROOT / "site" / "assets" / "img" / "kartal-yurdu.jpg",
        "accent": "#d4a24e",
        "cover_anchor": 0.30,
        "number": "KİTAP I",
        "subtitle": "Kızıl Hafta",
        "header": "KİTAP I · KIZIL HAFTA",
    },
    "2": {
        "source": ROOT / "roman" / "derleme" / "VERRIDIA_KITAP2_BASKI.md",
        "output": OUTPUT_DIR / "VERRIDIA_KITAP2_DORT_YOL_AYRI_MUHURLER_A5.pdf",
        "digital_output": OUTPUT_DIR / "VERRIDIA_KITAP2_DORT_YOL_AYRI_MUHURLER_DIJITAL_EDISYON.pdf",
        "cover": ROOT / "site" / "assets" / "img" / "eski-kent.jpg",
        "accent": "#7fa5c4",
        "cover_anchor": 0.50,
        "number": "KİTAP II",
        "subtitle": "Dört Yol, Ayrı Mühürler",
        "header": "KİTAP II · DÖRT YOL, AYRI MÜHÜRLER",
    },
    "3": {
        "source": ROOT / "roman" / "derleme" / "VERRIDIA_KITAP3_BASKI.md",
        "output": OUTPUT_DIR / "VERRIDIA_KITAP3_TAM_SECIM_A5.pdf",
        "digital_output": OUTPUT_DIR / "VERRIDIA_KITAP3_TAM_SECIM_DIJITAL_EDISYON.pdf",
        "cover": ROOT / "site" / "assets" / "img" / "yildiz-orsu.jpg",
        "accent": "#b56576",
        "cover_anchor": 0.50,
        "number": "KİTAP III",
        "subtitle": "Tam Seçim",
        "header": "KİTAP III · TAM SEÇİM",
    },
}


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Georgia", str(FONT_DIR / "georgia.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Bold", str(FONT_DIR / "georgiab.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-Italic", str(FONT_DIR / "georgiai.ttf")))
    pdfmetrics.registerFont(TTFont("Georgia-BoldItalic", str(FONT_DIR / "georgiaz.ttf")))
    pdfmetrics.registerFontFamily(
        "Georgia",
        normal="Georgia",
        bold="Georgia-Bold",
        italic="Georgia-Italic",
        boldItalic="Georgia-BoldItalic",
    )


def inline_markup(text: str) -> str:
    value = html.escape(text.strip(), quote=False)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<i>\1</i>", value)
    value = re.sub(r"`([^`]+?)`", r"<i>\1</i>", value)
    return value


def plain_heading(text: str) -> str:
    return re.sub(r"[*_`]", "", text).strip()


def build_styles(digital: bool = False):
    styles = getSampleStyleSheet()
    body_color = colors.HexColor("#33281c") if digital else colors.HexColor("#171717")
    heading_color = colors.HexColor("#33281c") if digital else colors.HexColor("#202020")
    accent_color = colors.HexColor("#8a6d34") if digital else colors.HexColor("#777777")
    part_color = colors.HexColor("#f4ecd9") if digital else colors.HexColor("#1c1c1c")
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=styles["Title"],
            fontName="Georgia-Bold",
            fontSize=29,
            leading=34,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#171717"),
            spaceAfter=12 * mm,
        ),
        "cover_number": ParagraphStyle(
            "CoverNumber",
            fontName="Georgia",
            fontSize=12,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#555555"),
            spaceAfter=4 * mm,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            fontName="Georgia-Italic",
            fontSize=18,
            leading=24,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#242424"),
            spaceAfter=70 * mm,
        ),
        "cover_note": ParagraphStyle(
            "CoverNote",
            fontName="Georgia",
            fontSize=8.2,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#666666"),
        ),
        "toc_title": ParagraphStyle(
            "TocTitle",
            fontName="Georgia-Bold",
            fontSize=20,
            leading=25,
            alignment=TA_CENTER,
            spaceAfter=12 * mm,
        ),
        "part": ParagraphStyle(
            "PartTitle",
            fontName="Georgia-Bold",
            fontSize=21,
            leading=27,
            alignment=TA_CENTER,
            textColor=part_color,
            spaceBefore=45 * mm,
            spaceAfter=7 * mm,
            keepWithNext=True,
        ),
        "part_rule": ParagraphStyle(
            "PartRule",
            fontName="Georgia",
            fontSize=12,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#c9a45c") if digital else colors.HexColor("#777777"),
        ),
        "fasil": ParagraphStyle(
            "FasilTitle",
            fontName="Georgia-Bold",
            fontSize=16.5,
            leading=21,
            alignment=TA_CENTER,
            textColor=heading_color,
            spaceBefore=23 * mm,
            spaceAfter=13 * mm,
            keepWithNext=True,
        ),
        "chapter": ParagraphStyle(
            "ChapterTitle",
            fontName="Georgia-Bold",
            fontSize=12.2,
            leading=16,
            alignment=TA_CENTER,
            textColor=heading_color,
            spaceBefore=7 * mm,
            spaceAfter=2.5 * mm,
            keepWithNext=True,
        ),
        "pov": ParagraphStyle(
            "POV",
            fontName="Georgia-Italic",
            fontSize=8.4,
            leading=11,
            alignment=TA_CENTER,
            textColor=accent_color,
            spaceAfter=5.5 * mm,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body",
            fontName="Georgia",
            fontSize=9.55,
            leading=14.3,
            alignment=TA_JUSTIFY,
            firstLineIndent=5 * mm,
            spaceAfter=0,
            textColor=body_color,
            splitLongWords=False,
            allowWidows=0,
            allowOrphans=0,
        ),
        "body_first": ParagraphStyle(
            "BodyFirst",
            fontName="Georgia",
            fontSize=9.55,
            leading=14.3,
            alignment=TA_JUSTIFY,
            firstLineIndent=0,
            spaceAfter=0,
            textColor=body_color,
            splitLongWords=False,
            allowWidows=0,
            allowOrphans=0,
        ),
        "scene": ParagraphStyle(
            "SceneBreak",
            fontName="Georgia",
            fontSize=10,
            leading=13,
            alignment=TA_CENTER,
            textColor=accent_color,
            spaceBefore=4.5 * mm,
            spaceAfter=4.5 * mm,
        ),
        "quote": ParagraphStyle(
            "Quote",
            fontName="Georgia-Italic",
            fontSize=9.1,
            leading=13.5,
            alignment=TA_LEFT,
            leftIndent=8 * mm,
            rightIndent=8 * mm,
            spaceBefore=3 * mm,
            spaceAfter=3 * mm,
            textColor=colors.HexColor("#6b5426") if digital else colors.HexColor("#444444"),
        ),
        "map_title": ParagraphStyle(
            "MapTitle",
            fontName="Georgia-Bold",
            fontSize=18,
            leading=23,
            alignment=TA_CENTER,
            textColor=heading_color,
            spaceBefore=10 * mm,
            spaceAfter=8 * mm,
        ),
        "map_note": ParagraphStyle(
            "MapNote",
            fontName="Georgia-Italic",
            fontSize=9.4,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#6b5426"),
            leftIndent=9 * mm,
            rightIndent=9 * mm,
            spaceBefore=8 * mm,
        ),
    }


class VerridiaDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, book: dict, **kwargs):
        super().__init__(filename, **kwargs)
        self.book = book

    def afterFlowable(self, flowable):
        level = getattr(flowable, "_toc_level", None)
        if level is None:
            return
        title = getattr(flowable, "_toc_title", "")
        key = getattr(flowable, "_toc_key", None)
        if key is None:
            digest = hashlib.sha1(f"{level}:{title}".encode("utf-8")).hexdigest()[:12]
            key = f"toc-{level}-{digest}"
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(title, key, level=level, closed=(level == 0))
        self.notify("TOCEntry", (level, title, self.page, key))


def draw_page(canvas, doc):
    page = canvas.getPageNumber()
    width, height = A5
    canvas.saveState()
    canvas.setTitle(f"Verridia - {doc.book['number']}: {doc.book['subtitle']}")
    canvas.setAuthor("Verridia")
    if page > 1:
        canvas.setStrokeColor(colors.HexColor("#b8b8b8"))
        canvas.setLineWidth(0.35)
        canvas.line(17 * mm, height - 12.5 * mm, width - 17 * mm, height - 12.5 * mm)
        canvas.setFont("Georgia", 6.8)
        canvas.setFillColor(colors.HexColor("#666666"))
        if page % 2 == 0:
            canvas.drawString(17 * mm, height - 9.2 * mm, "VERRIDIA")
        else:
            canvas.drawRightString(width - 17 * mm, height - 9.2 * mm, doc.book["header"])
        canvas.setFont("Georgia", 7.5)
        if page % 2 == 0:
            canvas.drawString(17 * mm, 10 * mm, str(page))
        else:
            canvas.drawRightString(width - 17 * mm, 10 * mm, str(page))
    canvas.restoreState()


def prepared_cover_image(path: Path, width: float, height: float, anchor: float = 0.5) -> ImageReader:
    """Yatay site gorselini A5 kapaga kirpar ve metin icin sinematik bicimde koyultur."""
    image = PILImage.open(path).convert("RGB")
    target_ratio = width / height
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        crop_width = round(image.height * target_ratio)
        left = round(image.width * anchor - crop_width / 2)
        left = max(0, min(left, image.width - crop_width))
        image = image.crop((left, 0, left + crop_width, image.height))
    else:
        crop_height = round(image.width / target_ratio)
        top = max(0, (image.height - crop_height) // 2)
        image = image.crop((0, top, image.width, top + crop_height))

    image = ImageEnhance.Contrast(image).enhance(1.08)
    image = ImageEnhance.Color(image).enhance(0.82)
    image = ImageEnhance.Brightness(image).enhance(0.48)
    night = PILImage.new("RGB", image.size, (5, 8, 13))
    image = PILImage.blend(image, night, 0.18)
    return ImageReader(image)


def draw_digital_cover(canvas, doc):
    width, height = A5
    canvas.saveState()
    canvas.setTitle(f"Verridia - {doc.book['number']}: {doc.book['subtitle']} - Dijital Edisyon")
    canvas.setAuthor("Verridia")
    canvas.setFillColor(colors.HexColor("#0a0d13"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    image = prepared_cover_image(doc.book["cover"], width, height, anchor=doc.book["cover_anchor"])
    canvas.drawImage(image, 0, 0, width=width, height=height, mask="auto")

    accent = colors.HexColor(doc.book["accent"])
    canvas.setStrokeColor(accent)
    canvas.setLineWidth(0.8)
    canvas.rect(8 * mm, 8 * mm, width - 16 * mm, height - 16 * mm, stroke=1, fill=0)
    canvas.setLineWidth(0.25)
    canvas.rect(10 * mm, 10 * mm, width - 20 * mm, height - 20 * mm, stroke=1, fill=0)

    canvas.setFillColor(colors.HexColor("#e8c987"))
    canvas.setFont("Georgia", 7.2)
    canvas.drawCentredString(width / 2, height - 22 * mm, "KENDİ KENDİNE KİLİTLENMİŞ BİR DÜNYA")
    canvas.setFont("Georgia-Bold", 28)
    canvas.drawCentredString(width / 2, height - 54 * mm, "VERRIDIA")
    canvas.setStrokeColor(accent)
    canvas.setLineWidth(0.55)
    canvas.line(36 * mm, height - 62 * mm, width - 36 * mm, height - 62 * mm)

    canvas.setFillColor(colors.HexColor("#d8d2c4"))
    canvas.setFont("Georgia", 10.5)
    canvas.drawCentredString(width / 2, 62 * mm, doc.book["number"])
    canvas.setFillColor(colors.HexColor("#f4ecd9"))
    canvas.setFont("Georgia-Italic", 18)
    canvas.drawCentredString(width / 2, 49 * mm, doc.book["subtitle"])
    canvas.setFillColor(accent)
    canvas.setFont("Georgia", 7.2)
    canvas.drawCentredString(width / 2, 20 * mm, "DİJİTAL EDİSYON · 2026")
    canvas.restoreState()


def draw_digital_content(canvas, doc):
    page = canvas.getPageNumber()
    width, height = A5
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#ede4d0"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#b99a5d"))
    canvas.setLineWidth(0.35)
    canvas.line(17 * mm, height - 12.5 * mm, width - 17 * mm, height - 12.5 * mm)
    canvas.setFont("Georgia", 6.8)
    canvas.setFillColor(colors.HexColor("#6b5426"))
    if page % 2 == 0:
        canvas.drawString(17 * mm, height - 9.2 * mm, "VERRIDIA")
    else:
        canvas.drawRightString(width - 17 * mm, height - 9.2 * mm, doc.book["header"])
    canvas.setFillColor(colors.HexColor(doc.book["accent"]))
    canvas.setFont("Georgia-Bold", 7.5)
    if page % 2 == 0:
        canvas.drawString(17 * mm, 10 * mm, str(page))
    else:
        canvas.drawRightString(width - 17 * mm, 10 * mm, str(page))
    canvas.restoreState()


def draw_digital_part(canvas, doc):
    width, height = A5
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0d1017"))
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#c9a45c"))
    canvas.setLineWidth(0.55)
    canvas.rect(10 * mm, 10 * mm, width - 20 * mm, height - 20 * mm, stroke=1, fill=0)
    canvas.setFillColor(colors.HexColor(doc.book["accent"]))
    canvas.setFont("Georgia-Bold", 7.5)
    page = canvas.getPageNumber()
    if page % 2 == 0:
        canvas.drawString(14 * mm, 8 * mm, str(page))
    else:
        canvas.drawRightString(width - 14 * mm, 8 * mm, str(page))
    canvas.restoreState()


def make_toc(styles, digital: bool = False) -> TableOfContents:
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            "TOCPart",
            fontName="Georgia-Bold",
            fontSize=9.3,
            leading=13,
            leftIndent=0,
            firstLineIndent=0,
            spaceBefore=5,
            textColor=colors.HexColor("#33281c") if digital else colors.HexColor("#222222"),
        ),
        ParagraphStyle(
            "TOCFasil",
            fontName="Georgia",
            fontSize=8.5,
            leading=11.5,
            leftIndent=7 * mm,
            firstLineIndent=0,
            textColor=colors.HexColor("#6b5426") if digital else colors.HexColor("#444444"),
        ),
    ]
    return toc


def tagged_paragraph(text: str, style, level: int, title: str) -> Paragraph:
    paragraph = Paragraph(inline_markup(text), style)
    paragraph._toc_level = level
    paragraph._toc_title = plain_heading(title)
    digest = hashlib.sha1(f"{level}:{paragraph._toc_title}".encode("utf-8")).hexdigest()[:12]
    paragraph._toc_key = f"toc-{level}-{digest}"
    return paragraph


def parse_source(source: Path, styles, digital: bool = False) -> list:
    lines = source.read_text(encoding="utf-8").splitlines()
    story = []
    first_body = True
    seen_part = False
    seen_fasil = False

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        if line.startswith(">") and "otomatik üretilmiştir" in line:
            continue
        if line.startswith("# VERRIDIA"):
            continue
        if re.match(r"^# \d+\. Kısım", line):
            if digital:
                story.append(NextPageTemplate("part"))
                story.append(PageBreak())
            elif seen_part:
                story.append(PageBreak())
            seen_part = True
            seen_fasil = False
            title = line[2:].strip()
            story.append(tagged_paragraph(title, styles["part"], 0, title))
            story.append(Paragraph("* * *", styles["part_rule"]))
            first_body = True
            continue
        if line.startswith("## Fasıl "):
            if seen_fasil or seen_part:
                story.append(PageBreak())
            seen_fasil = True
            title = line[3:].strip()
            story.append(tagged_paragraph(title, styles["fasil"], 1, title))
            first_body = True
            continue
        if line.startswith("### Bölüm "):
            title = line[4:].strip()
            story.append(Paragraph(inline_markup(title), styles["chapter"]))
            first_body = True
            continue
        if re.match(r"^\*\([^)]+\)\*$", line):
            story.append(Paragraph(inline_markup(line), styles["pov"]))
            first_body = True
            continue
        if line in {"---", "✦", "* * *"}:
            story.append(Paragraph("* * *", styles["scene"]))
            first_body = True
            continue
        if line.startswith(">"):
            story.append(Paragraph(inline_markup(line.lstrip("> ")), styles["quote"]))
            first_body = True
            continue
        style = styles["body_first"] if first_body else styles["body"]
        story.append(Paragraph(inline_markup(line), style))
        first_body = False
    return story


def build_book(book: dict, edition: str = "print") -> dict:
    register_fonts()
    digital = edition == "digital"
    styles = build_styles(digital=digital)
    output_path = book["digital_output"] if digital else book["output"]
    output_path.parent.mkdir(parents=True, exist_ok=True)

    width, height = A5
    doc = VerridiaDocTemplate(
        str(output_path),
        book=book,
        pagesize=A5,
        leftMargin=17 * mm,
        rightMargin=17 * mm,
        topMargin=17 * mm,
        bottomMargin=17 * mm,
        title=f"Verridia - {book['number']}: {book['subtitle']}{' - Dijital Edisyon' if digital else ''}",
        author="Verridia",
        subject="Türkçe ana metin - Dijital edisyon" if digital else "Türkçe ana metin - A5 okuma baskısı",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        width - doc.leftMargin - doc.rightMargin,
        height - doc.topMargin - doc.bottomMargin,
        id="main",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    if digital:
        doc.addPageTemplates(
            [
                PageTemplate(id="cover", frames=[frame], onPage=draw_digital_cover, autoNextPageTemplate="content"),
                PageTemplate(id="content", frames=[frame], onPage=draw_digital_content),
                PageTemplate(id="part", frames=[frame], onPage=draw_digital_part, autoNextPageTemplate="content"),
            ]
        )
        map_image = RLImage(str(ROOT / "site" / "assets" / "img" / "ana-harita.jpg"), width=114 * mm, height=76 * mm)
        map_image.hAlign = "CENTER"
        story = [
            PageBreak(),
            Paragraph("İçindekiler", styles["toc_title"]),
            make_toc(styles, digital=True),
            PageBreak(),
            Paragraph("Verridia", styles["map_title"]),
            map_image,
            Paragraph("Dört yol, tek gökyüzü. Kuzeyi ışıkla mühürlü bir dünya ve yaklaşan döngünün gölgesi.", styles["map_note"]),
        ]
    else:
        doc.addPageTemplates([PageTemplate(id="content", frames=[frame], onPage=draw_page)])
        story = [
            Spacer(1, 34 * mm),
            Paragraph("VERRIDIA", styles["cover_title"]),
            Paragraph(book["number"], styles["cover_number"]),
            Paragraph(inline_markup(book["subtitle"]), styles["cover_subtitle"]),
            Paragraph("Türkçe ana metin · A5 okuma baskısı · 2026", styles["cover_note"]),
            PageBreak(),
            Paragraph("İçindekiler", styles["toc_title"]),
            make_toc(styles),
            PageBreak(),
        ]
    story.extend(parse_source(book["source"], styles, digital=digital))
    doc.multiBuild(story)

    reader = PdfReader(str(output_path))
    first = reader.pages[0].extract_text() or ""
    last = reader.pages[-1].extract_text() or ""
    return {
        "file": str(output_path),
        "pages": len(reader.pages),
        "page_mm": [round(float(reader.pages[0].mediabox.width) * 25.4 / 72, 1), round(float(reader.pages[0].mediabox.height) * 25.4 / 72, 1)],
        "first_ok": "VERRIDIA" in first,
        "last_chars": len(last.strip()),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", choices=["1", "2", "3", "all"], default="all")
    parser.add_argument("--edition", choices=["print", "digital"], default="print")
    args = parser.parse_args()
    keys = BOOKS.keys() if args.book == "all" else [args.book]
    for key in keys:
        result = build_book(dict(BOOKS[key]), edition=args.edition)
        print(
            f"PDF_OK: {result['file']} | {result['pages']} sayfa | "
            f"{result['page_mm'][0]}x{result['page_mm'][1]} mm | "
            f"kapak={result['first_ok']} | son_sayfa_karakter={result['last_chars']}"
        )


if __name__ == "__main__":
    main()
