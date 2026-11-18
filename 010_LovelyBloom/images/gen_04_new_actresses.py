"""新人女優3名。プレイルームで透けベビードールの立ち絵。"""
from __future__ import annotations

import base64
import json
import random
import sys
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\04_新人女優")

PREFIX = (
    "score_9, score_8_up, score_7_up, rating_safe, source_anime, year_2024, "
    "masterpiece, ultra detailed, cinematic lighting,nsfw,Uncensored, "
)

NEG = (
    "score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signaturescore_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature,\n"
    "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, adult woman, censored, mosaic, watermark, signature, text, lens flare,multiple heads, mutated head, extra body parts, deformed, bad anatomy, two faces,censored, "
    "child, loli, underage, 2girls, 1boy, male, extra person, chibi, reference sheet, sitting, lying, from behind, bra, panties, underwear"
)

ROOM = (
    "playroom, love hotel room, indoors, large bed, dim warm pink lighting, "
    "(standing:1.5), (full body:1.4), (looking at viewer:1.4), arms at sides, "
)
TAIL = "flat color, cel shading, clean lineart"

CHARS = [
    {
        "name": "mio",
        "desc": (
            "1girl, solo, 18 years old, "
            "(black hair:1.5), long straight hair, blunt bangs, bangs partially covering eyes, "
            "(narrow eyes:1.3), downcast eyes, (pale skin:1.3), mole under left collarbone, "
            "slender, long legs, (small breasts:1.2), calm expression, faint blush, "
            "(indigo blue babydoll:1.6), (see-through babydoll:1.5), sheer fabric, thin straps, "
            "(no bra:1.4), (no panties:1.4), nipples visible through clothes, "
        ),
    },
    {
        "name": "kokone",
        "desc": (
            "1girl, solo, 18 years old, "
            "(light chestnut brown hair:1.5), medium hair, inward curled ends, side braid, "
            "(large round eyes:1.3), (large breasts:1.4), slim waist, narrow shoulders, "
            "mole on right wrist, bright cheerful smile, blush, "
            "(mint green babydoll:1.6), (see-through babydoll:1.5), sheer fabric, thin straps, "
            "(no bra:1.4), (no panties:1.4), nipples visible through clothes, "
        ),
    },
    {
        "name": "sara",
        "desc": (
            "1girl, solo, 18 years old, "
            "(dark brown hair:1.5), long hair, soft inner waves, glossy hair, "
            "sharp upturned eyes, double eyelid, confident smirk, elegant, "
            "long legs, slender, good posture, medium breasts, "
            "(wine red babydoll:1.6), (see-through babydoll:1.5), sheer fabric, thin straps, "
            "(no bra:1.4), (no panties:1.4), nipples visible through clothes, "
        ),
    },
]


def payload(c: dict, seed: int) -> dict:
    return {
        "prompt": PREFIX + c["desc"] + ROOM + TAIL,
        "negative_prompt": NEG,
        "steps": 28,
        "width": 1024,
        "height": 1344,
        "cfg_scale": 5.5,
        "sampler_name": "Euler a",
        "scheduler": "Automatic",
        "seed": seed,
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


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    OUT.mkdir(parents=True, exist_ok=True)
    rng = random.SystemRandom()
    for c in CHARS:
        for _ in range(count):
            seed = rng.randrange(1, 2**31 - 1)
            body = payload(c, seed)
            dest = OUT / f"{c['name']}_stand_{seed}.png"
            req = urllib.request.Request(
                URL, data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            print("start", c["name"], seed, flush=True)
            with urllib.request.urlopen(req, timeout=900) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            dest.write_bytes(base64.b64decode(data["images"][0]))
            dest.with_suffix(".json").write_text(
                json.dumps({"name": c["name"], "seed": seed,
                            "prompt": body["prompt"],
                            "negative_prompt": body["negative_prompt"]},
                           ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print("done", dest, flush=True)
    print("batch complete", flush=True)


if __name__ == "__main__":
    main()
