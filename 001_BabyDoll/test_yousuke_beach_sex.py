"""
莉子4作目 DAY1 シーン2 — 陽介（おにいさん）との砂浜H
ストーリー沿いの性行為カットを 4 種 × 各 3 枚でテスト生成する。
スタイル: B（同人誌・エロゲCG風）固定

使用API: AUTOMATIC1111 / Forge (http://127.0.0.1:7860)
"""

import json
import sys
import base64
import time
import random
import argparse
from pathlib import Path
from urllib import request, error

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

API_URL = "http://127.0.0.1:7860"
OUTPUT_DIR = Path(__file__).parent / "test_out_yousuke_beach_v6"
IMAGES_PER_CUT = 3

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
# スタイルB固定: 同人誌・エロゲCG風
# ============================================================
QUALITY = (
    "masterpiece, best quality, absurdres, highres, "
    "game cg, visual novel cg, detailed skin texture, "
    "soft shading, gradient shading, glossy skin, "
    "detailed collarbone, detailed navel, "
    "professional illustration, uncensored, explicit, "
    "2people, hetero, age difference, exactly two people"
)

# ============================================================
# 莉子キャラブロック（修正版: 髪アクセ排除、色安定）
# ============================================================
RIKO = (
    "(1girl:1.3, loli, child, petite, short stature, small frame, "
    "flat chest, narrow hips, thin arms, thin legs, "
    "light pink hair:1.2, shoulder-length hair, wavy hair, hair down:1.1, "
    "hair falling naturally, hair not sticking up, "
    "aqua blue eyes:1.1, both eyes visible, symmetrical eyes, detailed eyes, "
    "long eyelashes, normal round pupils, "
    "small human ears, ears visible, "
    "pale skin, fair skin, smooth skin, "
    "no hair ornament, no accessories)"
)

# 陽介ブロック（30代・普通体格・優しい顔）
YOUSUKE = (
    "(1boy:1.4, japanese man, handsome, kind eyes, gentle expression, "
    "black short hair, age 30s, average build, slim, "
    "completely nude, nude male, penis, erection, "
    "single male only:1.2)"
)

BEACH_BG = (
    "white sand beach, blue beach towel, bright blue sky, "
    "turquoise ocean in far background, afternoon sun, warm sunlight, "
    "shallow depth of field"
)

# ネガティブ（体位違反防止 + 表情・顔パーツ安定化）
NEGATIVE_BASE = (
    # 品質
    "worst quality, low quality, bad quality, normal quality, oldest, very displeasing, "
    "bad anatomy, anatomical nonsense, bad proportions, bad perspective, "
    # 手指
    "extra fingers, missing fingers, fused fingers, too many fingers, "
    "poorly drawn hands, bad hands, "
    # 体パーツ
    "extra arms, extra legs, extra limbs, fused limbs, merged bodies, "
    "disembodied penis, floating penis without body, "
    # 顔・目の崩壊防止
    "deformed eyes, asymmetric eyes, mismatched eyes, crushed eyes, "
    "missing eye, extra eyes, one eye closed unintentionally, "
    "poorly drawn eyes, melting eyes, fused eyes, "
    "deformed pupils, no pupils, empty eyes, "
    # 耳の崩壊防止 + 獣耳防止
    "deformed ears, missing ears, extra ears, misplaced ears, "
    "elf ears, pointy ears, animal ears, cat ears, fox ears, dog ears, "
    "bunny ears, kemonomimi, nekomimi, ear fluff, "
    "poorly drawn ears, melting ears, ears too high, ears too low, "
    "hair antenna, ahoge, hair sticking up, hair tufts on top of head, "
    # アヘ顔・舌出し禁止
    "ahegao, rolling eyes, rolled eyes, eyes rolled back, "
    "tongue out, tongue sticking out, long tongue, drooling excessively, "
    "crazy expression, insane expression, mindbreak, heart-shaped pupils, "
    "excessive drool, saliva waterfall, "
    # 髪・アクセ
    "hair ornament, hair clip, hairpin, hairband, headband, hair ribbon, "
    "x hair ornament, cross hair ornament, bandaid on face, bandaid, bandage, "
    "forehead mark, forehead jewel, bindi, tiara, crown, "
    "multicolored hair, gradient hair, streaked hair, blue hair, "
    # 人数
    "solo, 1girl solo, solo female, multiple boys, 2boys, 3boys, "
    "duplicate male, extra male, crowd, orgy, futanari, "
    # 検閲
    "censored, mosaic censorship, bar censor, blur censor, "
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
    "lens flare, light leaks, chromatic aberration, "
    "watermark, signature, text, logo, username, artist name"
)

