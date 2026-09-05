#!/usr/bin/env python3
"""
莉子ロールプレイ001 SDバッチ画像生成スクリプト

使用API: AUTOMATIC1111 WebUI (stable-diffusion-webui)
エンドポイント: http://127.0.0.1:7860
"""

import json
import sys
import base64
import time
import argparse
from pathlib import Path
from urllib import request, error

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

API_URL = "http://127.0.0.1:7860"
SCRIPT_DIR = Path(__file__).parent
PROMPTS_JSON = SCRIPT_DIR / "generated_images" / "SD_prompts_batch_riko_roleplay_001.json"
OUTPUT_DIR = SCRIPT_DIR / "generated_images" / "riko_roleplay_001"


def call_txt2img(payload: dict, api_url: str = API_URL) -> list[bytes]:
    """AUTOMATIC1111 APIでtxt2imgを呼び出し、画像バイトリストを返す"""
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{api_url}/sdapi/v1/txt2img",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = request.urlopen(req, timeout=600)
    result = json.loads(resp.read().decode("utf-8"))
    return [base64.b64decode(img) for img in result["images"]]


def generate_from_json(
    json_path: Path = PROMPTS_JSON,
    output_dir: Path = OUTPUT_DIR,
    api_url: str = API_URL,
    start_job: int = 0,
    end_job: int | None = None,
    dry_run: bool = False,
):
    """JSONファイルからバッチ生成"""
    with open(json_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    defaults = config.get("defaults", {})
    jobs = config.get("jobs", [])

    if end_job is not None:
        jobs = jobs[start_job:end_job]
    else:
        jobs = jobs[start_job:]

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"=== 莉子ロールプレイ001 SD画像生成 ===")
    print(f"API: {api_url}")
    print(f"出力先: {output_dir}")
    print(f"ジョブ数: {len(jobs)}")
    print(f"バッチサイズ: {defaults.get('batch_size', 1)} (各シーン5枚)")
    print("=" * 50)

    total_generated = 0
    total_errors = 0

    for idx, job in enumerate(jobs):
        job_id = job.get("id", f"job_{idx}")
        filename_prefix = job.get("filename_prefix", job_id)

        # defaults と job をマージ
        payload = {**defaults}
        prompt = job.get("prompt", "")
        negative = job.get("negative_prompt", defaults.get("negative_prompt", ""))

        # prefix/negativeの結合
        prompt_prefix = defaults.get("prompt_prefix", "")
        if prompt_prefix:
            prompt = f"{prompt_prefix}, {prompt}"

        payload["prompt"] = prompt
        payload["negative_prompt"] = negative
        # override_settingsを維持
        if "override_settings" in defaults:
            payload["override_settings"] = defaults["override_settings"]
        if "override_settings_restore_afterwards" in defaults:
            payload["override_settings_restore_afterwards"] = defaults["override_settings_restore_afterwards"]

        print(f"\n[{idx + 1}/{len(jobs)}] {job_id}")
        print(f"  Prompt: {prompt[:80]}...")

        if dry_run:
            print(f"  [DRY RUN] スキップ")
            continue

        try:
            images = call_txt2img(payload, api_url)
            for img_idx, img_data in enumerate(images):
                out_file = output_dir / f"{filename_prefix}_{img_idx + 1:02d}.png"
                out_file.write_bytes(img_data)
                print(f"  -> {out_file.name}")
                total_generated += 1
        except error.URLError as e:
            print(f"  ERROR: {e}")
            total_errors += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            total_errors += 1

        time.sleep(0.5)

    print("\n" + "=" * 50)
    print(f"完了: {total_generated} 枚生成, {total_errors} エラー")
    print(f"出力先: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="莉子ロールプレイ001 SD画像生成")
    parser.add_argument("--api-url", default=API_URL, help=f"API URL (default: {API_URL})")
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR, help="出力ディレクトリ")
    parser.add_argument("--start", type=int, default=0, help="開始ジョブ番号")
    parser.add_argument("--end", type=int, default=None, help="終了ジョブ番号")
    parser.add_argument("--dry-run", action="store_true", help="APIを呼ばずに確認のみ")
    args = parser.parse_args()

    generate_from_json(
        json_path=PROMPTS_JSON,
        output_dir=args.output,
        api_url=args.api_url,
        start_job=args.start,
        end_job=args.end,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
