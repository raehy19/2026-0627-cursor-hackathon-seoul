#!/usr/bin/env python3
"""Generate favicon, app icons, and OG image from public/logo.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "public" / "logo.png"
APP = ROOT / "src" / "app"
PUBLIC = ROOT / "public"
BG = (11, 11, 18)


def crop_square(img: Image.Image, inset: float = 0.0) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    pad = int(side * inset)
    side -= pad * 2
    left = (w - min(w, h)) // 2 + pad
    top = (h - min(w, h)) // 2 + pad
    return img.crop((left, top, left + side, top + side))


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if not p.exists():
            continue
        try:
            return ImageFont.truetype(str(p), size=size, index=1 if bold else 0)
        except OSError:
            try:
                return ImageFont.truetype(str(p), size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def compose_og(logo: Image.Image) -> Image.Image:
    width, height = 1200, 630
    canvas = Image.new("RGB", (width, height), BG)
    mark = logo.resize((360, 360), Image.Resampling.LANCZOS)
    canvas.paste(mark, (96, (height - 360) // 2), mark)

    draw = ImageDraw.Draw(canvas)
    x = 96 + 360 + 72
    title_font = load_font(58, bold=True)
    subtitle_font = load_font(38)
    body_font = load_font(24)

    draw.text((x, 188), "What if…?", fill=(236, 236, 242), font=title_font)
    draw.text((x, 268), "카톡 평행우주 시뮬레이터", fill=(154, 154, 176), font=subtitle_font)
    draw.text(
        (x, 340),
        "대화는 브라우저에만 · OpenRouter 또는 코딩 에이전트 분석",
        fill=(122, 122, 138),
        font=body_font,
    )
    return canvas


def main() -> None:
    logo = Image.open(LOGO).convert("RGBA")
    icon_src = crop_square(logo, 0.06)
    favicon_src = crop_square(logo, 0.1)

    APP.mkdir(parents=True, exist_ok=True)

    icon512 = icon_src.resize((512, 512), Image.Resampling.LANCZOS)
    icon192 = icon_src.resize((192, 192), Image.Resampling.LANCZOS)
    apple180 = icon_src.resize((180, 180), Image.Resampling.LANCZOS)
    og = compose_og(icon_src)

    favicon_sizes = [(16, 16), (32, 32), (48, 48)]
    favicon_images = [
        favicon_src.resize(size, Image.Resampling.LANCZOS) for size in favicon_sizes
    ]

    icon512.save(APP / "icon.png", optimize=True)
    apple180.save(APP / "apple-icon.png", optimize=True)
    og.save(APP / "opengraph-image.png", optimize=True)
    favicon_images[0].save(
        APP / "favicon.ico",
        format="ICO",
        sizes=favicon_sizes,
        append_images=favicon_images[1:],
    )

    icon192.save(PUBLIC / "icon-192.png", optimize=True)
    icon512.save(PUBLIC / "icon-512.png", optimize=True)

    print("Generated src/app/{favicon.ico,icon.png,apple-icon.png,opengraph-image.png}")
    print("Generated public/{icon-192.png,icon-512.png}")


if __name__ == "__main__":
    main()
