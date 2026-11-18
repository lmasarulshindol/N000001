"""ご褒美パート。ホテルで男性を待つひより。コーラルピンクの透けベビードール。"""
from __future__ import annotations

import base64
import json
import random
import sys
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\03_ご褒美")

PREFIX = (
    "score_9, score_8_up, score_7_up, rating_safe, source_anime, year_2024, "
    "masterpiece, ultra detailed, cinematic lighting,nsfw,Uncensored, "
)
HERO = (
    "1girl, solo, 22 years old, young woman, youthful face, "
    "petite, short stature, curvy figure, large breasts, slim waist, wide hips, "
    "(beige hair:1.5), (pale brown hair:1.4), (light brown hair:1.3), "
    "shoulder-length hair, wavy hair, outward curls, "
)
DRESS = (
    "(coral pink babydoll:1.6), (see-through babydoll:1.5), sheer fabric, "
    "thin straps, flared hem, "
    "(no bra:1.4), (no panties:1.4), nipples visible through clothes, "
    "(pubic hair visible through clothes:1.1), "
)
HOTEL = (
    "hotel room, indoors, large window, city view, dusk, "
    "white bed, white sheets, warm soft lighting, "
)
HAIR = "(beige hair:1.7), (pale brown hair:1.6), "
TAIL = "flat color, cel shading, clean lineart, (brown eyes:1.45)"

NEG = (
    "score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature, "
    "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, adult woman, censored, mosaic, lens flare, multiple heads, mutated head, extra body parts, deformed, two faces, "
    "child, loli, underage, flat chest, dark brown hair, black hair, blonde hair, blue hair, aqua hair, colored tips, gradient hair, "
    "(pink hair:1.85), (salmon hair:1.6), "
    "cup, drink, straw, bubble tea, beverage, "
    "2girls, 1boy, 2boys, multiple boys, male, penis, extra person, "
    "car interior, bra, panties, underwear, lace, "
    "glossy, painterly, thick paint, chibi, reference sheet, condom, "
    "cross-section, internal view, x-ray"
)

JOBS = [
    {
        "name": "r01_door",
        "scene": (
            "(standing:1.5), (in front of a door:1.45), hotel door, cowboy shot, "
            "(looking at viewer:1.5), blush, shy smile, (welcoming:1.3), "
            "arms at sides, (hands down:1.3), "
        ),
        "extra_neg": "sitting, lying, on bed, from behind",
    },
    {
        "name": "r02_bed",
        "scene": (
            "(sitting on the edge of the bed:1.55), (facing viewer:1.4), full body, "
            "(looking at viewer:1.5), blush, embarrassed smile, "
            "(hands on lap:1.35), (waiting:1.3), knees together, "
        ),
        "extra_neg": "standing, lying, from behind, spread legs",
    },
    {
        # 男性目線。立っている男は顔なし、下半身だけ。
        "name": "r03_kiss_tip",
        "male": True,
        "scene": (
            "pov, pov crotch, from above, looking down, faceless male, hetero, "
            "(girl kneeling on the floor:1.6), (kneeling:1.6), (male standing:1.5), "
            "(kissing penis:1.6), (kiss on glans:1.55), (lips touching the tip of the penis:1.5), "
            "penis, erection, detailed penis, single penis, "
            "(looking up at viewer:1.5), eye contact, "
            "(round face:1.35), (large round eyes:1.3), (youthful face:1.35), (soft cheeks:1.25), "
            "(smile:1.3), (happy:1.3), (loving smile:1.2), blush, "
            "(hands on his thighs:1.3), "
        ),
        "extra_neg": (
            "half-closed eyes, narrowed eyes, sharp eyes, seductive, mature female, sultry, "
            "long face, adult face, puckered lips, "
            "penis in mouth, fellatio, deep throat, licking, tongue, saliva, cum, ejaculation, "
            "male face, male head, sitting, bed, from side, looking away"
        ),
    },
]


def payload(job: dict, seed: int) -> dict:
    neg = NEG
    if job.get("male"):
        neg = neg.replace("2girls, 1boy, 2boys, multiple boys, male, penis, extra person, ",
                          "2girls, 2boys, multiple boys, two penises, extra person, ")
    return {
        "prompt": PREFIX + HERO + DRESS + job["scene"] + HOTEL + HAIR + TAIL,
        "negative_prompt": neg + ", " + job["extra_neg"],
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
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    OUT.mkdir(parents=True, exist_ok=True)
    rng = random.SystemRandom()
    only = sys.argv[2:]
    for job in JOBS:
        if only and job["name"] not in only:
            continue
        for _ in range(count):
            seed = rng.randrange(1, 2**31 - 1)
            body = payload(job, seed)
            dest = OUT / f"{job['name']}_{seed}.png"
            req = urllib.request.Request(
                URL, data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            print("start", job["name"], seed, flush=True)
            with urllib.request.urlopen(req, timeout=900) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            dest.write_bytes(base64.b64decode(data["images"][0]))
            (OUT / f"{job['name']}_{seed}.json").write_text(
                json.dumps(
                    {"name": job["name"], "seed": seed,
                     "prompt": body["prompt"], "negative_prompt": body["negative_prompt"]},
                    ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            print("done", dest, flush=True)
    print("batch complete", flush=True)


if __name__ == "__main__":
    main()
