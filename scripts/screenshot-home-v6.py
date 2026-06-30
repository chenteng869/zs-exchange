"""Screenshot v6 Royal Premium website"""
import os
from playwright.sync_api import sync_playwright

OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\docs\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    # 官网首页
    page.goto("http://localhost:3000", timeout=60000, wait_until="domcontentloaded")
    page.wait_for_timeout(8000)  # 等编译
    out1 = os.path.join(OUT_DIR, "home-v6-hero.png")
    page.screenshot(path=out1, full_page=False)
    print(f"OK hero -> {out1}")

    # 滚到特性区
    page.evaluate("window.scrollTo(0, 1400)")
    page.wait_for_timeout(3000)
    out2 = os.path.join(OUT_DIR, "home-v6-features.png")
    page.screenshot(path=out2, full_page=False)
    print(f"OK features -> {out2}")

    # 滚到牌照区
    page.evaluate("window.scrollTo(0, 2600)")
    page.wait_for_timeout(3000)
    out3 = os.path.join(OUT_DIR, "home-v6-licenses.png")
    page.screenshot(path=out3, full_page=False)
    print(f"OK licenses -> {out3}")

    # 滚到底部
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(3000)
    out4 = os.path.join(OUT_DIR, "home-v6-bottom.png")
    page.screenshot(path=out4, full_page=False)
    print(f"OK bottom -> {out4}")

    # 完整长截图
    out5 = os.path.join(OUT_DIR, "home-v6-full.png")
    page.screenshot(path=out5, full_page=True)
    print(f"OK full -> {out5}")

    browser.close()
    print("DONE")
