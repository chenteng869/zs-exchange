"""
ZS Exchange v4 → v5 Premium Slate 颜色升级脚本
将硬编码的 v4 颜色替换为 v5 Premium Slate 高级感色系

v4 → v5 映射：
  #050B1A  →  #0A0E1A  主背景：去掉纯黑感，加蓝调
  #0B1220  →  #111827  二级背景：中石板
  #0F172A  →  #131826  表格表头
  #111827  →  #161B2C  卡片：精致提升
  #1E293B  →  #232940  边框
  #334155  →  #2D3548  次级边框
  #F8FAFC  →  #F1F5F9  主文字：柔白
  #E2E8F0  →  #E8ECF4  强调文字

仅升级设计系统：v4 → v5
保留：所有品牌色 (#1677FF 等)、涨/跌色、警示色
"""
import os
import re

COLOR_MAP = {
    '#050B1A': '#0A0E1A',
    '#0B1220': '#111827',
    '#0F172A': '#131826',
    '#111827': '#161B2C',
    '#1E293B': '#232940',
    '#334155': '#2D3548',
    '#F8FAFC': '#F1F5F9',
    '#E2E8F0': '#E8ECF4',
}

PATTERNS = [
    (re.compile(re.escape(k), re.IGNORECASE), v) for k, v in COLOR_MAP.items()
]

# 升级范围：官网/首页相关组件
TARGET_DIRS = [
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\app\HomepageContent.tsx',
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\components\home',
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\components\layout',
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\components\differentiation',
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\components\trading',
]

def replace_in_file(path: str) -> int:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    total = 0
    for pattern, replacement in PATTERNS:
        new_content, count = pattern.subn(replacement, content)
        if count > 0:
            content = new_content
            total += count
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    return total

def main():
    total_files = 0
    total_replacements = 0
    for target in TARGET_DIRS:
        if os.path.isfile(target):
            count = replace_in_file(target)
            if count > 0:
                total_files += 1
                total_replacements += count
                print(f'  ✓ {os.path.basename(target)}: {count} 处')
        else:
            for root, dirs, files in os.walk(target):
                for file in files:
                    if not (file.endswith('.tsx') or file.endswith('.ts')):
                        continue
                    fp = os.path.join(root, file)
                    count = replace_in_file(fp)
                    if count > 0:
                        total_files += 1
                        total_replacements += count
                        print(f'  ✓ {file}: {count} 处')
    print(f'\n总计：{total_files} 个文件，{total_replacements} 处颜色升级')

if __name__ == '__main__':
    main()
