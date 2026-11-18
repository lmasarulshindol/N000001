"""手コキ射精の顔合わせを残して、フェラ／手と口の射精へ寄せる。"""
from __future__ import annotations

import base64
import json
import struct
import urllib.request

import gen_02_viewer as g

URL = "http://127.0.0.1:7860/sdapi/v1/img2img"
SRC = g.OUT / "02_handjob_cum_1747468747.png"
KEEP = (
    "(same framing:1.35), (both faces stay in frame:1.65), "
    "(she keeps looking at his face:1.6), (single penis:1.7), "
    "(the penis in her hand goes into her mouth:1.55), "
)
EXTRA = "(two penises:1.95), (multiple penises:1.9), (duplicate penis:1.85), "


def png_size(path) -> tuple[int, int]:
    data = path.read_bytes()
    width, height = struct.unpack(">II", data[16:24])
    return width, height


def run(name: str, seed: int, scene: str, extra_neg: str, denoise: float) -> None:
    width, height = png_size(SRC)
    raw = base64.b64encode(SRC.read_bytes()).decode("ascii")
    body = {
        "init_images": [raw],
        "prompt": g.PREFIX + g.HERO + KEEP + scene + g.TAIL,
        "negative_prompt": g.NEG + ", " + EXTRA + extra_neg,
        "steps": 28,
        "cfg_scale": 5.5,
        "sampler_name": "Euler a",
        "scheduler": "Automatic",
        "seed": seed,
        "denoising_strength": denoise,
        "width": width,
        "height": height,
        "batch_size": 1,
        "n_iter": 1,
        "enable_hr": False,
        "save_images": False,
        "send_images": True,
        "override_settings": {
            "sd_model_checkpoint": "waiIllustriousSDXL_v170.safetensors",
            "CLIP_stop_at_last_layers": 2,
        },
        "override_settings_restore_afterwards": False,
    }
    dest = g.OUT / f"{name}_{seed}.png"
    req = urllib.request.Request(
        URL,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    print("start", name, flush=True)
    with urllib.request.urlopen(req, timeout=900) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    dest.write_bytes(base64.b64decode(data["images"][0]))
    print("done", dest, flush=True)


def main() -> None:
    by_name = {job["name"]: job for job in g.JOBS}
    fellatio = by_name["04_fellatio_cum"]
    hands = by_name["06_hand_and_mouth_cum"]
    run("04_fellatio_cum", 414604, fellatio["scene"], fellatio["extra_neg"], 0.74)
    run("06_hand_and_mouth_cum", 414606, hands["scene"], hands["extra_neg"], 0.74)


if __name__ == "__main__":
    main()
