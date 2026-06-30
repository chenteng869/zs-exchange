"""Open admin/dashboard in headless browser and report rendered content (no screenshot)."""
from playwright.sync_api import sync_playwright

URL = "http://192.168.8.3:3200/admin/dashboard"

def main() -> int:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        errs, warns = [], []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: (errs if m.type == "error" else warns).append(m.text))
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass
        page.wait_for_timeout(2000)

        print(f"URL:    {page.url}")
        print(f"TITLE:  {page.title()}")
        print()
        print("=== Top navigation / header ===")
        try:
            for el in page.locator("header a, header button, nav a").all()[:25]:
                t = el.inner_text().strip()
                if t:
                    print(f"  - {t}")
        except Exception as e:
            print(f"  (no header) {e}")
        print()
        print("=== Sidebar (left menu) ===")
        for el in page.locator("aside a, aside button, [class*='sidebar'] a, [class*='menu'] a").all()[:60]:
            t = el.inner_text().strip()
            if t and len(t) < 40:
                print(f"  - {t}")
        print()
        print("=== Page KPI cards ===")
        for el in page.locator("[class*='card'], [class*='stat'], [class*='kpi']").all()[:12]:
            t = el.inner_text().strip().replace("\n", " | ")
            if t and len(t) < 200:
                print(f"  - {t}")
        print()
        print("=== Main headings ===")
        for el in page.locator("h1, h2, h3").all()[:15]:
            t = el.inner_text().strip()
            if t:
                print(f"  - {t}")
        print()
        print(f"=== Errors ({len(errs)}) / Warns ({len(warns)}) ===")
        for e in errs[:5]:
            print(f"  ERR: {e[:200]}")
        for w in warns[:5]:
            print(f"  WARN: {w[:200]}")
        b.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
