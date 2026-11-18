"""本文の各パートを結合し、文字数を目標と比べて表示する。"""
import re
from pathlib import Path

BASE = Path(__file__).parent
TITLE = "# 現役ソープ嬢 星野ひより 22歳 AVデビュー（小説版）"
PARTS = [
    ("本文/00_プロローグ.md", 2000),
    ("本文/01_オープニングインタビュー.md", 6000),
    ("本文/02_1回目.md", 14500),
    ("本文/03_中間インタビュー.md", 2500),
    ("本文/04_2回目_前半.md", 9500),
    ("本文/05_2回目_後半.md", 9500),
    ("本文/06_終了後インタビュー.md", 3500),
]
OUTPUT = BASE / "本文/星野ひより_AVデビュー_完全版.md"


def count_chars(text: str) -> int:
    """空白と改行を除いた文字数を返す。"""
    return len(re.sub(r"\s", "", text))


def main() -> None:
    texts = []
    for name, target in PARTS:
        text = (BASE / name).read_text(encoding="utf-8").strip()
        texts.append(text)
        count = count_chars(text)
        print(f"{name}: {count:,}字（目標 {target:,}字、{count / target:.0%}）")
    OUTPUT.write_text(TITLE + "\n\n" + "\n\n---\n\n".join(texts) + "\n", encoding="utf-8")
    total = sum(count_chars(t) for t in texts)
    print(f"結合完了: {OUTPUT.name}（合計 {total:,}字）")


if __name__ == "__main__":
    main()
