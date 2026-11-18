"""02_1回目。ベッド端に座る森へ、跪いたひよりが上目遣いで口奉仕。"""
from __future__ import annotations

import base64
import json
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\02_1回目")
SEED = 414303

POSITIVE = (
    "score_9, score_8_up, score_7_up, rating_safe, source_anime, year_2024, "
    "masterpiece, ultra detailed, cinematic lighting,nsfw,Uncensored, "
    "1girl, 1boy, hetero, "
    "22 years old, young woman, youthful face, petite, short stature, "
    "curvy figure, large breasts, slim waist, wide hips, "
    "(beige hair:1.5), (pale brown hair:1.4), (light brown hair:1.3), "
    "shoulder-length hair, wavy hair, outward curls, "
    "coral pink lace bra, coral pink lace panties, "
    "(on her knees:1.7), (kneeling upright:1.65), (kneeling on white rug:1.5), "
    "(man sitting upright on the edge of the bed:1.75), (legs hanging off the bed:1.4), open robe, "
    "(man's head in frame:1.65), (man's face visible:1.6), (full face of man:1.4), "
    "(fellatio:1.55), (oral:1.4), (penis in mouth:1.5), "
    "(detailed penis:1.4), (glans:1.3), (shaft veins:1.15), single penis, "
    "(hands holding shaft:1.25), saliva, blush, "
    "(looking up at man:1.5), (looking at partner:1.45), (eye contact with male:1.4), "
    "(upturned eyes:1.35), (man looking down at girl:1.45), "
    "(gentle hand on her head:1.2), "
    "white bedroom, white bed, white sheets, warm soft lighting, (from side:1.45), wide shot, "
    "flat color, cel shading, clean lineart, "
    "(brown eyes:1.45)"
)

NEGATIVE = (
    "score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signaturescore_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature, "
    "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, adult woman, censored, mosaic, watermark, signature, text, lens flare,multiple heads, mutated head, extra body parts, deformed, bad anatomy, two faces,censored, "
    "child, loli, underage, flat chest, dark brown hair, black hair, blonde hair, blue hair, aqua hair, colored tips, gradient hair, "
    "cup, drink, straw, bubble tea, beverage, "
    "2girls, multiple girls, (2boys:1.6), (multiple boys:1.6), (two penises:1.6), (multiple penises:1.6), extra person, "
    "(lying on back:1.85), (male lying down:1.85), (supine:1.8), (reclining:1.65), "
    "(sitting on floor:1.6), (sitting on hip:1.55), "
    "(male standing:1.6), (girl on bed:1.75), (girl on all fours:1.65), (all fours:1.6), "
    "(faceless:1.55), (head out of frame:1.65), (cropped head:1.5), close-up, "
    "pov, from above, (looking at viewer:1.75), (looking at camera:1.7), (facing viewer:1.55), "
    "simplified penis, featureless penis, penis through clothes, missing glans, disembodied penis, "
    "glossy, painterly, thick paint, chibi, reference sheet"
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
        "hr_second_pass_steps": 15,
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
    dest = OUT / f"oral_{SEED}.png"
    dest.write_bytes(base64.b64decode(data["images"][0]))
    (OUT / f"oral_{SEED}.json").write_text(
        json.dumps({"seed": SEED, "prompt": POSITIVE, "negative_prompt": NEGATIVE}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(dest)


if __name__ == "__main__":
    main()
