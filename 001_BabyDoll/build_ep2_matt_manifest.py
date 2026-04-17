"""EP2_音声台本_マットプレイ.md から全50行のバッチ用 JSON を生成する。"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "EP2_音声台本_マットプレイ.md"
_OUT_ROOT = Path(__file__).resolve().parents[3]
OUT_JSON = (
    _OUT_ROOT
    / "001_声優・音声"
    / "Irodori-Studio"
    / "Irodori-TTS"
    / "scripts"
    / "examples"
    / "babydoll_ep2_matt.json"
)

STEM: dict[str, str] = {
    "莉子": (
        "【話者固定】10歳の少女。やや高めで明瞭な子供の声質。BabyDollキャスト佐藤莉子。"
        "このセリフの演技: "
    ),
    "健吾": (
        "【話者固定】30代前半の男性。やや低めで疲労感のある声質。感情は抑えがち。"
        "このセリフの演技: "
    ),
}

STRIP_PREFIXES = [
    r"^30代前半の男性の声。",
    r"^30代前半の男性の",
    r"^少女の声で、",
    r"^少女のやや高い声で、",
    r"^少女のやや高めの声で、",
    r"^少女の明るい声で、",
    r"^少女の甘い声で、",
    r"^少女のやわらかい声で、",
    r"^少女の細い声で、",
    r"^少女の震える声で、",
    r"^少女の掠れた声で、",
    r"^少女の途切れ途切れの声で、",
    r"^少女の小さな声で、",
    r"^少女の真っ直ぐな声で、",
]


def _strip_prefix(caption: str) -> str:
    s = caption.strip()
    for pat in STRIP_PREFIXES:
        s = re.sub(pat, "", s, count=1)
    return s.strip() or caption.strip()


def parse_table_rows(md: str) -> list[tuple[int, str, str, str]]:
    rows: list[tuple[int, str, str, str]] = []
    for line in md.splitlines():
        line = line.rstrip()
        if not line.startswith("|"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 5:
            continue
        num_s = parts[1]
        if not num_s.isdigit():
            continue
        num = int(num_s)
        char = parts[2]
        text = parts[3]
        cap = parts[4]
        rows.append((num, char, text, cap))
    return rows


def main() -> None:
    md = MD_PATH.read_text(encoding="utf-8")
    parsed = parse_table_rows(md)
    parsed.sort(key=lambda x: x[0])

    if len(parsed) != 50:
        raise SystemExit(f"expected 50 rows (001-050), got {len(parsed)}")

    items: list[dict[str, str]] = []
    for num, char, text, raw_cap in parsed:
        if char not in STEM:
            raise SystemExit(f"unknown character {char!r} at line {num}")
        nuance = _strip_prefix(raw_cap)
        caption = STEM[char] + nuance
        rel = f"outputs/babydoll_ep2_matt/{num:03d}_{char}.wav"
        items.append({"text": text, "caption": caption, "output_wav": rel})

    cfg = {
        "hf_checkpoint": "Aratako/Irodori-TTS-500M-v2-VoiceDesign",
        "model_device": "cpu",
        "codec_device": "cpu",
        "codec_repo": "Aratako/Semantic-DACVAE-Japanese-32dim",
        "model_precision": "fp32",
        "codec_precision": "fp32",
        "codec_deterministic_encode": True,
        "codec_deterministic_decode": True,
        "enable_watermark": False,
        "compile_model": False,
        "compile_dynamic": False,
        "num_steps": 20,
        "seed": 20260417,
        "no_ref": True,
        "caption": None,
        "items": items,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_JSON} ({len(items)} items)")


if __name__ == "__main__":
    main()
