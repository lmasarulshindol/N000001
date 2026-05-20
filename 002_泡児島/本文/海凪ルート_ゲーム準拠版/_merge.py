"""海凪ルート（ゲーム準拠版）の4分割ファイルを完成版に結合する。"""

from pathlib import Path

BASE = Path(__file__).parent
PARTS = [
    "01_上陸と砂浜.md",
    "02_三つの時間.md",
    "03_夜の誘いと前戯.md",
    "04_交わりと余韻.md",
]
OUT = BASE / "海凪ルート_完成版.md"


def main() -> None:
    chunks: list[str] = []
    for name in PARTS:
        path = BASE / name
        text = path.read_text(encoding="utf-8").rstrip()
        chunks.append(text)
    merged = "\n\n---\n\n".join(chunks) + "\n"
    OUT.write_text(merged, encoding="utf-8")
    char_count = len(merged.replace("\n", "").replace(" ", "").replace("　", ""))
    print(f"merged -> {OUT}")
    print(f"total characters (excluding whitespace): {char_count}")


if __name__ == "__main__":
    main()
