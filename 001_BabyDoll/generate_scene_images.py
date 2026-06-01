"""
莉子4作目「終わらない生中出し ～二泊三日の南国旅行～」
全16シーン × 各10枚 = 160枚の画像を生成するスクリプト

使用API: AUTOMATIC1111 WebUI (stable-diffusion-webui)
デフォルトエンドポイント: http://127.0.0.1:7860
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

# ============================================================
# 設定
# ============================================================

API_URL = "http://127.0.0.1:7860"
OUTPUT_DIR = Path(__file__).parent / "generated_images"
IMAGES_PER_SCENE = 10

DEFAULT_PARAMS = {
    "steps": 28,
    "cfg_scale": 7.0,
    "width": 832,
    "height": 1216,
    "sampler_name": "DPM++ 2M SDE",
    "scheduler": "Karras",
    "seed": -1,
    "batch_size": 1,
    "n_iter": 1,
}

# ============================================================
# キャラクター固定タグ（莉子 南国旅行バージョン）
# ============================================================

RIKO_BASE = (
    "1girl, solo, child, very petite, short stature, small delicate frame, "
    "flat chest, narrow hips, thin limbs, "
    "pink blonde hair, shoulder-length mid-wavy hair, soft bouncy hair tips, "
    "sparkling aqua blue eyes, pale porcelain skin"
)

NEGATIVE_BASE = (
    "lowres, bad anatomy, extra fingers, extra limbs, missing fingers, "
    "fused fingers, too many fingers, mutated hands, poorly drawn hands, "
    "poorly drawn face, deformed, blurry, bad proportions, "
    "jewelry on ear, earrings, piercing, tattoo, muscular, "
    "mature body, large breasts, tall, adult woman, "
    "watermark, signature, text, logo"
)

# ============================================================
# 構図バリエーション（各シーンで10枚分ランダム選択用）
# ============================================================

CAMERA_ANGLES = [
    "from above, looking down",
    "from below, looking up",
    "from side, profile view",
    "from behind, looking back over shoulder",
    "dutch angle, tilted frame",
    "straight on, eye level",
    "bird's eye view",
    "worm's eye view, low angle",
    "three-quarter view",
    "close-up face, extreme close-up",
]

SHOT_DISTANCES = [
    "full body shot",
    "cowboy shot, upper body",
    "bust shot, upper body focus",
    "close-up portrait",
    "medium shot, waist up",
    "extreme close-up, face only",
    "full body, wide shot",
    "thigh-up shot",
    "knee shot",
    "upper body, arms visible",
]

COMPOSITIONS = [
    "rule of thirds",
    "centered composition, symmetrical",
    "off-center framing",
    "foreground bokeh, depth of field",
    "silhouette framing",
    "frame within frame",
    "leading lines",
    "negative space composition",
    "dynamic diagonal composition",
    "layered depth composition",
]

# ============================================================
# 全16シーン定義
# ============================================================

SCENES = [
    {
        "id": "scene01_arrival",
        "name": "シーン1：到着",
        "description": "空港からヴィラへ。白いワンピース、キャップ。海を見て興奮する莉子",
        "outfit": "white summer dress, sun hat, sandals, casual travel outfit",
        "setting": "tropical airport, palm trees, blue sky, bright sunlight, ocean visible in distance",
        "mood": "excited, genuinely happy, childlike wonder, bright smile, arms spread wide",
        "lighting": "bright tropical sunlight, golden hour warmth, vivid blue sky",
        "extra": "luggage, tropical flowers, wind blowing hair and dress",
        "aspect": (832, 1216),
    },
    {
        "id": "scene02_beach_yousuke",
        "name": "シーン2：砂浜——おにいさん",
        "description": "ビーチで陽介と再会。白いビキニ。砂浜でH。青空の下",
        "outfit": "white triangle bikini, small bikini, string bikini",
        "setting": "tropical beach, white sand, turquoise ocean, blue sky, towel on sand",
        "mood": "shy smile, blushing, looking up at someone, gentle expression, relaxed",
        "lighting": "bright daylight, sun overhead, warm tropical light, lens flare",
        "extra": "lying on beach towel, sand on skin, wet hair, ocean waves in background",
        "aspect": (1216, 832),
    },
    {
        "id": "scene03_bbq",
        "name": "シーン3：BBQ——お肉",
        "description": "ビーチBBQ。お肉を食べる莉子。炭火の光。夕暮れ",
        "outfit": "white triangle bikini, sauce stain on chin",
        "setting": "beach BBQ setup, charcoal grill, grilled meat and seafood, tiki torches, sunset beach",
        "mood": "eating happily, mouth full, messy eater, carefree, childlike joy, sauce on face",
        "lighting": "warm sunset glow mixed with charcoal fire light, orange and red tones, flickering firelight",
        "extra": "plate of grilled meat, corn, tropical fruits, beach chairs, bonfire glow",
        "aspect": (1216, 832),
    },
    {
        "id": "scene04_villa_3p",
        "name": "シーン4：夜——ヴィラのソファで",
        "description": "ヴィラのリビング。ソファの上。夜。室内照明",
        "outfit": "white triangle bikini, disheveled, partially removed",
        "setting": "luxury villa living room, large sofa, modern interior, night, glass windows showing dark ocean",
        "mood": "overwhelmed, flushed face, sweating, panting, dazed expression, teary eyes",
        "lighting": "warm indoor ambient light, soft lamp light, dim mood lighting",
        "extra": "on sofa, cushions scattered, messy hair, skin glistening with sweat",
        "aspect": (832, 1216),
    },
    {
        "id": "scene05_ryo_night",
        "name": "シーン5：深夜——月光",
        "description": "涼の夜這い。月光の中。ベッドの上。手を繋いでいる",
        "outfit": "nude, covered by thin white sheet, barely covered",
        "setting": "villa bedroom, moonlight through window, silver ocean visible, dark room",
        "mood": "tender, tears in eyes, peaceful ecstasy, gentle smile, hand holding, intimate",
        "lighting": "moonlight only, silver-blue tones, gentle shadows, night vision aesthetic, low key lighting",
        "extra": "lying in bed, white sheets, intertwined hands, moonbeam across body, tears on cheeks",
        "aspect": (1216, 832),
    },
    {
        "id": "scene06_shower_ren",
        "name": "シーン6：朝——シャワーの中",
        "description": "朝のシャワー。蓮が乱入。ガラス張りシャワールーム",
        "outfit": "nude, wet skin, water droplets all over body",
        "setting": "glass shower room, steam, water spray, morning light through frosted glass, modern bathroom",
        "mood": "surprised, flustered, water running down face, gasping, gripping wall",
        "lighting": "bright morning light diffused through glass and steam, soft white light, water sparkles",
        "extra": "water droplets, steam, wet hair clinging to face, hand on glass wall, shower spray",
        "aspect": (832, 1216),
    },
    {
        "id": "scene07_pool",
        "name": "シーン7：午前——プールサイド",
        "description": "プールサイド。水色ビキニ。サングラス。騎乗位",
        "outfit": "light blue bikini, sunglasses on head",
        "setting": "private pool, poolside deck chairs, tropical garden, bright morning sun, turquoise water",
        "mood": "active, riding position, leaning forward, flushed, biting lip, determined yet yielding",
        "lighting": "bright morning sunlight, water reflections casting patterns, dappled light through palms",
        "extra": "pool water splashes, sunscreen bottle, tropical plants, pool edge, wet skin",
        "aspect": (832, 1216),
    },
    {
        "id": "scene08_alone",
        "name": "シーン8：昼——一人の時間",
        "description": "プールに浮き輪で浮かんでいる。一人。内省。穏やかな表情",
        "outfit": "light blue bikini, relaxed",
        "setting": "private pool, floating on water, blue sky above, palm trees framing sky, peaceful midday",
        "mood": "contemplative, serene, eyes closed, peaceful smile, daydreaming, floating weightlessly",
        "lighting": "overhead midday sun, water reflections on skin, bright and clear, tropical clarity",
        "extra": "inflatable pool float, tropical fruits on poolside, sunlight sparkles on water, alone",
        "aspect": (1216, 832),
    },
    {
        "id": "scene09_afternoon_3men",
        "name": "シーン9：午後——三人",
        "description": "昼寝から起こされて輪姦。泣いている。気持ちよくて泣く",
        "outfit": "light blue bikini removed, nude, tangled bikini at ankle",
        "setting": "poolside daybed, afternoon sun, outdoor canopy bed, tropical backdrop",
        "mood": "crying while smiling, tears streaming, overwhelmed with pleasure, trembling, messy hair",
        "lighting": "warm afternoon golden light, sun through canopy fabric, dappled warm shadows",
        "extra": "tears on cheeks, messy sheets, disheveled hair, sweat and tears, smiling through tears",
        "aspect": (832, 1216),
    },
    {
        "id": "scene10_terrace",
        "name": "シーン10：夕方——テラス",
        "description": "テラスで陽介と二人の会話。夕焼け。バスローブ",
        "outfit": "oversized white bathrobe, hair still damp, bare feet",
        "setting": "villa terrace, ocean sunset, orange sky, comfortable outdoor sofa, evening breeze",
        "mood": "calm, vulnerable, knees hugged to chest, small in big bathrobe, thoughtful, gentle smile",
        "lighting": "golden sunset, warm orange backlight, rim light on hair, peaceful evening glow",
        "extra": "sunset over ocean, wind in damp hair, small figure in oversized robe, peaceful atmosphere",
        "aspect": (1216, 832),
    },
    {
        "id": "scene11_5p_night",
        "name": "シーン11：夜——全員集合",
        "description": "5P。キングサイズベッド。絶頂の常態化。壊れかけの甘え声",
        "outfit": "nude, covered in sweat, flushed all over",
        "setting": "large bedroom, king size bed, white sheets, night, warm interior lighting",
        "mood": "ecstatic, mind blank, ahegao-like, drooling slightly, eyes unfocused, trembling all over",
        "lighting": "warm bedroom lighting, soft orange tones, intimate atmosphere, low ambient",
        "extra": "messy bed sheets, multiple pillows, sweating profusely, tears and sweat mixing, disheveled",
        "aspect": (832, 1216),
    },
    {
        "id": "scene12_ren_night",
        "name": "シーン12：深夜——蓮",
        "description": "蓮の夜這い。莉子が自分から求める。暗闇。手を繋いでいる",
        "outfit": "nude, dim silhouette",
        "setting": "dark bedroom, almost pitch black, faint moonlight, intimate darkness",
        "mood": "gentle initiative, girl on top, tender, whispering, confident yet vulnerable, hand holding",
        "lighting": "near darkness, faint moonlight edge, silhouette lighting, minimal light, intimate shadows",
        "extra": "intertwined hands, forehead touching, girl on top position, dark intimate atmosphere",
        "aspect": (1216, 832),
    },
    {
        "id": "scene13_morning_yousuke",
        "name": "シーン13：朝——おにいさんと二人で",
        "description": "最終日の朝。陽介の腕の中。穏やかなH。笑いながらイく",
        "outfit": "nude under white sheet, wrapped in blanket",
        "setting": "bedroom, morning sunlight through curtains, warm bed, birds singing outside, final morning",
        "mood": "peaceful, warm smile, happy tears, gentle, safe, laughing softly, content",
        "lighting": "soft morning light, warm golden rays through curtains, gentle lens flare, dreamy atmosphere",
        "extra": "wrapped in arms, morning sunbeam, pillow, tousled hair, peaceful expression, gentle warmth",
        "aspect": (1216, 832),
    },
    {
        "id": "scene14_final_beach",
        "name": "シーン14：最後のビーチ",
        "description": "莉子が一人ずつ選ぶ。白いビキニ（初日と同じ）。最後は抱きしめられるだけ",
        "outfit": "white triangle bikini, same as day 1, sand on skin",
        "setting": "beach, afternoon to sunset transition, waves, white sand, final gathering",
        "mood": "resolved, mature gaze, choosing, standing confidently, bittersweet smile",
        "lighting": "late afternoon golden hour transitioning to sunset, warm orange and pink sky",
        "extra": "standing on beach, waves at feet, wind in hair, determined expression, sand between toes",
        "aspect": (832, 1216),
    },
    {
        "id": "scene15_interview",
        "name": "シーン15：エンディングインタビュー",
        "description": "テラスで店長とインタビュー。ワンピース。小悪魔が帰還。舌ぺろ",
        "outfit": "white one-piece dress, casual summer dress, hair done up neatly",
        "setting": "villa terrace, sunset background, camera visible, interview setup, orange evening light",
        "mood": "confident smirk, tongue out playfully, mischievous wink, small devil returned, direct gaze at camera",
        "lighting": "warm sunset backlight, orange glow, rim light on hair, cinematic interview lighting",
        "extra": "looking directly at camera, tongue sticking out, winking, playful pose, cleaned up appearance",
        "aspect": (832, 1216),
    },
    {
        "id": "scene16_epilogue",
        "name": "シーン16：エピローグ——帰りの飛行機",
        "description": "飛行機の窓際。雲の上。夕焼けの空。目を閉じている",
        "outfit": "casual travel clothes, light cardigan, normal child outfit",
        "setting": "airplane window seat, clouds below, sunset sky outside window, cabin interior",
        "mood": "eyes closed, peaceful, small smile, returning to normal, bittersweet, serene",
        "lighting": "sunset through airplane window, warm orange-pink light on face, soft cabin lighting",
        "extra": "forehead against window, clouds visible outside, small bag with seashell keychain, peaceful sleep",
        "aspect": (832, 1216),
    },
]


def build_prompt(scene: dict, variation_idx: int) -> tuple[str, str]:
    """シーンと変動インデックスからpositive/negativeプロンプトを生成"""
    angle = CAMERA_ANGLES[variation_idx % len(CAMERA_ANGLES)]
    distance = SHOT_DISTANCES[variation_idx % len(SHOT_DISTANCES)]
    composition = COMPOSITIONS[variation_idx % len(COMPOSITIONS)]

    positive_parts = [
        "masterpiece, best quality, ultra-detailed, anime style",
        RIKO_BASE,
        scene["outfit"],
        f"{angle}, {distance}, {composition}",
        scene["mood"],
        scene["setting"],
        scene["lighting"],
        scene.get("extra", ""),
    ]
    positive = ", ".join(p for p in positive_parts if p)

    negative = NEGATIVE_BASE

    return positive, negative


def call_txt2img(positive: str, negative: str,
                 width: int, height: int,
                 api_url: str = API_URL,
                 **overrides) -> list[bytes]:
    """AUTOMATIC1111 APIでtxt2imgを呼び出し、画像バイトリストを返す"""
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


def generate_all(
    api_url: str = API_URL,
    output_dir: Path = OUTPUT_DIR,
    images_per_scene: int = IMAGES_PER_SCENE,
    start_scene: int = 0,
    dry_run: bool = False,
):
    """全シーンの画像を生成"""
    output_dir.mkdir(parents=True, exist_ok=True)
    total = len(SCENES) * images_per_scene
    generated = 0
    errors = 0

    print(f"=== 莉子4作目 画像生成 ===")
    print(f"API: {api_url}")
    print(f"出力先: {output_dir}")
    print(f"シーン数: {len(SCENES)}, 各{images_per_scene}枚, 合計{total}枚")
    print(f"{'='*50}")

    for scene_idx, scene in enumerate(SCENES):
        if scene_idx < start_scene:
            continue

        scene_dir = output_dir / scene["id"]
        scene_dir.mkdir(parents=True, exist_ok=True)
        w, h = scene.get("aspect", (832, 1216))

        print(f"\n[{scene_idx+1}/{len(SCENES)}] {scene['name']}")
        print(f"  設定: {scene['description']}")

        for var_idx in range(images_per_scene):
            positive, negative = build_prompt(scene, var_idx)
            filename = scene_dir / f"{scene['id']}_{var_idx+1:02d}.png"

            if filename.exists():
                print(f"  [{var_idx+1}/{images_per_scene}] スキップ（既存）: {filename.name}")
                generated += 1
                continue

            if dry_run:
                print(f"  [{var_idx+1}/{images_per_scene}] [DRY RUN] {filename.name}")
                print(f"    Positive: {positive[:120]}...")
                generated += 1
                continue

            print(f"  [{var_idx+1}/{images_per_scene}] 生成中...", end="", flush=True)

            try:
                images = call_txt2img(
                    positive, negative, w, h,
                    api_url=api_url,
                    seed=random.randint(0, 2**32 - 1),
                )
                for img_data in images:
                    filename.write_bytes(img_data)
                print(f" OK -> {filename.name}")
                generated += 1
            except error.URLError as e:
                print(f" ERROR: {e}")
                errors += 1
            except Exception as e:
                print(f" ERROR: {e}")
                errors += 1

            time.sleep(0.5)

    print(f"\n{'='*50}")
    print(f"完了: {generated}/{total} 枚生成, {errors} エラー")
    print(f"出力先: {output_dir}")


def export_prompts(output_file: Path | None = None):
    """全プロンプトをJSONファイルに書き出す（デバッグ・調整用）"""
    if output_file is None:
        output_file = OUTPUT_DIR / "all_prompts.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)

    prompts = []
    for scene in SCENES:
        scene_prompts = {
            "id": scene["id"],
            "name": scene["name"],
            "description": scene["description"],
            "variations": [],
        }
        for var_idx in range(IMAGES_PER_SCENE):
            pos, neg = build_prompt(scene, var_idx)
            scene_prompts["variations"].append({
                "index": var_idx + 1,
                "positive": pos,
                "negative": neg,
                "angle": CAMERA_ANGLES[var_idx % len(CAMERA_ANGLES)],
                "distance": SHOT_DISTANCES[var_idx % len(SHOT_DISTANCES)],
            })
        prompts.append(scene_prompts)

    output_file.write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"プロンプト一覧を出力: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="莉子4作目 全シーン画像生成 (AUTOMATIC1111 API)"
    )
    parser.add_argument(
        "--api-url", default=API_URL,
        help=f"AUTOMATIC1111 APIのURL (default: {API_URL})",
    )
    parser.add_argument(
        "--output", type=Path, default=OUTPUT_DIR,
        help=f"出力ディレクトリ (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--count", type=int, default=IMAGES_PER_SCENE,
        help=f"シーンあたりの画像枚数 (default: {IMAGES_PER_SCENE})",
    )
    parser.add_argument(
        "--start-scene", type=int, default=0,
        help="開始シーン番号 (0-indexed, default: 0)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="APIを呼ばずにプロンプトだけ表示",
    )
    parser.add_argument(
        "--export-prompts", action="store_true",
        help="全プロンプトをJSONに書き出して終了",
    )
    parser.add_argument(
        "--steps", type=int, default=DEFAULT_PARAMS["steps"],
        help=f"サンプリングステップ数 (default: {DEFAULT_PARAMS['steps']})",
    )
    parser.add_argument(
        "--cfg", type=float, default=DEFAULT_PARAMS["cfg_scale"],
        help=f"CFG Scale (default: {DEFAULT_PARAMS['cfg_scale']})",
    )
    parser.add_argument(
        "--sampler", default=DEFAULT_PARAMS["sampler_name"],
        help=f"サンプラー名 (default: {DEFAULT_PARAMS['sampler_name']})",
    )

    args = parser.parse_args()

    DEFAULT_PARAMS["steps"] = args.steps
    DEFAULT_PARAMS["cfg_scale"] = args.cfg
    DEFAULT_PARAMS["sampler_name"] = args.sampler

    if args.export_prompts:
        export_prompts(args.output / "all_prompts.json")
        return

    generate_all(
        api_url=args.api_url,
        output_dir=args.output,
        images_per_scene=args.count,
        start_scene=args.start_scene,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
