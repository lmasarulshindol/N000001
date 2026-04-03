import re

files = [
    r'シーン1_2.md',
    r'シーン3_4.md',
    r'シーン5_6.md',
    r'シーン7_8.md',
]

parts = []
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read().strip()
        content = re.sub(r'^#\s+EP1.*\n*', '', content)
        parts.append(content)

header = '# EP1「ベビードールの初恋」\n\n'
separator = '\n\n---\n\n'
result = header + separator.join(parts)

out = r'EP1_完成版.md'
with open(out, 'w', encoding='utf-8') as fh:
    fh.write(result)

lines = result.count('\n') + 1
chars = len(result.replace('\n', '').replace(' ', '').replace('　', ''))
print(f'完了！ 総行数: {lines}行 / 文字数(空白除く): 約{chars}字')
