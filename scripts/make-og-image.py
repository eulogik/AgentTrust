#!/usr/bin/env python3
"""Generate web/public/og-image.png (1280x640 social preview) with PIL.
Brand: near-black + one cyan accent + emerald grade card. No external assets.
Usage: python3 scripts/make-og-image.py
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 640
BG = (6, 9, 11)
WHITE = (233, 239, 243)
MUTED = (150, 163, 174)
FAINT = (100, 114, 124)
CYAN = (34, 211, 238)
EMERALD = (52, 211, 153)
CARD_BG = (11, 15, 18)

TTC = "/System/Library/Fonts/HelveticaNeue.ttc"


def font(size, bold=False):
    try:
        return ImageFont.truetype(TTC, size, index=1 if bold else 0)
    except OSError:
        return ImageFont.load_default()


def tracked(draw, xy, text, fnt, fill, ls=3):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + ls
    return x


def main():
    img = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i, alpha in enumerate((26, 18, 12, 7, 4)):
        r = 720 - i * 110
        gd.ellipse([640 - r, -420, 640 + r, -420 + int(r * 0.62)], fill=(34, 211, 238, alpha))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    tracked(d, (90, 116), "AGENTTRUST  ·  OWASP-MAPPED AGENT SECURITY", font(24), CYAN, ls=3)

    fb, sb = font(82, bold=True), font(82, bold=True)
    d.text((86, 178), "A trust score", font=fb, fill=WHITE)
    d.text((86, 272), "for every AI agent.", font=sb, fill=WHITE)

    d.text((90, 408), "Free CLI  ·  8 rules  ·  Trust Cards A–F  ·  50 servers graded",
           font=font(30), fill=MUTED)
    d.text((90, 540), "eulogik.github.io/AgentTrust", font=font(30), fill=FAINT)

    # Grade card, right side
    cx0, cy0, cx1, cy1 = 948, 128, 1190, 512
    d.rounded_rectangle([cx0, cy0, cx1, cy1], radius=26, fill=CARD_BG,
                        outline=EMERALD + (140,), width=2)
    label = "TRUST CARD"
    lf = font(23)
    d.text((cx0 + (cx1 - cx0 - d.textlength(label, font=lf)) / 2, cy0 + 26),
           label, font=lf, fill=MUTED)
    af = font(200, bold=True)
    a = "A"
    d.text((cx0 + (cx1 - cx0 - d.textlength(a, font=af)) / 2, cy0 + 66),
           a, font=af, fill=EMERALD)
    score = "90 / 100"
    sf = font(34, bold=True)
    d.text((cx0 + (cx1 - cx0 - d.textlength(score, font=sf)) / 2, cy1 - 76),
           score, font=sf, fill=WHITE)

    img.save("web/public/og-image.png")
    print("wrote web/public/og-image.png")


if __name__ == "__main__":
    main()
