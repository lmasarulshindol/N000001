import os
import glob

base_dir = os.path.dirname(os.path.abspath(__file__))
scene_files = sorted(glob.glob(os.path.join(base_dir, "シーン*.md")))

output_path = os.path.join(base_dir, "EP1_完成版.md")

with open(output_path, "w", encoding="utf-8") as out:
    out.write("# EP1「鳥籠の白鍵」\n\n")
    for i, f in enumerate(scene_files):
        with open(f, "r", encoding="utf-8") as infile:
            content = infile.read().strip()
            lines = content.split("\n")
            if lines and lines[0].startswith("# "):
                lines = lines[1:]
                content = "\n".join(lines).strip()
            out.write(content)
            out.write("\n\n")
            if i < len(scene_files) - 1:
                out.write("---\n\n")

print(f"Combined {len(scene_files)} files into {output_path}")
total = 0
with open(output_path, "r", encoding="utf-8") as f:
    text = f.read()
    total = len(text.replace(" ", "").replace("\n", ""))
print(f"Total characters (excluding spaces/newlines): {total}")
