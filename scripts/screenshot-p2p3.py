"""P2/P3 12 个 admin 页面截图"""
import os
from playwright.sync_api import sync_playwright

OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\docs\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

PAGES = [
    ("admin-algo-strategies", "http://localhost:3000/admin/algo/strategies"),
    ("admin-maker", "http://localhost:3000/admin/maker"),
    ("admin-portfolio", "http://localhost:3000/admin/portfolio"),
    ("admin-yield", "http://localhost:3000/admin/yield"),
    ("admin-fiat", "http://localhost:3000/admin/fiat"),
    ("admin-kol", "http://localhost:3000/admin/kol"),
    ("admin-insurance", "http://localhost:3000/admin/insurance"),
    ("admin-nansen", "http://localhost:3000/admin/nansen"),
    ("admin-dcep", "http://localhost:3000/admin/dcep"),
    ("admin-sentiment", "http://localhost:3000/admin/sentiment"),
    ("admin-dao", "http://localhost:3000/admin/dao"),
    ("admin-otc", "http://localhost:3000/admin/otc"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    for name, url in PAGES:
        try:
            page.goto(url, timeout=30000, wait_until="domcontentloaded")
            page.wait_for_timeout(4500)
            out = os.path.join(OUT_DIR, f"{name}-p2p3.png")
            page.screenshot(path=out, full_page=False)
            print(f"OK {name} -> {out}")
        except Exception as e:
            print(f"FAIL {name}: {str(e)[:120]}")

    browser.close()
    print("DONE")
