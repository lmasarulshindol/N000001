"""02_1回目。口内射精、愛撫、2度目のフェラ、挿入、中出し。"""
from __future__ import annotations

import base64
import json
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\02_1回目")

PREFIX = (
    "score_9, score_8_up, score_7_up, rating_safe, source_anime, year_2024, "
    "masterpiece, ultra detailed, cinematic lighting,nsfw,Uncensored, "
)
HERO = (
    "1girl, 1boy, hetero, 22 years old, young woman, youthful face, "
    "petite, short stature, curvy figure, large breasts, slim waist, wide hips, "
    "(beige hair:1.5), (pale brown hair:1.4), (light brown hair:1.3), "
    "shoulder-length hair, wavy hair, outward curls, "
)
TAIL = "flat color, cel shading, clean lineart, (brown eyes:1.45)"
ROOM = "white bedroom, white bed, white sheets, warm soft lighting, "

NEG = (
    "score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signaturescore_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature, "
    "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, adult woman, censored, mosaic, watermark, signature, text, lens flare,multiple heads, mutated head, extra body parts, deformed, bad anatomy, two faces,censored, "
    "child, loli, underage, flat chest, dark brown hair, black hair, blonde hair, blue hair, aqua hair, colored tips, gradient hair, "
    "cup, drink, straw, bubble tea, beverage, 2girls, (2boys:1.6), (multiple boys:1.6), (two penises:1.6), extra person, "
    "glossy, painterly, thick paint, chibi, reference sheet, condom, "
    "cross-section, internal view, x-ray, anatomical cutaway, womb, uterus, medical diagram"
)

JOBS = [
    {
        "name": "cum_in_mouth",
        "seed": 414311,
        "width": 1024,
        "height": 1344,
        "scene": (
            "coral pink lace bra, coral pink lace panties, "
            "(on her knees:1.7), (kneeling upright:1.65), (kneeling on white rug:1.5), "
            "(man sitting upright on the edge of the bed:1.75), (legs hanging off the bed:1.4), "
            "(man's head in frame:1.65), (man's face visible:1.6), "
            "(fellatio:1.4), (ejaculation:1.5), (cum in mouth:1.6), (semen in mouth:1.45), "
            "(cum dripping from lips:1.35), (detailed penis:1.4), (glans:1.3), single penis, "
            "(looking up at man:1.55), (eye contact with male:1.45), (man looking down at girl:1.45), "
            "(gentle hand on her head:1.2), blush, "
            + ROOM + "(from side:1.4), "
        ),
        "extra_neg": "(male lying down:1.7), (girl on bed:1.6), (looking at viewer:1.6), (head out of frame:1.55)",
    },
    {
        "name": "caress",
        "seed": 414322,
        "width": 1216,
        "height": 832,
        "scene": (
            "topless, pink lace panties, nipples, (beige hair:1.7), (pale brown hair:1.65), "
            "(girl lying on her back:1.6), (on bed:1.4), "
            "(man leaning over her:1.6), (boy on top:1.3), "
            "(kissing nipple:1.5), (breast sucking:1.4), (hand on breast:1.45), "
            "(arched back:1.2), blush, embarrassed, "
            "(looking at partner:1.45), (man looking at her chest:1.3), "
            "(man's face visible:1.4), "
            + ROOM + "(from side:1.35), "
        ),
        "extra_neg": "(man lying on back:1.6), (boy lying on back:1.6), fellatio, penis in pussy, vaginal, creampie, (looking at viewer:1.5), (pink hair:1.85), (salmon hair:1.6), (red hair:1.5)",
    },
    {
        "name": "oral2",
        "seed": 414323,
        "width": 1216,
        "height": 832,
        "scene": (
            "completely nude, nipples, "
            "(man lying on his back:1.65), (on bed:1.4), "
            "(girl kneeling on bed:1.5), (between his legs:1.4), "
            "(fellatio:1.8), (blowjob:1.7), (penis in mouth:1.75), (sucking penis:1.6), "
            "(detailed penis:1.45), (glans:1.35), single penis, (her mouth on penis:1.6), "
            "(looking up at man:1.5), (man's face visible:1.5), "
            "blush, playful eyes, saliva, "
            + ROOM + "(from side:1.35), "
        ),
        "extra_neg": "(kissing:1.85), (french kiss:1.85), (lip to lip:1.7), (man sitting:1.5), (male standing:1.5), (girl lying on back:1.55), creampie, vaginal, (looking at viewer:1.55)",
    },
    {
        "name": "insertion",
        "seed": 414324,
        "width": 1216,
        "height": 832,
        "scene": (
            "completely nude, nipples, "
            "(girl lying on her back:1.55), (man between her legs:1.5), (missionary:1.55), "
            "(spread legs:1.45), (vaginal sex:1.6), (penis in pussy:1.75), (visible penetration:1.55), "
            "(detailed penis:1.4), single penis, "
            "(looking at each other:1.55), (eye contact:1.5), (both faces visible:1.5), "
            "blush, raw sex, no condom, "
            + ROOM + "(from side:1.4), "
        ),
        "extra_neg": "(man lying on back under her:1.4), cowgirl, fellatio, creampie, cum, condom, (looking at viewer:1.55), (head out of frame:1.5)",
    },
    {
        "name": "creampie",
        "seed": 414315,
        "width": 1216,
        "height": 832,
        "scene": (
            "completely nude, nipples, "
            "(girl lying on her back:1.5), (legs around his waist:1.4), (missionary:1.5), "
            "(man between her legs:1.45), "
            "(creampie:1.6), (cum in pussy:1.55), (nakadashi:1.4), "
            "(cum overflow at vaginal entrance:1.35), (penis in pussy:1.4), single penis, "
            "(looking at his face:1.6), (eye contact:1.55), (both faces visible:1.55), "
            "(her hand on his cheek:1.35), blush, tears in eyes, "
            + ROOM + "(from side:1.4), "
        ),
        "extra_neg": "cowgirl, fellatio, condom, (looking away:1.4), (looking at viewer:1.5), (head out of frame:1.55), (cum on face:1.3)",
    },
]


def payload(job: dict) -> dict:
    prompt = PREFIX + HERO + job["scene"] + TAIL
    return {
        "prompt": prompt,
        "negative_prompt": NEG + ", " + job["extra_neg"],
        "steps": 28,
        "width": job["width"],
        "height": job["height"],
        "cfg_scale": 5.5,
        "sampler_name": "Euler a",
        "scheduler": "Automatic",
        "seed": job["seed"],
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
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        dest = OUT / f"{job['name']}_{job['seed']}.png"
        body = json.dumps(payload(job)).encode("utf-8")
        req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=900) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        dest.write_bytes(base64.b64decode(data["images"][0]))
        print(dest, flush=True)


if __name__ == "__main__":
    main()
