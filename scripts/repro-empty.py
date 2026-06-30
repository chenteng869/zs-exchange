"""Reproduce ERR_EMPTY_RESPONSE on mobile by visiting / (PC home) vs /h5 (mobile)."""
from playwright.sync_api import sync_playwright

ROOT = "http://192.168.8.3:3200/"
H5 = "http://192.168.8.3:3200/h5"

def probe(url: str) -> dict:
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 393, "height": 852}, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)[:200]))
        page.on("requestfailed", lambda r: errs.append(f"REQFAIL {r.url[:80]} :: {r.failure}"))
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
            status = resp.status if resp else None
            page.wait_for_timeout(3000)
            title = page.title()
        except Exception as e:
            status = f"EXC: {type(e).__name__}: {str(e)[:200]}"
            title = "-"
        b.close()
        return {"url": url, "status": status, "title": title, "errs": errs[:5]}

for u in (ROOT, H5):
    r = probe(u)
    print(f"URL:    {r['url']}")
    print(f"Status: {r['status']}")
    print(f"Title:  {r['title']}")
    if r["errs"]:
        print("Errs:")
        for e in r["errs"]:
            print(f"  - {e}")
    print("---")
