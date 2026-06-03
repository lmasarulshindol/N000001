"""
絵柄比較テスト — cut02（正常位・挿入）を3スタイルで生成
髪・アクセサリー問題修正、体位安定化版
"""

import json
import sys
import base64
import time
import random
from pathlib import Path
from urllib import request, error

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

API_URL = "http://127.0.0.1:7860"
OUTPUT_DIR = Path(__file__).parent / "test_style_compare"
IMAGES_PER_STYLE = 3

DEFAULT_PARAMS = {
    "steps": 30,
    "cfg_scale": 7.5,
    "width": 1216,
    "height": 832,
    "sampler_name": "DPM++ 2M SDE",
    "scheduler": "Karras",
    "seed": -1,
    "batch_size": 1,
    "n_iter": 1,
}

# ============================================================
# 莉子キャラブロック（修正版）
# - "pink blonde" → "light pink hair" に統一（混色防止）
# - アクセサリー/ヘアクリップを明示的に排除
# - 体型描写を簡潔に
# ============================================================
RIKO_CHAR = (
    "(1girl:1.3, loli, child, petite, short stature, small frame, "
    "flat chest, narrow hips, thin arms, thin legs, "
    "light pink hair:1.2, shoulder-length hair, wavy hair, soft hair ends, "
    "aqua blue eyes:1.1, long eyelashes, "
    "pale skin, fair skin, smooth skin, "
    "no hair ornament, no accessories)"
)

# 陽介ブロック（修正版）— muscular排除を強化
YOUSUKE_CHAR = (
    "(1boy:1.4, japanese man, handsome, kind eyes, gentle expression, "
    "black short hair, age 30s, average build, slim, "
    "completely nude, nude male, penis, erection, "
    "single male only:1.2)"
)

# ネガティブ（共通・大幅強化）
NEGATIVE = (
    # 品質
    "worst quality, low quality, bad quality, normal quality, oldest, very displeasing, "
    "bad anatomy, anatomical nonsense, bad proportions, bad perspective, "
    # 手指
    "extra fingers, missing fingers, fused fingers, too many fingers, "
    "poorly drawn hands, bad hands, "
    # 体パーツ
    "extra arms, extra legs, extra limbs, fused limbs, merged bodies, "
    "disembodied penis, floating penis without body, "
    # 髪・アクセ問題修正
    "hair ornament, hair clip, hairpin, hairband, headband, hair ribbon, "
    "x hair ornament, cross hair ornament, bandaid on face, bandaid, bandage, "
    "forehead mark, forehead jewel, bindi, tiara, crown, "
    "multicolored hair, gradient hair, streaked hair, blue hair, "
    # 人数
    "solo, 1girl solo, solo female, multiple boys, 2boys, 3boys, "
    "duplicate male, extra male, crowd, orgy, futanari, "
    # 検閲
    "censored, mosaic censorship, bar censor, blur censor, "
    # 不要な行為
    "anal sex, anal penetration, "
    # 断面
    "cross-section, x-ray, xray, uterus, womb, anatomy cutaway, "
    # 年齢体型ミス
    "mature woman, large breasts, medium breasts, tall girl, muscular girl, wide hips, "
    "old man, elderly, ugly bastard, bodybuilder, huge muscles, very muscular, "
    # 衣服ミス
    "clothed male, shirt, pants, shoes, "
    "blue bikini, cyan bikini, green bikini, aqua bikini, teal bikini, "
    # その他
    "jewelry, earrings, piercing, tattoo, collar, leash, "
    "watermark, signature, text, logo, username, artist name"
)

# ============================================================
# 体位プロンプト（正常位・挿入）— ポーズを1つに絞って安定化
# ============================================================
POSE_BLOCK = (
    "missionary position:1.3, vaginal sex, hetero sex, "
    "penis in pussy, penetration, insertion, "
    "girl lying on back on blue towel, legs apart, knees slightly bent, "
    "man on top, man between girl thighs, leaning forward on arms"
)

BG_BLOCK = (
    "white sand beach, blue beach towel, bright blue sky, "
    "turquoise ocean in far background, afternoon sun, warm sunlight, "
    "lens flare, shallow depth of field"
)

