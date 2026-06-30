"""
ZS Exchange V1.0 颜色批量替换脚本
将所有 admin 页面（及其他页面）中硬编码的旧 Ant Design 颜色
替换为《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》定义的新色系。

旧 Ant Design 4.x 配色 → V1.0 新色系映射：
  #1890ff  →  #1677FF   主品牌色（电光蓝）
  #1890FF  →  #1677FF   大小写不敏感
  #52c41a  →  #16A34A   后台成功绿（V1.0 7.3）
  #52C41A  →  #16A34A
  #fa8c16  →  #F59E0B   警告橙
  #FA8C16  →  #F59E0B
  #faad14  →  #F59E0B   警告金
  #FAAD14  →  #F59E0B
  #722ed1  →  #7C3AED   Web3 紫
  #722ED1  →  #7C3AED
  #f5222d  →  #DC2626   后台错误红
  #F5222D  →  #DC2626
  #ff4d4f  →  #DC2626   错误红亮
  #FF4D4F  →  #DC2626
  #cf1322  →  #B91C1C   错误红暗
  #CF1322  →  #B91C1C
  #13c2c2  →  #06B6D4   信息青
  #13C2C2  →  #06B6D4
  #eb2f96  →  #EC4899   洋红
  #EB2F96  →  #EC4899
  #aaa     →  #6B7280   （保留通用灰）
"""
import os
import re
import sys

# 颜色映射（key 不区分大小写，value 保持大写）
COLOR_MAP = {
    '#1890ff': '#1677FF',
    '#52c41a': '#16A34A',
    '#fa8c16': '#F59E0B',
    '#faad14': '#F59E0B',
    '#722ed1': '#7C3AED',
    '#f5222d': '#DC2626',
    '#ff4d4f': '#DC2626',
    '#cf1322': '#B91C1C',
    '#13c2c2': '#06B6D4',
    '#eb2f96': '#EC4899',
}

# 构建正则（不区分大小写）
PATTERNS = [
    (re.compile(re.escape(k), re.IGNORECASE), v) for k, v in COLOR_MAP.items()
]

# 范围：仅 admin + 其他可能使用硬编码颜色的页面
TARGET_DIRS = [
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\app\admin',
    r'd:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\src\app\HomepageContent.tsx',
]

# 排除：components 目录（已有 V1.0 设计的不要再改）
EXCLUDE_DIR_NAMES = {'components'}

def should_process(path: str) -> bool:
    """仅处理 .tsx/.ts 文件"""
    if not (path.endswith('.tsx') or path.endswith('.ts')):
        return False
    parts = path.replace('\\', '/').split('/')
    for exclude in EXCLUDE_DIR_NAMES:
        if exclude in parts:
            return False
    return True

def replace_in_file(path: str) -> int:
    """替换单个文件中的颜色，返回替换次数"""
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
            if should_process(target):
                count = replace_in_file(target)
                if count > 0:
                    total_files += 1
                    total_replacements += count
                    print(f'  ✓ {os.path.basename(target)}: {count} 处')
        else:
            for root, dirs, files in os.walk(target):
                # 排除特定子目录
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIR_NAMES]
                for file in files:
                    fp = os.path.join(root, file)
                    if should_process(fp):
                        count = replace_in_file(fp)
                        if count > 0:
                            total_files += 1
                            total_replacements += count
                            print(f'  ✓ {file}: {count} 处')
    print(f'\n总计：{total_files} 个文件，{total_replacements} 处颜色替换')

if __name__ == '__main__':
    main()
