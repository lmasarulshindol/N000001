"""みお・ここね バストアップ（可愛さ重視）。gen_04 の設定を流用。"""
from __future__ import annotations

import base64
import json
import random
import sys
import urllib.request
from pathlib import Path

import gen_04_new_actresses as g

OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\04_新人女優\bust")

SHOT = (
    "(upper body:1.5), (bust shot:1.4), portrait, (looking at viewer:1.4), "
    "(cute face:1.3), (beautiful detailed eyes:1.3), (eye highlights:1.3), sparkling eyes, "
    "soft blush, playroom, love hotel room, indoors, dim warm lighting, blurry background, "
)

CHARS = [
    {
        "name": "mio",
        "desc": (
            "1girl, solo, 18 years old, (black hair:1.5), long straight hair, blunt bangs, "
            "(big eyes:1.2), (dark purple eyes:1.3), shy gentle expression, soft smile, "
            "(pale skin:1.3), mole under left collarbone, slender, small breasts, "
            "(indigo blue babydoll:1.6), (see-through babydoll:1.5), sheer fabric, thin straps, "
            "(no bra:1.4), nipples visible through clothes, "
        ),
    },
    {
        "name": "kokone",
        "desc": (
            "1girl, solo, 18 years old, (light chestnut brown hair:1.5), medium hair, "
            "inward curled ends, side braid, (large round eyes:1.3), (brown eyes:1.4), "
            "(large breasts:1.4), bright cheerful smile, open mouth smile, blush, "
            "(mint green babydoll:1.6), (see-through babydoll:1.5), sheer fabric, thin straps, "
            "(no bra:1.4), nipples visible through clothes, "
        ),
    },
]


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    OUT.mkdir(parents=True, exist_ok=True)
    rng = random.SystemRandom()
    for c in CHARS:
        for _ in range(count):
            seed = rng.randrange(1, 2**31 - 1)
            body = g.payload({"desc": c["desc"]}, seed)
            body["prompt"] = g.PREFIX + c["desc"] + SHOT + g.TAIL
            body["negative_prompt"] = g.NEG.replace("sitting, lying, from behind,", "full body, from behind,")
            body["width"], body["height"] = 1024, 1216
            dest = OUT / f"{c['name']}_bust_{seed}.png"
            req = urllib.request.Request(
                g.URL, data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            print("start", c["name"], seed, flush=True)
            with urllib.request.urlopen(req, timeout=900) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            dest.write_bytes(base64.b64decode(data["images"][0]))
            dest.with_suffix(".json").write_text(
                json.dumps({"seed": seed, "prompt": body["prompt"],
                            "negative_prompt": body["negative_prompt"]},
                           ensure_ascii=False, indent=2), encoding="utf-8")
            print("done", dest, flush=True)


if __name__ == "__main__":
    main()