# ============================================================
# 3つの絵柄バリエーション
# ============================================================
STYLES = [
    {
        "id": "style_A_clean_anime",
        "name": "A: クリーンアニメ塗り（キービジュアル系）",
        "quality": (
            "masterpiece, best quality, absurdres, highres, "
            "anime coloring, cel shading, clean lines, sharp outlines, "
            "vibrant colors, studio anime quality, key visual, "
            "detailed eyes, detailed face"
        ),
        "expression": (
            "looking up at sky, half-lidded eyes, parted lips, light blush, "
            "slight sweat on forehead, relaxed expression, gentle gasp"
        ),
    },
    {
        "id": "style_B_doujin",
        "name": "B: 同人誌・エロゲCG風（肌テクスチャ重視）",
        "quality": (
            "masterpiece, best quality, absurdres, highres, "
            "game cg, visual novel cg, detailed skin texture, "
            "soft shading, gradient shading, glossy skin, "
            "detailed collarbone, detailed navel, skin pores, "
            "professional illustration"
        ),
        "expression": (
            "flushed face, blush across nose, teary eyes, half-open mouth, "
            "panting, sweat beads on body, sweat drops on stomach, "
            "toes curling slightly, fingers gripping towel"
        ),
    },
    {
        "id": "style_C_soft_lighting",
        "name": "C: ソフト光＋透明感（水彩風味）",
        "quality": (
            "masterpiece, best quality, absurdres, highres, "
            "soft lighting, backlighting, rim light, light particles, "
            "watercolor style edges, translucent skin effect, "
            "pastel tones, dreamy atmosphere, ethereal glow, "
            "chromatic aberration, bokeh"
        ),
        "expression": (
            "eyes slightly unfocused, dreamy expression, lips parted softly, "
            "single tear on cheek, gentle smile forming, peaceful pleasure, "
            "body slightly glistening, sun warming skin"
        ),
    },
]

CAMERA_VARIANTS = [
    "three-quarter view from side:1.2, medium shot, both bodies visible",
    "from above angle:1.2, looking down at girl's face, man's back visible",
    "low angle from side:1.2, emphasizing sky and bodies, wide framing",
]


def call_txt2img(positive: str, negative: str, width: int, height: int,
                 api_url: str = API_URL, **overrides) -> list[bytes]:
    payload = {**DEFAULT_PARAMS, **overrides}
    payload["prompt"] = positive
    payload["negative_prompt"] = negative
    payload["width"] = width
    payload["height"] = height
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


def run():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total = len(STYLES) * IMAGES_PER_STYLE
    done = 0

    print("=== 絵柄比較テスト（正常位・挿入） ===")
    print(f"スタイル数: {len(STYLES)}, 各{IMAGES_PER_STYLE}枚, 合計{total}枚")
    print("=" * 50)

    for style in STYLES:
        style_dir = OUTPUT_DIR / style["id"]
        style_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n[{style['id']}] {style['name']}")

        for i in range(IMAGES_PER_STYLE):
            cam = CAMERA_VARIANTS[i % len(CAMERA_VARIANTS)]

            positive = (
                f"{style['quality']}, "
                "uncensored, explicit, 2people, hetero, age difference, exactly two people, "
                f"{RIKO_CHAR}, "
                f"white triangle string bikini pulled aside, "
                f"{YOUSUKE_CHAR}, "
                f"{POSE_BLOCK}, "
                f"{style['expression']}, "
                f"{BG_BLOCK}, "
                f"{cam}"
            )

            out_file = style_dir / f"{style['id']}_{i+1:02d}.png"

            if out_file.exists():
                print(f"  [{i+1}/{IMAGES_PER_STYLE}] スキップ: {out_file.name}")
                done += 1
                continue

            print(f"  [{i+1}/{IMAGES_PER_STYLE}] 生成中...", end="", flush=True)
            try:
                images = call_txt2img(
                    positive, NEGATIVE,
                    DEFAULT_PARAMS["width"], DEFAULT_PARAMS["height"],
                    seed=random.randint(0, 2**32 - 1),
                )
                out_file.write_bytes(images[0])
                print(f" OK -> {out_file.name}")
                done += 1
            except error.URLError as e:
                print(f" ERROR: {e}")
            except Exception as e:
                print(f" ERROR: {e}")
            time.sleep(0.5)

    print(f"\n{'=' * 50}")
    print(f"完了: {done}/{total}")


if __name__ == "__main__":
    run()
