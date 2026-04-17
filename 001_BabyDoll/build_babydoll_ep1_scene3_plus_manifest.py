"""EP1_音声台本.md からシーン3以降（050〜233）のバッチ用 JSON を生成する。

声質のブレを抑えるため、各キャラごとに「話者ステム」を固定し、行ごとの演技差分だけを後ろに付ける。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MD_PATH = ROOT / "EP1_音声台本.md"
# work2/001_声優・音声/Irodori-Studio/Irodori-TTS/...（このファイルは 001_BabyDoll 直下）
_OUT_ROOT = Path(__file__).resolve().parents[3]
OUT_JSON = (
    _OUT_ROOT
    / "001_声優・音声"
    / "Irodori-Studio"
    / "Irodori-TTS"
    / "scripts"
    / "examples"
    / "babydoll_ep1_scene3_plus.json"
)

# 同一キャラでは先頭を一字一句固定（VoiceDesign の話者埋め込みを安定させる）
STEM: dict[str, str] = {
    "健吾": (
        "【話者固定】30代前半の男性。やや低めで疲労感のある声質。感情は抑えがち。"
        "このセリフの演技: "
    ),
    "莉子": (
        "【話者固定】10歳の少女。やや高めで明瞭な子供の声質。BabyDollキャスト佐藤莉子。"
        "このセリフの演技: "
    ),
    "楓": (
        "【話者固定】12歳の少女。中高域でサバサバした軽い口調。同僚キャスト楓。"
        "このセリフの演技: "
    ),
    "莉子（LINE）": (
        "【話者固定】10歳の少女。やや高めで明瞭な子供の声質。LINEの文面を読む口調。"
        "このセリフの演技: "
    ),
    "母（LINE）": (
        "【話者固定】30代後半の女性。穏やかで少し弱げな優しい声質。莉子の母。"
        "このセリフの演技: "
    ),
    "鈴ねえ（LINE）": (
        "【話者固定】10代後半の女性。軽快で面倒見のいい姉御はち。鈴ねえ。"
        "このセリフの演技: "
    ),
}


def _strip_redundant_caption_prefix(caption: str, char: str) -> str:
    """元キャプションから、話者ステムと重複する前置きを除いて演技メモだけに近づける。"""
    s = caption.strip()
    # よくある冗長プレフィックスを削除
    for pat in (
        r"^30代前半の男性の声。",
        r"^30代前半の男性の",
        r"^少女の声で、",
        r"^少女のやや高い声で、",
        r"^少女のやや高めの声で、",
        r"^少女の明るい声で、",
        r"^少女の甘い声で、",
        r"^少女のやわらかい声で、",
        r"^少女の細い声で、",
        r"^少女の細い高音で、",
        r"^少女の震える声で、",
        r"^少女の震える高音で、",
        r"^少女の掠れた声で、",
        r"^少女の途切れ途切れの声で、",
        r"^少女の小さい声で、",
        r"^少女の真っ直ぐな声で、",
        r"^少女の小さい声で、アイスを口に入れて。",
        r"^少女の声で、",
        r"^少女の明るい高音で、",
        r"^12歳の少女の声。",
        r"^10代後半の女性の声。",
        r"^30代後半の女性の声。",
    ):
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
        # | # | キャラ | Text | Caption |  → parts[1]=#, [2]=char, [3]=text, [4]=cap
        try:
            num_s = parts[1]
            if not num_s.isdigit():
                continue
            num = int(num_s)
        except (IndexError, ValueError):
            continue
        if num < 50 or num > 233:
            continue
        try:
            char = parts[2]
            text = parts[3]
            cap = parts[4]
        except IndexError:
            continue
        rows.append((num, char, text, cap))
    return rows


def main() -> None:
    md = MD_PATH.read_text(encoding="utf-8")
    parsed = parse_table_rows(md)
    parsed.sort(key=lambda x: x[0])
    if len(parsed) != 184:
        raise SystemExit(f"expected 184 rows (050-233), got {len(parsed)}")

    items: list[dict[str, str]] = []
    for num, char, text, raw_cap in parsed:
        if char not in STEM:
            raise SystemExit(f"unknown character {char!r} at line {num}")
        nuance = _strip_redundant_caption_prefix(raw_cap, char)
        caption = STEM[char] + nuance
        safe = char.split("（")[0]
        rel = f"outputs/babydoll_ep1_scene3_plus/{num:03d}_{safe}.wav"
        items.append(
            {
                "text": text,
                "caption": caption,
                "output_wav": rel,
            }
        )

    cfg = {
        "hf_checkpoint": "Aratako/Irodori-TTS-500M-v2-VoiceDesign",
        # 環境に合わせて cuda に変更可（同一マニフェストで再現性を揃える）
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
    OUT_JSON.write_text(
        json.dumps(cfg, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {OUT_JSON} ({len(items)} items)")


if __name__ == "__main__":
    main()
