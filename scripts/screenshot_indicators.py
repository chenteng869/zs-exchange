#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
截图：现货交易页 K 线 + 指标选择面板
"""
import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:8080"
OUT_DIR = r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

VIEWPORT = {"width": 420, "height": 900}  # 移动端尺寸


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def main():
    log("=== 启动 Playwright 截图 ===")
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
        page.set_default_timeout(30000)

        # 直接进 trade 页
        log(f"打开 {BASE_URL}/#/main/trade")
        page.goto(BASE_URL + "/#/main/trade", wait_until="domcontentloaded", timeout=30000)
        log("等待 Flutter 引擎 + CanvasKit (8s)...")
        page.wait_for_timeout(8000)

        path = os.path.join(OUT_DIR, "p1f06-spot-trade-indicators.png")
        page.screenshot(path=path, full_page=False)
        log(f"saved: {path} ({os.path.getsize(path)} bytes)")

        # 全屏截图
        path2 = os.path.join(OUT_DIR, "p1f06-spot-trade-full.png")
        page.screenshot(path=path2, full_page=True)
        log(f"saved: {path2} ({os.path.getsize(path2)} bytes)")

        log("=== 完成 ===")
        ctx.close()
        browser.close()


if __name__ == "__main__":
    main()
