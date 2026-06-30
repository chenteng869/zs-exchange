from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "wine369-market-detail-page-preview.png"

W, H = 1440, 2820
BG = (18, 7, 8)
PANEL = (45, 21, 20)
PANEL2 = (57, 28, 26)
LINE = (122, 84, 37)
GOLD = (231, 191, 102)
GOLD2 = (255, 232, 168)
CREAM = (255, 246, 222)
MUTED = (205, 190, 165)
RED = (152, 42, 34)
INK = (42, 11, 13)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\simsun.ttc",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


F = {
    "nav": font(22),
    "brand": font(34, True),
    "eyebrow": font(22, True),
    "h1": font(88, True),
    "h2": font(54, True),
    "h3": font(36, True),
    "body": font(26),
    "small": font(22),
    "price": font(92, True),
    "num": font(48, True),
}


def rounded(draw, xy, radius, fill, outline=None, width=2):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, fill=CREAM, f=None, anchor=None):
    draw.text(xy, value, fill=fill, font=f or F["body"], anchor=anchor)


def wrap_lines(draw, value, f, max_width):
    lines = []
    for raw in value.split("\n"):
        line = ""
        for ch in raw:
            trial = line + ch
            if draw.textlength(trial, font=f) <= max_width:
                line = trial
            else:
                if line:
                    lines.append(line)
                line = ch
        if line:
            lines.append(line)
    return lines


def paragraph(draw, x, y, value, max_width, f=None, fill=MUTED, line_gap=10):
    f = f or F["body"]
    for line in wrap_lines(draw, value, f, max_width):
        text(draw, (x, y), line, fill=fill, f=f)
        y += f.size + line_gap
    return y


def card(draw, x, y, w, h, title, body, icon=True):
    rounded(draw, (x, y, x + w, y + h), 28, PANEL, LINE, 2)
    ty = y + 38
    if icon:
        draw.ellipse((x + 34, y + 34, x + 92, y + 92), fill=GOLD)
        title_x = x + 118
    else:
        title_x = x + 34
    text(draw, (title_x, ty), title, fill=CREAM, f=F["h3"])
    paragraph(draw, x + 34, y + 116, body, w - 68, f=F["body"], fill=MUTED, line_gap=12)


def release_card(draw, x, y, w, h, pct, title, body):
    rounded(draw, (x, y, x + w, y + h), 28, PANEL, LINE, 2)
    text(draw, (x + 34, y + 56), pct, fill=GOLD2, f=F["num"])
    text(draw, (x + 34, y + 120), title, fill=CREAM, f=F["h3"])
    paragraph(draw, x + 34, y + 176, body, w - 68, f=F["body"], fill=MUTED, line_gap=12)


img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Soft background atmosphere
for cx, cy, r, color in [
    (220, 140, 430, (80, 38, 20)),
    (1130, 260, 520, (86, 18, 22)),
    (650, 1160, 620, (54, 24, 12)),
]:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, 110))
    img = Image.alpha_composite(img.convert("RGBA"), layer.filter(ImageFilter.GaussianBlur(80))).convert("RGB")
    draw = ImageDraw.Draw(img)

# Subtle grid
for x in range(0, W, 110):
    draw.line((x, 0, x, H), fill=(42, 24, 18), width=1)
for y in range(0, H, 110):
    draw.line((0, y, W, y), fill=(42, 24, 18), width=1)

# Nav
text(draw, (78, 74), "Wine369", fill=GOLD2, f=F["brand"])
text(draw, (1110, 78), "老酒礼包   NFT酒证   Token权益", fill=MUTED, f=F["nav"], anchor="ra")

# Hero
rounded(draw, (72, 130, 1368, 730), 38, (33, 13, 14), LINE, 2)

# Bottle visual
draw.ellipse((194, 620, 520, 678), fill=(0, 0, 0))
rounded(draw, (302, 192, 392, 334), 36, (198, 141, 44), (235, 204, 126), 3)
rounded(draw, (230, 320, 468, 650), 64, (25, 7, 8), (203, 160, 76), 5)
rounded(draw, (260, 438, 438, 564), 18, (248, 228, 182), (185, 126, 37), 3)
text(draw, (349, 486), "福建老酒", fill=(76, 18, 20), f=font(34, True), anchor="mm")
text(draw, (349, 526), "WINE369", fill=(116, 69, 20), f=font(20, True), anchor="mm")
rounded(draw, (440, 496, 682, 632), 24, (216, 164, 73), (255, 228, 150), 3)
text(draw, (470, 540), "NFT 酒证", fill=INK, f=font(30, True))
text(draw, (470, 584), "溯源 · 防伪 · 会员身份", fill=INK, f=font(20, True))

