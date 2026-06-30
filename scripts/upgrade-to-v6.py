"""
v6 Royal Premium 自动化色彩替换脚本
- 主页/差异化组件/统计/行情等组件
- 升级 v5 → v6 配色
"""
import os
import re
from pathlib import Path

ROOT = Path(r"d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01")

# 目标目录
TARGET_DIRS = [
    ROOT / "src" / "components" / "home",
    ROOT / "src" / "components" / "layout",
    ROOT / "src" / "components" / "differentiation",
    ROOT / "src" / "components" / "ui",
    ROOT / "src" / "app",
]

# 颜色替换映射（v5 → v6 Royal Premium）
COLOR_MAP = {
    # 主背景：石板黑 → 午夜皇家蓝
    '#0A0E1A': '#0B1124',
    # 二级背景
    '#111827': '#0F1830',
    # 三级背景（卡片）
    '#161B2C': '#131A2E',
    # 四级背景（悬浮层）
    '#1C2235': '#1A2240',
    # 表格表头
    '#131826': '#101729',
    # 边框 - 精致 → 金属质感
    '#232940': '#2A3556',
    # 次级边框
    '#2D3548': '#374161',
    # K线网格
    '#1F2536': '#1F2842',
    # 文字主色 - 柔白 → 雪白
    '#F1F5F9': '#F8FAFC',
    # 文字强调
    '#E8ECF4': '#FFFFFF',
}

# 透明背景替换
TRANSPARENT_MAP = {
    'rgba(5, 11, 26, 0.95)': 'rgba(11, 17, 36, 0.92)',
    'rgba(5, 11, 26, 0.80)': 'rgba(11, 17, 36, 0.78)',
    'rgba(22, 27, 44, 0.92)': 'rgba(19, 26, 46, 0.95)',
    'rgba(17, 24, 39, 0.96)': 'rgba(15, 24, 48, 0.98)',
    'rgba(17, 24, 39, 0.95)': 'rgba(15, 24, 48, 0.95)',
    'rgba(11, 18, 32, 0.98)': 'rgba(11, 17, 36, 0.98)',
    'rgba(11, 18, 32, 0.96)': 'rgba(11, 17, 36, 0.96)',
    'rgba(11, 18, 32, 0.95)': 'rgba(11, 17, 36, 0.95)',
    'rgba(30, 41, 59, 0.6)': 'rgba(42, 53, 86, 0.5)',
    'rgba(30, 41, 59, 0.4)': 'rgba(42, 53, 86, 0.4)',
}

# 主题：金色按钮 vs 蓝色按钮
# 渐变主按钮 #1677FF → 改为 金色
PRIMARY_BUTTON_GRADIENT = (
    "background: '#1677FF'",
    "background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)'"
)

# 完整合并：所有替换
ALL_REPLACEMENTS = {**COLOR_MAP, **TRANSPARENT_MAP}


def replace_in_file(path: Path) -> int:
    """替换文件中的颜色"""
    try:
        text = path.read_text(encoding='utf-8')
    except Exception as e:
        print(f"  ! 无法读取 {path.name}: {e}")
        return 0

    original = text
    count = 0
    for old, new in ALL_REPLACEMENTS.items():
        if old in text:
            occurrences = text.count(old)
            text = text.replace(old, new)
            count += occurrences

    if text != original:
        try:
            path.write_text(text, encoding='utf-8')
            return count
        except Exception as e:
            print(f"  ! 无法写入 {path.name}: {e}")
            return 0
    return 0


def main():
    print("=" * 60)
    print("v6 Royal Premium Auto Color Replacement")
    print("=" * 60)

    total_files = 0
    total_replacements = 0

    for target_dir in TARGET_DIRS:
        if not target_dir.exists():
            print(f"\n[SKIP] {target_dir.relative_to(ROOT)} not exists")
            continue

        print(f"\n[SCAN] {target_dir.relative_to(ROOT)}")

        # 扫描 .tsx 和 .ts 文件
        for ext in ['*.tsx', '*.ts']:
            for path in target_dir.rglob(ext):
                if 'node_modules' in str(path):
                    continue

                n = replace_in_file(path)
                if n > 0:
                    print(f"  [OK] {path.relative_to(ROOT)}  replaced {n} places")
                    total_files += 1
                    total_replacements += n

    print("\n" + "=" * 60)
    print(f"DONE: {total_files} files, {total_replacements} color replacements")
    print("=" * 60)


if __name__ == '__main__':
    main()
