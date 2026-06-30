"""Screenshot v7 Aurora Premium website - verify upgrade"""
import os
from playwright.sync_api import sync_playwright

OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\docs\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    # 1. 官网首页 - 顶部
    page.goto("http://localhost:3000", timeout=60000, wait_until="domcontentloaded")
    page.wait_for_timeout(8000)
    out1 = os.path.join(OUT_DIR, "home-v7-hero.png")
    page.screenshot(path=out1, full_page=False)
    print(f"OK hero -> {out1}")

    # 2. 滚到行情区
    page.evaluate("window.scrollTo(0, 700)")
    page.wait_for_timeout(2500)
    out2 = os.path.join(OUT_DIR, "home-v7-ticker.png")
    page.screenshot(path=out2, full_page=False)
    print(f"OK ticker -> {out2}")

    # 3. 滚到特性区
    page.evaluate("window.scrollTo(0, 1500)")
    page.wait_for_timeout(2500)
    out3 = os.path.join(OUT_DIR, "home-v7-features.png")
    page.screenshot(path=out3, full_page=False)
    print(f"OK features -> {out3}")

    # 4. 滚到牌照区
    page.evaluate("window.scrollTo(0, 2700)")
    page.wait_for_timeout(2500)
    out4 = os.path.join(OUT_DIR, "home-v7-licenses.png")
    page.screenshot(path=out4, full_page=False)
    print(f"OK licenses -> {out4}")

    # 5. 滚到中段
    page.evaluate("window.scrollTo(0, 3800)")
    page.wait_for_timeout(2500)
    out5 = os.path.join(OUT_DIR, "home-v7-mid.png")
    page.screenshot(path=out5, full_page=False)
    print(f"OK mid -> {out5}")

    # 6. 滚到底部
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(2500)
    out6 = os.path.join(OUT_DIR, "home-v7-bottom.png")
    page.screenshot(path=out6, full_page=False)
    print(f"OK bottom -> {out6}")

    # 7. 完整长截图
    out7 = os.path.join(OUT_DIR, "home-v7-full.png")
    page.screenshot(path=out7, full_page=True)
    print(f"OK full -> {out7}")

    browser.close()
    print("DONE - v7 Aurora Premium screenshots saved")
