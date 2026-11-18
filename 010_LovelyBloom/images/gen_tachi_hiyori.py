"""星野ひよりの立ち絵を1枚。Forge txt2img。"""
from __future__ import annotations

import base64
import json
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\立ち絵")
SEED = 414215

POSITIVE = (
    "score_9, score_8_up, score_7_up, rating_safe, source_anime, year_2024, "
    "masterpiece, ultra detailed, cinematic lighting,nsfw,Uncensored, "
    "1girl, solo, 22 years old, young woman, youthful face, "
    "petite, short stature, curvy figure, large breasts, slim waist, wide hips, "
    "(beige hair:1.5), (pale brown hair:1.4), (light brown hair:1.3), "
    "(shoulder-length hair:1.5), hair ends at shoulders, wavy hair, outward curls, "
    "big droopy eyes, tareme, crescent smile, dimple on right cheek, "
    "cheerful friendly smile, light blush, "
    "coral pink satin camisole dress, short dress, "
    "full body, standing, arms at sides, looking at viewer, facing viewer, "
    "simple background, white background, "
    "flat color, cel shading, clean lineart, "
    "(brown eyes:1.4)"
)

NEGATIVE = (
    "score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signaturescore_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature, "
    "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, adult woman, censored, mosaic, watermark, signature, text, lens flare,multiple heads, mutated head, extra body parts, deformed, bad anatomy, two faces,censored, "
    "child, loli, underage, flat chest, dark brown hair, chestnut brown hair, black hair, blonde hair, blue hair, aqua hair, colored tips, gradient hair, "
    "(very long hair:1.45), (waist-length hair:1.35), "
    "chibi, super deformed, multiple views, reference sheet, character sheet, extra person, 2girls, "
    "cup, drink, straw, bubble tea, beverage, food, logo, "
    "glossy, painterly, thick paint, sitting, lying, cropped, out of frame, nude"
)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "prompt": POSITIVE,
        "negative_prompt": NEGATIVE,
        "steps": 28,
        "width": 1024,
        "height": 1344,
        "cfg_scale": 5.5,
        "sampler_name": "Euler a",
        "scheduler": "Automatic",
        "seed": SEED,
        "batch_size": 1,
        "n_iter": 1,
        "enable_hr": True,
        "hr_scale": 1.5,
        "hr_upscaler": "R-ESRGAN 4x+ Anime6B",
        "hr_second_pass_steps": 20,
        "denoising_strength": 0.25,
        "hr_additional_modules": ["Use same choices"],
        "save_images": False,
        "send_images": True,
        "override_settings": {
            "sd_model_checkpoint": "waiIllustriousSDXL_v170.safetensors",
            "CLIP_stop_at_last_layers": 2,
        },
        "override_settings_restore_afterwards": False,
    }
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=900) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    dest = OUT / f"hiyori_standing_{SEED}.png"
    dest.write_bytes(base64.b64decode(data["images"][0]))
    (OUT / f"hiyori_standing_{SEED}.json").write_text(
        json.dumps({"seed": SEED, "prompt": POSITIVE, "negative_prompt": NEGATIVE}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(dest)


if __name__ == "__main__":
    main()