# 体位別ネガティブ追記（指定外の体位を明示排除）
NEG_NOT_MISSIONARY = (
    "doggy style, all fours, from behind, bent over, "
    "cowgirl position, girl on top, riding, reverse cowgirl, "
    "standing sex, standing position, "
    "side position, spooning, lateral, "
    "sitting position, lap sitting, "
    "prone bone, face down"
)

NEG_NOT_STANDING = (
    "lying down, on back, missionary, on bed, "
    "doggy style, all fours, bent over, "
    "cowgirl position, girl on top, riding"
)

# ============================================================
# カット定義 — 体位を高ウェイトで明示 + 他体位をネガに追加
# ============================================================
CUTS = [
    {
        "id": "cut01_shallow_foreplay",
        "name": "浅瀬・キスとビキニの下（挿入前）",
        "prompt": (
            f"{QUALITY}, "
            f"{RIKO}, "
            "white triangle string bikini, wet white bikini, "
            f"{YOUSUKE}, "
            "standing in shallow ocean:1.3, waist deep water, "
            "man holding girl up in water, lifting her, "
            "french kiss:1.2, tongue kiss, saliva strand, "
            "man's hand under bikini bottom touching pussy, "
            "girl blushing, flushed ears, half-lidded eyes looking up, "
            "parted lips, panting, surprised pleasure, "
            "sweat mixed with seawater on skin, wet hair clinging to neck, "
            "white bikini top soaked see-through, nipples visible through fabric, "
            "not penetrated yet, foreplay, intimate touch, "
            f"{BEACH_BG.replace('blue beach towel, ', 'crystal clear shallow water, ')}"
        ),
        "neg_extra": NEG_NOT_STANDING,
        "aspect": (832, 1216),
    },
    {
        "id": "cut02_towel_missionary_insert",
        "name": "砂浜タオル・正常位・挿入",
        "prompt": (
            f"{QUALITY}, "
            f"{RIKO}, "
            "white bikini pulled aside, bikini bottom shifted, "
            f"{YOUSUKE}, "
            "missionary position:1.4, vaginal sex:1.3, hetero sex, "
            "girl lying on back:1.3, on blue beach towel, "
            "legs spread, knees bent upward, "
            "penis in pussy:1.2, penetration visible, insertion, "
            "man on top:1.2, between her thighs, leaning on arms, "
            "girl looking up at sky, half-lidded eyes, gasping, open mouth, "
            "flushed face, blush across nose, sweat on forehead, "
            "sweat beads on stomach, fingers gripping towel, "
            "sand grains on skin, sunlight on bodies, "
            f"{BEACH_BG}"
        ),
        "neg_extra": NEG_NOT_MISSIONARY,
        "aspect": (1216, 832),
    },
    {
        "id": "cut03_slow_climax_creampie",
        "name": "正常位のまま・穏やかな絶頂・中出し",
        "prompt": (
            f"{QUALITY}, "
            f"{RIKO}, "
            "white bikini disheveled, bikini barely on, "
            f"{YOUSUKE}, "
            "missionary position:1.4, vaginal sex:1.3, deep penetration, "
            "girl lying on back:1.3, on blue beach towel, "
            "cum in pussy:1.2, creampie, nakadashi, overflow cum, "
            "girl orgasm:1.2, climax, body tensing, "
            "man on top:1.2, pressing deep, hips flush against girl, "
            "girl's eyes half-closed, tears on cheeks, crying from pleasure, "
            "mouth slightly open, soft moan, panting, "
            "back arched off towel, toes curled, thighs trembling, "
            "hands gripping towel desperately, full body blush, "
            "sweat glistening all over skin, "
            f"{BEACH_BG}"
        ),
        "neg_extra": NEG_NOT_MISSIONARY,
        "aspect": (1216, 832),
    },
    {
        "id": "cut04_afterglow",
        "name": "正常位の余韻・中出し後（目を閉じて横たわる）",
        "prompt": (
            f"{QUALITY}, "
            f"{RIKO}, "
            "messy white bikini barely on, bikini shifted, "
            f"{YOUSUKE}, "
            "after sex:1.2, afterglow, "
            "girl lying on back:1.3, on blue beach towel, "
            "cum dripping from pussy:1.2, creampie drip, cum on inner thighs, "
            "man lying beside girl:1.2, hand on her stomach, gentle touch, "
            "girl eyes closed, peaceful satisfied smile, "
            "tear tracks on cheeks, flushed pink skin, "
            "heavy breathing, chest rising, sweat cooling, "
            "legs relaxed slightly apart, hair spread on towel, "
            "sand on shoulders, golden hour sunlight on skin, "
            f"{BEACH_BG}"
        ),
        "neg_extra": NEG_NOT_MISSIONARY,
        "aspect": (1216, 832),
    },
]

