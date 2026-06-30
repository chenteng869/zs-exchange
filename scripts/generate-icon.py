"""Generate mipmap icons from a source JPG and replace Android launcher icons."""
from PIL import Image, ImageDraw
from pathlib import Path
import sys

ROOT = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01")
RES = ROOT / "android" / "app" / "src" / "main" / "res"
SRC = ROOT / "icon-source.jpg"

# (folder, size_px) - Android launcher icon density buckets
DENSITIES = [
    ("mipmap-mdpi", 48),
    ("mipmap-hdpi", 72),
    ("mipmap-xhdpi", 96),
    ("mipmap-xxhdpi", 144),
    ("mipmap-xxxhdpi", 192),
]

# Foreground is the visible safe area inside the adaptive icon (66dp of 108dp)
FG_RATIO = 0.66  # foreground crop = 66% of canvas
# Round mask is the same square source - Android clips to circle automatically

def main() -> int:
    if not SRC.exists():
        print(f"[ERR] source not found: {SRC}", file=sys.stderr)
        return 1
    src = Image.open(SRC).convert("RGB")
    print(f"[OK] source: {src.size} mode={src.mode}")
    for folder, size in DENSITIES:
        out_dir = RES / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        # Square launcher icon
        sq = src.resize((size, size), Image.LANCZOS)
        sq.save(out_dir / "ic_launcher.png", "PNG", optimize=True)
        # Round launcher icon (Android clips automatically; same source is fine)
        rd = src.resize((size, size), Image.LANCZOS)
        rd.save(out_dir / "ic_launcher_round.png", "PNG", optimize=True)
        # Adaptive icon foreground (centered, 66% safe area inside 108dp)
        fg_size = int(size / FG_RATIO)  # full 108dp canvas, foreground is 66dp
        canvas = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        inner = src.resize((int(fg_size * FG_RATIO), int(fg_size * FG_RATIO)), Image.LANCZOS)
        offset = ((fg_size - inner.width) // 2, (fg_size - inner.height) // 2)
        canvas.paste(inner, offset)
        canvas.save(out_dir / "ic_launcher_foreground.png", "PNG", optimize=True)
        print(f"[OK] {folder}: sq={size}x{size}, fg={fg_size}x{fg_size}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
