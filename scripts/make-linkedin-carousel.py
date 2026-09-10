#!/usr/bin/env python3
"""Generate LinkedIn carousel slides (1080x1350 portrait) with PIL.
Usage: python3 scripts/make-linkedin-carousel.py  -> press/linkedin-*.png
"""
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
BG = (6, 9, 11)
WHITE = (233, 239, 243)
MUTED = (150, 163, 174)
FAINT = (100, 114, 124)
CYAN = (34, 211, 238)
EMERALD = (52, 211, 153)
AMBER = (251, 191, 36)
ORANGE = (251, 146, 60)
ROSE = (251, 113, 133)
CARD = (11, 15, 18)
TTC = "/System/Library/Fonts/HelveticaNeue.ttc"
X = 96
CONTENT_W = W - 2 * X


def font(size, bold=False):
    try:
        return ImageFont.truetype(TTC, size, index=1 if bold else 0)
    except OSError:
        return ImageFont.load_default()


def base():
    img = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i, alpha in enumerate((24, 16, 10, 6)):
        r = 620 - i * 110
        gd.ellipse([540 - r, -380, 540 + r, -380 + int(r * 0.6)], fill=(34, 211, 238, alpha))
    return Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")


def tracked(d, y, text, size=27, fill=CYAN):
    f = font(size)
    x = X
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + 3


def head(d, eyebrow, lines, y=170, size=96):
    tracked(d, 120, eyebrow)
    f = font(size, bold=True)
    for line in lines:
        d.text((X - 4, y), line, font=f, fill=WHITE)
        y += int(size * 1.08)
    return y


def foot(d, n):
    f = font(26)
    d.text((X, H - 150), "eulogik.github.io/OpenTrustBench", font=f, fill=FAINT)
    r, gap, cy = 7, 26, H - 132
    total = 5 * (2 * r) + 4 * gap
    x = W - X - total
    for i in range(1, 6):
        d.ellipse([x, cy - r, x + 2 * r, cy + r],
                  fill=CYAN if i == n else None,
                  outline=FAINT if i != n else None, width=2)
        x += 2 * r + gap


def save(img, n):
    img.save(f"press/linkedin-0{n}.png")
    print(f"wrote press/linkedin-0{n}.png")


def slide1():
    img = base()
    d = ImageDraw.Draw(img)
    y = head(d, "OPENTRUSTBENCH  ·  MCP SECURITY REPORT", ["I scanned 50", "MCP servers."], size=100)
    d.text((X, y + 30), "Average grade: C", font=font(44, bold=True), fill=CYAN)
    y += 130
    d.line([(X, y), (X + CONTENT_W, y)], fill=(38, 48, 56), width=2)
    y += 36
    stats = [("36%", "grade D or F", ROSE), ("40%", "excessive scope", AMBER), ("70.2", "average score", CYAN)]
    sx = X
    for val, label, col in stats:
        d.text((sx, y), val, font=font(52, bold=True), fill=col)
        d.text((sx, y + 72), label, font=font(26), fill=MUTED)
        sx += CONTENT_W // 3
    foot(d, 1)
    save(img, 1)


def slide2():
    img = base()
    d = ImageDraw.Draw(img)
    y = head(d, "THE PROBLEM", ["One install.", "Total access."], size=96)
    f = font(36)
    for i, line in enumerate(["Shell  ·  Filesystem  ·  Network", "No permission manifest.", "No reputation signal. No grades."]):
        d.text((X, y + 30 + i * 62), line, font=f, fill=MUTED)
    foot(d, 2)
    save(img, 2)


def slide3():
    img = base()
    d = ImageDraw.Draw(img)
    y = head(d, "THE DATA  ·  50 SERVERS", ["36% fail."], size=100)
    data = [("A", 15, EMERALD), ("B", 12, CYAN), ("C", 5, AMBER), ("D", 14, ORANGE), ("F", 4, ROSE)]
    y += 50
    for g, n, col in data:
        d.text((X, y), g, font=font(38, bold=True), fill=col)
        bx = X + 70
        bw = int(CONTENT_W - 220)
        d.rounded_rectangle([bx, y + 8, bx + bw, y + 38], radius=8, fill=(26, 34, 41))
        d.rounded_rectangle([bx, y + 8, bx + int(bw * n / 15), y + 38], radius=8, fill=col)
        cnt = str(n)
        d.text((bx + bw + 24, y), cnt, font=font(38, bold=True), fill=WHITE)
        y += 84
    foot(d, 3)
    save(img, 3)


def slide4():
    img = base()
    d = ImageDraw.Draw(img)
    y = head(d, "THE PATTERN", ["Scope predicts", "the grade."], size=92)
    y += 40
    d.text((X, y), "Every A = zero findings + minimal scope.", font=font(32), fill=MUTED)
    y += 80
    f = font(30)
    d.text((X, y), "TOP", font=font(26, bold=True), fill=EMERALD)
    y += 52
    for name, score in [("mcp-cli", 96), ("pinecone-mcp", 95), ("tavily-mcp", 94)]:
        d.text((X, y), name, font=f, fill=WHITE)
        s = str(score)
        d.text((X + CONTENT_W - d.textlength(s, font=f), y), s, font=f, fill=EMERALD)
        y += 56
    y += 30
    d.text((X, y), "BOTTOM", font=font(26, bold=True), fill=ROSE)
    y += 52
    for name, score in [("blender-mcp", 35), ("fastmcp", 37), ("mcp-use", 37)]:
        d.text((X, y), name, font=f, fill=WHITE)
        s = str(score)
        d.text((X + CONTENT_W - d.textlength(s, font=f), y), s, font=f, fill=ROSE)
        y += 56
    foot(d, 4)
    save(img, 4)


def slide5():
    img = base()
    d = ImageDraw.Draw(img)
    y = head(d, "THE TOOL  ·  FREE  ·  OPEN SOURCE", ["Scan before", "you install."], size=92)
    y += 50
    cmd = "npx @opentrustbench/cli scan ."
    cf = font(34)
    pad = 28
    bw = d.textlength(cmd, font=cf) + pad * 2
    d.rounded_rectangle([X, y, X + bw, y + 92], radius=16, fill=CARD,
                        outline=CYAN + (110,), width=2)
    d.text((X + pad, y + 24), cmd, font=cf, fill=CYAN)
    y += 150
    d.text((X, y), "Trust Cards A–F  ·  SARIF for CI  ·  Zero telemetry", font=font(30), fill=MUTED)
    y += 70
    d.text((X, y), "Full data + methodology: link in comments.", font=font(30, bold=True), fill=WHITE)
    foot(d, 5)
    save(img, 5)


if __name__ == "__main__":
    import os
    os.makedirs("press", exist_ok=True)
    slide1()
    slide2()
    slide3()
    slide4()
    slide5()
