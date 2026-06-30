"""Open admin dashboard on desktop viewport and take screenshot."""
from playwright.sync_api import sync_playwright
from pathlib import Path

URL = "http://192.168.8.3:3200/admin/dashboard"
OUT_DIR = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\screenshots")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
        )
        page = ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(f"[error] {e}"))
        page.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error",) else None)
        try:
            page.goto(URL, wait_until="domcontentloaded", timeout=30000)
            try:
                page.wait_for_load_state("networkidle", timeout=12000)
            except Exception:
                pass
            page.wait_for_timeout(2500)
            out = OUT_DIR / "admin-dashboard.png"
            page.screenshot(path=str(out), full_page=True)
            print(f"OK url={page.url} title={page.title()!r}")
            print(f"OK screenshot={out} size={out.stat().st_size} bytes")
            # Sample text
            body = page.locator("body").inner_text()[:600].replace("\n", " | ")
            print("BODY:", body)
            if errs:
                print("--- console errors ---")
                for e in errs[-10:]:
                    print(e)
        finally:
            browser.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
