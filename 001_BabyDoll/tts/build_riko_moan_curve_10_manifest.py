#!/usr/bin/env python3
"""莉子・喘ぎカーブ10段階（15秒×2）TTSマニフェスト生成。"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MD = ROOT / "莉子_喘ぎカーブ10段階_TTS.md"
OUT = ROOT / "riko_moan_curve_10_manifest.json"
WAV_DIR = "outputs/babydoll/riko_moan_curve_10"

VOICE = (
    "やや高めの幼い声の少女。"
    "ドライな近接マイク。デッドな収録。エコーなし。リバーブなし。余響なし。部屋鳴りなし。"
    "口元のすぐ近く。"
)


def parse_table(md: str) -> list[dict]:
    items: list[dict] = []
    in_table = False
    for line in md.splitlines():
        if line.startswith("| # | stage |"):
            in_table = True
            continue
        if not in_table:
            continue
        if not line.startswith("|"):
            if items:
                break
            continue
        if re.match(r"^\|\s*-+", line):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) < 5:
            continue
        idx, stage, seconds, text, caption = parts[:5]
        if not idx.isdigit():
            continue
        n = int(idx)
        # stage は ASCII slug（例: 06a_accelerate）
        slug = stage if re.fullmatch(r"[0-9a-zA-Z_]+", stage) else f"s{n:02d}"
        items.append(
            {
                "line_index": n,
                "stage": stage,
                "text": text,
                "caption": caption,
                "seconds": float(seconds),
                "output_wav": f"{WAV_DIR}/moan_{n:02d}_{slug}.wav",
            }
        )
    return items


def main() -> None:
    md = MD.read_text(encoding="utf-8")
    items = parse_table(md)
    if len(items) != 20:
        raise SystemExit(f"expected 20 rows, got {len(items)}")
    data = {
        "title": "莉子 喘ぎカーブ10段階×15秒×2（デッド近接・後半加速）",
        "episode": "riko_moan_curve_10",
        "character": "riko",
        "caption": VOICE,
        "hf_checkpoint": "Aratako/Irodori-TTS-500M-v2-VoiceDesign",
        "model_device": "cuda",
        "codec_device": "cuda",
        "codec_repo": "Aratako/Semantic-DACVAE-Japanese-32dim",
        "model_precision": "fp32",
        "codec_precision": "fp32",
        "num_steps": 40,
        "seed": 20260905,
        "cfg_scale_text": 3.0,
        "cfg_scale_caption": 6.5,
        "no_ref": True,
        "seconds": 15.0,
        "trim_tail": True,
        "tail_std_threshold": 0.11,
        "line_count": len(items),
        "items": items,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} -> {OUT}")


if __name__ == "__main__":
    main()
