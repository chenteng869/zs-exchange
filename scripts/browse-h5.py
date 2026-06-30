"""Open /h5 in headless mobile browser and report rendered content."""
from playwright.sync_api import sync_playwright

URL = "http://192.168.8.3:3200/h5"

def main() -> int:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(
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
        errs, warns = [], []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: (errs if m.type == "error" else warns).append(m.text))
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass
        page.wait_for_timeout(3000)

        print(f"URL:    {page.url}")
        print(f"TITLE:  {page.title()}")
        print()
        print("=== Top header buttons ===")
        for el in page.locator("header a, header button, nav a, nav button").all()[:15]:
            t = el.inner_text().strip()
            if t and len(t) < 30:
                print(f"  - {t}")
        print()
        print("=== Main headings ===")
        for el in page.locator("h1, h2, h3").all()[:20]:
            t = el.inner_text().strip()
            if t and len(t) < 60:
                print(f"  - {t}")
        print()
        print("=== Visible ticker pair rows (first 12) ===")
        for el in page.locator("text=/USDT/").all()[:12]:
            t = el.inner_text().strip()
            if t and len(t) < 80:
                print(f"  - {t}")
        print()
        print("=== Bottom tab bar ===")
        for el in page.locator("nav a, footer a, [class*='tab'] a, [class*='tabbar'] a").all()[:8]:
            t = el.inner_text().strip()
            if t and len(t) < 20:
                print(f"  - {t}")
        print()
        print(f"=== Errors ({len(errs)}) / Warns ({len(warns)}) ===")
        for e in errs[:5]:
            print(f"  ERR: {e[:200]}")
        for w in warns[:5]:
            print(f"  WARN: {w[:150]}")
        b.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
