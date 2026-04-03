import os

base = os.path.dirname(os.path.abspath(__file__))

files = [
    os.path.join(base, 'EP0_シーン1_2.md'),
    os.path.join(base, 'EP0_シーン3_4.md'),
    os.path.join(base, 'EP0_シーン5_6.md'),
]

header = '# EP0「南の島の子犬」\n\n'

parts = []
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        parts.append(fh.read().strip())

separator = '\n\n---\n\n'
body = separator.join(parts)
result = header + body + '\n'

out = os.path.join(base, '..', 'EP0_本文.md')
out = os.path.normpath(out)
with open(out, 'w', encoding='utf-8') as fh:
    fh.write(result)

chars = len(result.replace('\n', '').replace(' ', '').replace('　', ''))
lines = result.count('\n') + 1
print(f'完了！ 出力先: {out}')
print(f'総行数: {lines}行 / 文字数(空白除く): 約{chars}字')
