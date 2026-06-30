"""截图验证多个 admin 页面"""
import os
from playwright.sync_api import sync_playwright

OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\docs\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

PAGES = [
    ("admin-dashboard", "http://localhost:3000/admin/dashboard"),
    ("admin-users", "http://localhost:3000/admin/users"),
    ("admin-transactions", "http://localhost:3000/admin/transactions"),
    ("admin-cex-spot", "http://localhost:3000/admin/cex/spot"),
    ("admin-web3", "http://localhost:3000/admin/web3/dashboard"),
    ("admin-wallet", "http://localhost:3000/admin/wallet/assets"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    for name, url in PAGES:
        try:
            page.goto(url, timeout=20000, wait_until="domcontentloaded")
            page.wait_for_timeout(3500)  # 等待编译
            out = os.path.join(OUT_DIR, f"{name}-v1.png")
            page.screenshot(path=out, full_page=False)
            print(f"OK {name} -> {out}")
        except Exception as e:
            print(f"FAIL {name}: {str(e)[:80]}")

    browser.close()
    print("DONE")