# Hero copy
rounded(draw, (760, 206, 930, 252), 23, (64, 33, 24), (146, 99, 44), 2)
text(draw, (786, 237), "海外用户专属", fill=GOLD2, f=F["eyebrow"])
text(draw, (760, 344), "福建老酒\nWine369", fill=CREAM, f=F["h1"])
draw.rectangle((742, 330, 1288, 532), fill=(33, 13, 14))
draw.multiline_text((760, 336), "福建老酒\nWine369", fill=CREAM, font=F["h1"], spacing=18)
paragraph(draw, 760, 548, "面向全球会员的老酒实物礼包。每瓶对应 NFT 酒证，并获得会员 Token 权益。", 560, f=F["body"], fill=MUTED, line_gap=14)
text(draw, (760, 640), "$369", fill=GOLD2, f=F["price"])
text(draw, (1038, 670), "USD / 老酒礼包", fill=MUTED, f=font(30, True))

# Bundle section
y = 820
text(draw, (78, y), "一份礼包，三类权益", fill=CREAM, f=F["h2"])
text(draw, (78, y + 66), "市场端只展示用户获得的内容，不展示内部成本、市场费或利润结构。", fill=MUTED, f=F["body"])
card(draw, 78, y + 126, 400, 270, "福建老酒实物", "用户购买的是可交付的老酒商品，商品价值是整个权益模型的基础。")
card(draw, 520, y + 126, 400, 270, "NFT 酒证", "每瓶绑定一张 NFT 酒证，可用于溯源、防伪、收藏和会员身份展示。")
card(draw, 962, y + 126, 400, 270, "Token 会员权益", "每瓶获得 369,000 枚会员权益，可按规则使用。")

# Release section
y = 1280
text(draw, (78, y), "Token 分期释放", fill=CREAM, f=F["h2"])
text(draw, (78, y + 66), "释放规则面向长期会员关系设计，避免一次性释放造成短期抛压。", fill=MUTED, f=F["body"])
release_card(draw, 78, y + 126, 400, 280, "20%", "立即释放", "购买后进入用户权益账户，可用于平台内会员权益。")
release_card(draw, 520, y + 126, 400, 280, "30%", "六个月释放", "按周期解锁，适合会员留存和复购权益绑定。")
release_card(draw, 962, y + 126, 400, 280, "50%", "十二至二十四个月", "长期权益绑定，保护生态稳定和会员体验。")

# Usage section
y = 1788
text(draw, (78, y), "Wine369 Token 可以怎么用", fill=CREAM, f=F["h2"])
text(draw, (78, y + 66), "不是收益承诺，而是可消费、可升级、可兑换、可展示的会员权益。", fill=MUTED, f=F["body"])
card(draw, 78, y + 126, 620, 220, "购酒抵扣", "按平台规则抵扣部分订单金额，提升会员复购体验。")
card(draw, 742, y + 126, 620, 220, "会员升级", "解锁限量酒、优先购、品鉴活动等会员资格。")
card(draw, 78, y + 376, 620, 220, "NFT 升级", "普通酒证可升级为年份版、收藏版或酒窖版。")
card(draw, 742, y + 376, 620, 220, "活动兑换", "可兑换酒具、运费券、礼盒、品鉴会门票等权益。")

# Notice
y = 2388
rounded(draw, (78, y, 1362, y + 210), 28, (49, 18, 18), (149, 87, 41), 2)
text(draw, (112, y + 54), "重要说明", fill=GOLD2, f=font(30, True))
paragraph(draw, 112, y + 86, "中国大陆用户、中国身份用户、中国手机号、中国 IP 不开放。市场自由定价，不承诺收益、回本、分红或涨幅。", 1160, f=font(24), fill=MUTED, line_gap=10)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, quality=95)
print(OUT)
