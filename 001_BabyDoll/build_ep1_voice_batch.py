#!/usr/bin/env python3
"""EP1_音声台本.md から Irodori-TTS 用バッチ JSON を生成する。

使用例:
  py -3 build_ep1_voice_batch.py --scenes 1 -o batch_configs/babydoll_ep1_scene1.json
  py -3 build_ep1_voice_batch.py --scenes 1,2 -o batch_configs/babydoll_ep1_s12.json
  py -3 build_ep1_voice_batch.py --all -o batch_configs/babydoll_ep1_full.json

生成後、Irodori-TTS ディレクトリで:
  uv run python scripts/studio_batch_infer.py --config <生成JSONの絶対パス>

output_wav は Irodori-TTS ルートからの相対パス（outputs/babydoll_ep1/...）になる。
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def _scene_header_num(line: str) -> int | None:
    m = re.match(r"^###\s*シーン\s*(\d+)", line.strip())
    return int(m.group(1)) if m else None


def _parse_table_row(line: str) -> tuple[str, str, str, str] | None:
    """| # | キャラ | Text | Caption | の1行をパース。ヘッダー行は None。"""
    line = line.strip()
    if not line.startswith("|"):
        return None
    parts = [p.strip() for p in line.split("|")]
    # 先頭末尾の空（| で split すると両端に空が付くことが多い）
    parts = [p for p in parts if p != ""]
    if len(parts) < 4:
        return None
    num, char, text, caption = parts[0], parts[1], parts[2], parts[3]
    if num in ("#", "---", "--"):
        return None
    if num.lower() == "#":
        return None
    if not re.match(r"^\d{3}$", num):
        return None
    return num, char, text, caption


def parse_script(md_path: Path, scenes: set[int] | None) -> list[dict]:
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    current_scene: int | None = None
    rows: list[dict] = []

    for line in lines:
        sn = _scene_header_num(line)
        if sn is not None:
            current_scene = sn
            continue
        if current_scene is None:
            continue
        if scenes is not None and current_scene not in scenes:
            continue
        parsed = _parse_table_row(line)
        if parsed is None:
            continue
        num, char, t, cap = parsed
        rows.append(
            {
                "id": num,
                "scene": current_scene,
                "char": char,
                "text": t,
                "caption": cap,
            }
        )
    return rows


def build_items(rows: list[dict], out_dir: str) -> list[dict]:
    items = []
    for r in rows:
        wid = r["id"]
        # ファイル名に使えない文字を簡易サニタイズ
        char_safe = re.sub(r'[\\/:*?"<>|]', "_", r["char"])[:32]
        fname = f"{wid}_{char_safe}.wav"
        items.append(
            {
                "text": r["text"],
                "caption": r["caption"],
                "output_wav": f"{out_dir.rstrip('/')}/{fname}",
            }
        )
    return items


def default_batch_template() -> dict:
    return {
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
        "seed": None,
        "no_ref": True,
        "items": [],
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="BabyDoll EP1 音声台本からバッチ JSON を生成")
    ap.add_argument(
        "--script",
        type=Path,
        default=Path(__file__).resolve().parent / "EP1_音声台本.md",
        help="台本 Markdown のパス",
    )
    ap.add_argument(
        "--scenes",
        type=str,
        default="1",
        help="含めるシーン番号。カンマ区切り（例: 1,2）。--all で全シーン。",
    )
    ap.add_argument(
        "--all",
        action="store_true",
        help="全シーンを含める（--scenes より優先）",
    )
    ap.add_argument(
        "-o",
        "--output",
        type=Path,
        required=True,
        help="出力する JSON パス",
    )
    ap.add_argument(
        "--wav-dir",
        type=str,
        default="outputs/babydoll_ep1",
        help="Irodori-TTS ルートからの相対パス（WAV 保存先ディレクトリ）",
    )
    ap.add_argument(
        "--cuda",
        action="store_true",
        help="model_device / codec_device を cuda にする（GPU 利用時）",
    )
    args = ap.parse_args()

    if args.all:
        scene_set = None
    else:
        parts = [p.strip() for p in args.scenes.split(",") if p.strip()]
        scene_set = {int(x) for x in parts}

    rows = parse_script(args.script, scene_set)
    if not rows:
        raise SystemExit("パース結果が空です。--scenes や台本パスを確認してください。")

    cfg = default_batch_template()
    if args.cuda:
        cfg["model_device"] = "cuda"
        cfg["codec_device"] = "cuda"
    cfg["items"] = build_items(rows, args.wav_dir)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output} ({len(cfg['items'])} items)", flush=True)


if __name__ == "__main__":
    main()
