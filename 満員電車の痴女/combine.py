import os

base = os.path.dirname(os.path.abspath(__file__))
text_dir = os.path.join(base, '本文')

files = [
    os.path.join(text_dir, 'シーン1_2.md'),
    os.path.join(text_dir, 'シーン3_4.md'),
    os.path.join(text_dir, 'シーン5_6.md'),
    os.path.join(text_dir, 'シーン7_8_9.md'),
]

parts = []
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        parts.append(fh.read().strip())

separator = '\n\n---\n\n'
result = separator.join(parts)

out = os.path.join(text_dir, 'EP1_満員電車の痴女_完成版.md')
with open(out, 'w', encoding='utf-8') as fh:
    fh.write(result)

lines = result.count('\n') + 1
chars = len(result.replace('\n', '').replace(' ', '').replace('\u3000', ''))
print(f'完了！ 総行数: {lines}行 / 文字数(空白除く): 約{chars}字')
