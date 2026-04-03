import os
import glob

base_dir = os.path.dirname(os.path.abspath(__file__))

scene_order = [
    os.path.join(base_dir, "シーン1_2.md"),
    os.path.join(base_dir, "シーン3_4.md"),
    os.path.join(base_dir, "シーン5_6.md"),
    os.path.join(base_dir, "シーン7.md"),
]

output_path = os.path.join(base_dir, "EP1_完成版.md")

with open(output_path, "w", encoding="utf-8") as out:
    out.write("# EP1「南風の楽園」\n\n")
    for i, f in enumerate(scene_order):
        if not os.path.exists(f):
            print(f"WARNING: {f} not found!")
            continue
        with open(f, "r", encoding="utf-8") as infile:
            content = infile.read().strip()
            lines = content.split("\n")
            if lines and lines[0].startswith("# "):
                lines = lines[1:]
                content = "\n".join(lines).strip()
            out.write(content)
            out.write("\n\n")
            if i < len(scene_order) - 1:
                out.write("---\n\n")

print(f"Combined {len(scene_order)} files into {output_path}")
total = 0
with open(output_path, "r", encoding="utf-8") as f:
    text = f.read()
    total = len(text.replace(" ", "").replace("\n", ""))
print(f"Total characters (excluding spaces/newlines): {total}")