CAMERA_VARIANTS = [
    "three-quarter view from side:1.2, medium shot, both bodies visible",
    "from above angle:1.2, looking down at girl face, man back visible",
    "low angle from side:1.2, wide framing, full bodies on towel",
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


def get_negative(cut: dict) -> str:
    neg = NEGATIVE_BASE
    extra = cut.get("neg_extra", "")
    if extra:
        neg = f"{neg}, {extra}"
    return neg


def export_prompts(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = []
    for cut in CUTS:
        entry = {"id": cut["id"], "name": cut["name"], "variations": []}
        neg = get_negative(cut)
        for i in range(IMAGES_PER_CUT):
            cam = CAMERA_VARIANTS[i % len(CAMERA_VARIANTS)]
            pos = f"{cut['prompt']}, {cam}"
            entry["variations"].append({
                "index": i + 1,
                "camera": cam,
                "positive": pos,
                "negative": neg,
            })
        doc.append(entry)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"プロンプト出力: {path}")


def run_test(api_url: str, output_dir: Path, dry_run: bool = False):
    output_dir.mkdir(parents=True, exist_ok=True)
    total = len(CUTS) * IMAGES_PER_CUT
    done = 0

    print("=== 陽介・砂浜H テスト生成 ===")
    print(f"API: {api_url}")
    print(f"出力: {output_dir}")
    print(f"カット数: {len(CUTS)}, 各{IMAGES_PER_CUT}枚, 合計{total}枚")
    print("=" * 50)

    for cut in CUTS:
        cut_dir = output_dir / cut["id"]
        cut_dir.mkdir(parents=True, exist_ok=True)
        w, h = cut["aspect"]

        print(f"\n[{cut['id']}] {cut['name']}")

        for i in range(IMAGES_PER_CUT):
            cam = CAMERA_VARIANTS[i % len(CAMERA_VARIANTS)]
            positive = f"{cut['prompt']}, {cam}"
            out_file = cut_dir / f"{cut['id']}_{i+1:02d}.png"

            if out_file.exists():
                print(f"  [{i+1}/{IMAGES_PER_CUT}] スキップ: {out_file.name}")
                done += 1
                continue

            if dry_run:
                print(f"  [{i+1}/{IMAGES_PER_CUT}] DRY RUN {out_file.name}")
                print(f"    {positive[:140]}...")
                done += 1
                continue

            print(f"  [{i+1}/{IMAGES_PER_CUT}] 生成中...", end="", flush=True)
            neg = get_negative(cut)
            try:
                images = call_txt2img(
                    positive, neg, w, h,
                    api_url=api_url,
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


def main():
    parser = argparse.ArgumentParser(description="陽介・砂浜H テスト生成")
    parser.add_argument("--api-url", default=API_URL)
    parser.add_argument("--output", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--export-prompts", action="store_true")
    args = parser.parse_args()

    if args.export_prompts:
        export_prompts(args.output / "prompts.json")
        return

    run_test(args.api_url, args.output, args.dry_run)


if __name__ == "__main__":
    main()
