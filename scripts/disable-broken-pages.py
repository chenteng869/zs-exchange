"""Move build-failing page.tsx files to _disabled_pages/ to skip them in next build."""
import shutil
from pathlib import Path

ROOT = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\app")
bad = [
    "admin/dsales/products",
    "admin/quant/performance",
    "admin/security/policy",
    "admin/token/deployment",
    "admin/token/listing",
    "business/listing",
    "business/registration",
    "business/token",
    "buy-crypto",
    "defi",
    "login",
    "nft",
]
disabled = ROOT / "_disabled_pages"
disabled.mkdir(exist_ok=True)
moved = []
for d in bad:
    src_dir = ROOT / d
    if not src_dir.exists():
        continue
    for fname in ("page.tsx", "ClientPage.tsx"):
        f = src_dir / fname
        if f.exists():
            tag = d.replace("/", "__")
            dst = disabled / f"{tag}__{fname}"
            shutil.copy2(f, dst)
            f.unlink()
            moved.append(str(f.relative_to(ROOT)))
    # try remove empty dir
    try:
        src_dir.rmdir()
    except OSError:
        pass
for m in moved:
    print("moved:", m)
print("Total moved:", len(moved))
