"""截图验证 V1.0 色系应用效果"""
import os
import sys
from playwright.sync_api import sync_playwright

# 目标 URL
URL = "http://localhost:3000/admin/dashboard"
OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\docs\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    try:
        page.goto(URL, timeout=30000)
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception as e:
        print(f"导航警告: {e}")
        # 继续截图，即使有错误

    # 等动画
    page.wait_for_timeout(2000)

    # 截图 dashboard
    out1 = os.path.join(OUT_DIR, "admin-dashboard-v1.png")
    page.screenshot(path=out1, full_page=False)
    print(f"OK: {out1}")

    # 滚动到底部再截一张
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(1500)
    out2 = os.path.join(OUT_DIR, "admin-dashboard-bottom-v1.png")
    page.screenshot(path=out2, full_page=False)
    print(f"OK: {out2}")

    # 再访问一个典型页面
    page.goto("http://localhost:3000/admin/security/overview", timeout=30000)
    page.wait_for_load_state("networkidle", timeout=15000)
    page.wait_for_timeout(2000)
    out3 = os.path.join(OUT_DIR, "admin-security-v1.png")
    page.screenshot(path=out3, full_page=False)
    print(f"OK: {out3}")

    # console errors
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    if errors:
        print(f"控制台错误: {errors[:5]}")

    browser.close()
    print("截图完成")
