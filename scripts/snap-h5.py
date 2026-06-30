"""Open the H5 home page on a mobile viewport and take a screenshot."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import sys

URL = "http://192.168.8.3:3200/h5"
OUT_DIR = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\screenshots")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # iPhone 14 Pro viewport (393x852 logical, 3x dpr)
        ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            ),
        )
        page = ctx.new_page()
        console_msgs = []
        page.on("console", lambda m: console_msgs.append(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: console_msgs.append(f"[error] {e}"))
        try:
            page.goto(URL, wait_until="domcontentloaded", timeout=30000)
            # Wait for client-rendered content (Binance WS, wagmi providers)
            try:
                page.wait_for_load_state("networkidle", timeout=15000)
            except Exception:
                pass  # WS streams keep network busy, ignore
            page.wait_for_timeout(3000)  # allow first paint + WS handshake
            out = OUT_DIR / "h5-home.png"
            page.screenshot(path=str(out), full_page=True)
            title = page.title()
            url = page.url
            print(f"OK title={title!r} url={url}")
            print(f"OK screenshot={out} size={out.stat().st_size}")
            print("--- console (last 15) ---")
            for line in console_msgs[-15:]:
                print(line)
        finally:
            browser.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
