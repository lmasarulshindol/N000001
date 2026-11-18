"""視聴者企画。男性目線（pov crotch）。カメラ、体位、体勢の順。Danbooru タグ。"""
from __future__ import annotations

import base64
import json
import urllib.request
from pathlib import Path

URL = "http://127.0.0.1:7860/sdapi/v1/txt2img"
OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\02_視聴者企画編")

PREFIX = (
    "score_9, score_8_up, score_7_up, rating_safe, source_anime, year_2024, "
    "masterpiece, ultra detailed, cinematic lighting,nsfw,Uncensored, "
)
# カメラ → 場所 → 人物。男の顔は映さない。視線は画面（男の目）へ。
CAM = "pov, pov crotch, from above, looking down, "
PLACE = "car interior, back seat, car seat, window, "
HERO = (
    "1girl, faceless male, hetero, "
    "22 years old, young woman, youthful face, "
    "petite, short stature, curvy figure, large breasts, slim waist, wide hips, "
    "(beige hair:1.4), (pale brown hair:1.3), (light brown hair:1.2), "
    "shoulder-length hair, wavy hair, "
)
GAZE = "looking at viewer, eye contact, "
CLOTHES = "sweater, pleated skirt, "
PAIZURI_CLOTHES = "topless, nipples, miniskirt, skirt, "
PENIS = "penis, erection, detailed penis, "
HAIR = "(beige hair:1.5), (pale brown hair:1.4), (brown eyes:1.4), "
TAIL = "flat color, cel shading, clean lineart, "

NEG = (
    "score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signaturescore_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature, "
    "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, adult woman, censored, mosaic, watermark, signature, text, lens flare,multiple heads, mutated head, extra body parts, deformed, bad anatomy, two faces,censored, "
    "child, loli, underage, flat chest, dark brown hair, black hair, blonde hair, blue hair, aqua hair, colored tips, gradient hair, "
    "(pink hair:1.85), (salmon hair:1.6), "
    "cup, drink, straw, bubble tea, beverage, "
    "2girls, 2boys, multiple boys, another boy, male face, male head, "
    "two penises, multiple penises, disembodied penis, floating penis, futanari, "
    "from side, from behind, looking away, looking at ceiling, "
    "bedroom, on bed, steering wheel, driver seat, front seat, dashboard, "
    "text on clothes, logo, condom, glossy, painterly, thick paint, chibi, "
    "cross-section, internal view, x-ray"
)

JOBS = [
    {
        "name": "01_handjob",
        "seed": 414521,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "handjob, penis grab, stroking, "
            + PENIS + GAZE
            + "blush, smile, "
            + HAIR
        ),
        "extra_neg": "fellatio, penis in mouth, oral, cum, ejaculation, paizuri, topless, bottomless, kissing",
    },
    {
        "name": "02_handjob_cum",
        "seed": 414542,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "handjob, penis grab, ejaculation, cum on hands, "
            + PENIS + GAZE
            + "smile, happy, blush, "
            + HAIR
        ),
        "extra_neg": "fellatio, penis in mouth, cum on face, facial, paizuri, topless, bottomless, kissing",
    },
    {
        "name": "03_fellatio",
        "seed": 414533,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "kneeling, between legs, fellatio, oral, penis in mouth, saliva, "
            + PENIS + GAZE + "looking up, "
            + "blush, "
            + HAIR
        ),
        "extra_neg": "kissing, french kiss, cum, ejaculation, paizuri, topless, bottomless, handjob",
    },
    {
        "name": "04_fellatio_cum",
        "seed": 1854071006,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "kneeling, between legs, fellatio, oral, penis in mouth, "
            + "ejaculation, cum in mouth, semen, "
            + PENIS + GAZE + "looking up, "
            + "smile, happy, blush, "
            + HAIR
        ),
        "extra_neg": "kissing, french kiss, facial, cum on face, paizuri, topless, bottomless",
    },
    {
        "name": "05_hand_and_mouth",
        "seed": 414535,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "kneeling, between legs, fellatio, handjob, penis in mouth, penis grab, saliva, "
            + PENIS + GAZE + "looking up, "
            + "blush, "
            + HAIR
        ),
        "extra_neg": "kissing, cum, ejaculation, paizuri, topless, bottomless, finger in mouth",
    },
    {
        "name": "06_hand_and_mouth_cum",
        "seed": 249734873,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "kneeling, between legs, fellatio, handjob, penis in mouth, penis grab, "
            + "ejaculation, cum in mouth, "
            + PENIS + GAZE + "looking up, "
            + "smile, happy, blush, "
            + HAIR
        ),
        "extra_neg": "kissing, french kiss, facial, paizuri, topless, bottomless, finger in mouth, his hand on penis",
    },
    {
        "name": "07_paizuri",
        "seed": 414537,
        "scene": (
            CAM + PLACE + HERO + PAIZURI_CLOTHES
            + "paizuri, breast press, breasts squeezed together, "
            + PENIS + GAZE
            + "blush, "
            + HAIR
        ),
        "extra_neg": "fellatio, penis in mouth, kissing, cum, ejaculation, bottomless, completely nude, shirtless male, sweater, bra",
    },
    {
        "name": "08_paizuri_cum",
        "seed": 414548,
        "scene": (
            CAM + PLACE + HERO + PAIZURI_CLOTHES
            + "paizuri, breast press, ejaculation, cum on breasts, "
            + PENIS + GAZE
            + "smile, happy, blush, "
            + HAIR
        ),
        "extra_neg": "fellatio, penis in mouth, facial, cum on face, bottomless, completely nude, shirtless male, sweater, bra",
    },
    {
        "name": "09_endured",
        "seed": 414539,
        "scene": (
            CAM + PLACE + HERO + CLOTHES
            + "kneeling, between legs, penis, erection, open mouth, leaning back, "
            + GAZE
            + "frustrated, stunned, blush, "
            + HAIR
        ),
        "extra_neg": "cum, ejaculation, semen, paizuri, topless, bottomless, penis in mouth, fellatio, kissing, french kiss",
    },
]


def payload(job: dict) -> dict:
    prompt = PREFIX + job["scene"] + TAIL
    return {
        "prompt": prompt,
        "negative_prompt": NEG + ", " + job["extra_neg"],
        "steps": 28,
        "width": 1024,
        "height": 1344,
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
        print("start", job["name"], flush=True)
        with urllib.request.urlopen(req, timeout=900) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        dest.write_bytes(base64.b64decode(data["images"][0]))
        meta = {
            "name": job["name"],
            "seed": job["seed"],
            "prompt": payload(job)["prompt"],
            "negative_prompt": payload(job)["negative_prompt"],
        }
        (OUT / f"{job['name']}_{job['seed']}.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print("done", dest, flush=True)


if __name__ == "__main__":
    main()