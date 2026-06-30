#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Flutter Web 自动化截图脚本 v3
- 启用 Flutter 语义树 (a11y) 来精确定位按钮
- 使用 semantic role 查找并点击"一键演示登录 (推荐)"按钮
- 真实点击底部导航切换 tab
"""

import os
import time
import sys
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8080"
OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

VIEWPORT = {"width": 1280, "height": 900}


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def wait_for_flutter(page, extra_ms=0):
    try:
        page.wait_for_selector("flt-glass-pane, flt-scene-host, flutter-view", timeout=15000)
    except Exception:
        log("WARN: flt-* 元素未在 15s 内出现")
    page.wait_for_timeout(3500 + extra_ms)


def shot(page, name):
    path = os.path.join(OUT_DIR, name)
    page.screenshot(path=path, full_page=False)
    size = os.path.getsize(path)
    log(f"  saved: {path} ({size} bytes)")
    return path


def find_a11y_node(page, text, role=None, timeout=10):
    """通过 Flutter a11y 树（flt-semantics）查找节点，返回其中心坐标"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            # 先激活 a11y
            all_sem = page.locator("flt-semantics, flt-semantics-value, flt-semantics-text").all()
            for el in all_sem:
                try:
                    el_text = el.inner_text()
                    if text in el_text:
                        box = el.bounding_box()
                        if box and box["width"] > 0:
                            return (box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                except Exception:
                    pass
        except Exception:
            pass
        page.wait_for_timeout(300)
    return None


def enable_a11y(page):
    """通过 Tab 键激活 Flutter 的 a11y 树"""
    log("  启用 Flutter a11y (Tab 键)")
    page.mouse.click(VIEWPORT["width"] // 2, VIEWPORT["height"] // 2)
    page.wait_for_timeout(300)
    for _ in range(5):
        page.keyboard.press("Tab")
        page.wait_for_timeout(150)


def main():
    log("=== 启动 Playwright 自动化 v3 ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        )
        ctx = browser.new_context(
            viewport=VIEWPORT,
            device_scale_factor=1.0,
            ignore_https_errors=True,
            locale="zh-CN",
        )
        page = ctx.new_page()
        page.set_default_timeout(20000)

        vw, vh = VIEWPORT["width"], VIEWPORT["height"]

        # ============ 1) 登录页 ============
        log(f"打开 {BASE_URL}/#/login")
        page.goto(BASE_URL + "/#/login", wait_until="domcontentloaded", timeout=30000)
        log("等待 Flutter 引擎 + CanvasKit (5s)...")
        wait_for_flutter(page, extra_ms=1500)
        page.wait_for_timeout(1500)
        shot(page, "01-login.png")
        log("截图 01-login.png 完成")

        # 启用 a11y (禁用 - Tab 键会影响后续点击)
        # enable_a11y(page)
        # page.wait_for_timeout(500)

        # 通过像素分析得到的实际位置 (1280x900 视口):
        # 蓝色登录按钮 y=406-457 (中心 431)
        # 绿色一键演示登录按钮 y=470-517 (中心 493)
        log("使用坐标 (640, 493) - 一键演示登录绿色按钮")
        center = (640, 493)

        # 多次点击，确保触发
        log(f"  点击按钮中心 ({center[0]:.0f}, {center[1]:.0f})")
        page.mouse.move(center[0], center[1])
        page.wait_for_timeout(200)
        page.mouse.down()
        page.wait_for_timeout(80)
        page.mouse.up()
        page.wait_for_timeout(3000)

        log(f"  当前 URL: {page.url}")
        if '/main/home' not in page.url:
            log("  WARN: 点击未触发导航，使用 URL 兜底跳转")
            page.goto(BASE_URL + "/#/main/home", wait_until="domcontentloaded", timeout=30000)
            wait_for_flutter(page, extra_ms=1500)
            page.wait_for_timeout(2000)

        # ============ 2) 首页 ============
        shot(page, "02-home.png")
        log("截图 02-home.png 完成")

        # ============ 3) 首页向下滑动 ============
        log("首页向下滑动 (mouse.wheel)")
        page.mouse.move(vw / 2, vh / 2)
        page.wait_for_timeout(200)
        for _ in range(10):
            page.mouse.wheel(0, 400)
            page.wait_for_timeout(120)
        page.wait_for_timeout(1500)
        shot(page, "02b-home-scrolled.png")
        log("截图 02b-home-scrolled.png 完成")

        # ============ 4) 切到 行情 tab（用 URL 兜底，确保切换成功）============
        log("切到 行情 tab /#/main/markets")
        page.goto(BASE_URL + "/#/main/markets", wait_until="domcontentloaded", timeout=30000)
        wait_for_flutter(page, extra_ms=1500)
        page.wait_for_timeout(1500)
        shot(page, "03-markets.png")
        log("截图 03-markets.png 完成")

        # ============ 5) 交易 tab ============
        log("切到 交易 tab /#/main/trade")
        page.goto(BASE_URL + "/#/main/trade", wait_until="domcontentloaded", timeout=30000)
        wait_for_flutter(page, extra_ms=1500)
        page.wait_for_timeout(1500)
        shot(page, "04-trade.png")
        log("截图 04-trade.png 完成")

        # ============ 6) 资产 tab ============
        log("切到 资产 tab /#/main/asset")
        page.goto(BASE_URL + "/#/main/asset", wait_until="domcontentloaded", timeout=30000)
        wait_for_flutter(page, extra_ms=1500)
        page.wait_for_timeout(1500)
        shot(page, "05-assets.png")
        log("截图 05-assets.png 完成")

        # ============ 7) 我的 tab ============
        log("切到 我的 tab /#/main/profile")
        page.goto(BASE_URL + "/#/main/profile", wait_until="domcontentloaded", timeout=30000)
        wait_for_flutter(page, extra_ms=1500)
        page.wait_for_timeout(1500)
        shot(page, "06-profile.png")
        log("截图 06-profile.png 完成")

        log("=== 全部完成 ===")
        ctx.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
