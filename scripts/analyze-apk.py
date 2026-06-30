"""Analyze APK structure by category."""
import zipfile
import os
from collections import defaultdict
from pathlib import Path

APK = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\android\app\build\outputs\apk\debug\app-debug.apk")

z = zipfile.ZipFile(APK)
groups = defaultdict(int)
file_count = defaultdict(int)
for info in z.infolist():
    if info.filename.startswith("lib/"):
        groups["lib (.so native)"] += info.file_size
    elif info.filename.startswith("assets/"):
        groups["assets (H5 + WebView)"] += info.file_size
    elif info.filename.startswith("res/"):
        groups["res (icons + drawables)"] += info.file_size
    elif info.filename.endswith(".dex"):
        groups["classes.dex (Java bytecode)"] += info.file_size
    elif info.filename.startswith("META-INF/"):
        groups["META-INF (signatures)"] += info.file_size
    else:
        groups["other (resources.arsc etc)"] += info.file_size
    cat = info.filename.split("/")[0]
    file_count[cat] += 1

print(f"APK: {APK.name}")
print(f"On-disk: {APK.stat().st_size/1024/1024:.2f} MB")
print("=" * 70)
print(f"  {'UNCOMP MB':>9}  {'COMP MB':>8}  CATEGORY")
print("-" * 70)
total_uncomp = 0
for k, v in sorted(groups.items(), key=lambda x: -x[1]):
    print(f"  {v/1024/1024:>9.2f}                {k}")
    total_uncomp += v
print("-" * 70)
print(f"  {total_uncomp/1024/1024:>9.2f}                TOTAL uncompressed inside APK")
print(f"  {APK.stat().st_size/1024/1024:>9.2f}                on-disk after compression")
print()
print("Top file count categories:")
for k, v in sorted(file_count.items(), key=lambda x: -x[1])[:8]:
    print(f"  {v:6d}  {k}")

# Specific H5 assets check
h5_html = sum(1 for n in z.namelist() if n.startswith("assets/public/") and n.endswith(".html"))
h5_js = sum(1 for n in z.namelist() if n.startswith("assets/public/_next/static/") and (n.endswith(".js") or n.endswith(".css")))
h5_total_size = sum(info.file_size for info in z.infolist() if info.filename.startswith("assets/public/"))
print()
print("=" * 70)
print("H5 static assets inside APK:")
print(f"  {h5_total_size/1024/1024:.2f} MB   assets/public/ (H5 + JS chunks + CSS + images)")
print(f"  {h5_html:6d}   HTML pages")
print(f"  {h5_js:6d}   JS/CSS chunks in _next/static/")
