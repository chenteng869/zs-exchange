"""APK launch redirect: index.html → h5/index.html via meta refresh (most reliable in WebView)."""
from pathlib import Path

ROOT = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01")
INDEX = ROOT / "out" / "index.html"
ANDROID_ASSETS = ROOT / "android" / "app" / "src" / "main" / "assets" / "public" / "index.html"

REDIRECT_HTML = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="0; url=h5/index.html" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<title>ZS Exchange</title>
<style>
  body { margin:0; background:#0F1B3D; color:#9aa3b2;
         display:flex; align-items:center; justify-content:center;
         height:100vh; font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .box { text-align:center; }
  .logo { width:56px; height:56px; border-radius:14px; margin:0 auto 16px;
          background:linear-gradient(135deg,#F0B90B,#F8D33A);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 24px rgba(240,185,11,0.3);
          font-size:28px; }
  .text { color:#cbd5e1; font-size:14px; margin-bottom:8px; }
  a { color:#F0B90B; text-decoration:none; }
</style>
</head>
<body>
  <div class="box">
    <div class="logo">⛓</div>
    <div class="text">正在进入 ZS Exchange…</div>
    <a href="h5/index.html">点击进入 →</a>
  </div>
</body>
</html>
"""

def main() -> int:
    INDEX.parent.mkdir(parents=True, exist_ok=True)
    INDEX.write_text(REDIRECT_HTML, encoding="utf-8")
    print(f"OK wrote {INDEX} ({INDEX.stat().st_size} bytes)")
    if ANDROID_ASSETS.exists():
        ANDROID_ASSETS.write_text(REDIRECT_HTML, encoding="utf-8")
        print(f"OK wrote {ANDROID_ASSETS} ({ANDROID_ASSETS.stat().st_size} bytes)")
    else:
        print(f"SKIP {ANDROID_ASSETS} (not synced yet)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
