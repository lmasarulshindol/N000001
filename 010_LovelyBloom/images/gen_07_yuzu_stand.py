"""ゆず(18歳・145cm)の立ち絵。gen_04 の設定を流用。"""
from __future__ import annotations

import base64
import json
import random
import sys
import urllib.request

import gen_04_new_actresses as g

g.OUT = g.OUT  # 出力先は 04_新人女優

YUZU = {
    "name": "yuzu",
    "desc": (
        "1girl, solo, 18 years old, young woman, (very petite:1.4), (short stature:1.4), mini body, "
        "slender, (small breasts:1.3), slim waist, "
        "(honey brown hair:1.4), twintails, fluffy hair, "
        "(large round eyes:1.3), (amber eyes:1.3), (fair healthy skin tone:1.2), "
        "cheerful smile, blush, "
        "(lemon yellow babydoll:1.6), (see-through babydoll:1.5), sheer fabric, thin straps, "
        "(no bra:1.4), (no panties:1.4), nipples visible through clothes, "
    ),
}


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    g.OUT.mkdir(parents=True, exist_ok=True)
    rng = random.SystemRandom()
    for _ in range(count):
        seed = rng.randrange(1, 2**31 - 1)
        body = g.payload(YUZU, seed)
        body["negative_prompt"] += ", (pale skin:1.3), (sickly white skin:1.4)"
        dest = g.OUT / f"yuzu_stand_{seed}.png"
        req = urllib.request.Request(
            g.URL, data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        print("start", seed, flush=True)
        with urllib.request.urlopen(req, timeout=900) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        dest.write_bytes(base64.b64decode(data["images"][0]))
        dest.with_suffix(".json").write_text(
            json.dumps({"name": "yuzu", "seed": seed, "prompt": body["prompt"],
                        "negative_prompt": body["negative_prompt"]},
                       ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print("done", dest.name, flush=True)


if __name__ == "__main__":
    main()
