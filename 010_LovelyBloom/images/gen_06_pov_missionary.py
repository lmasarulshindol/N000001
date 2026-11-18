"""4名 POV 正常位（白いシーツ）5段階。1プロセスで20枚。既存ファイルはスキップ。"""
from __future__ import annotations

import base64
import json
import sys
import urllib.request
from pathlib import Path

import gen_04_new_actresses as g

OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\05_POV正常位")

BASE = (
    "pov, (missionary:1.5), (lying on back:1.5), (white bed sheet:1.5), white sheets, white pillow, "
    "from above, (looking at viewer:1.3), spread legs, 1boy, faceless male, (male out of frame:1.3), "
    "bedroom, soft warm light, "
)

STAGES = [
    ("01_before", "(penis:1.3), (glans pressing against pussy:1.5), (about to penetrate:1.4), "
                  "pussy, anticipation, nervous, (blush:1.3), hands near chest, babydoll pulled up, "),
    ("02_near", "sex, vaginal, (penis inside pussy:1.5), (sex from front:1.3), (trembling:1.3), "
                "(heavy blush:1.5), sweat, half-closed eyes, tears in eyes, biting lip, clenched teeth, gripping sheets, "),
    ("03_orgasm", "sex, vaginal, (penis inside pussy:1.4), (orgasm:1.6), (arched back:1.4), head back, "
                  "(closed eyes:1.3), open mouth, (heavy blush:1.5), sweat, toes curling, gripping sheets, "),
    ("04_creampie", "sex, vaginal, (cum in pussy:1.6), (creampie:1.4), (orgasm:1.5), "
                    "(legs wrapped around his waist:1.5), (heavy blush:1.5), sweat, tears, open mouth, looking at viewer, "),
    ("05_afterglow", "after sex, (cum in pussy:1.5), (cum overflow:1.4), (cum dripping from pussy:1.4), spread legs, "
                     "exhausted, (half-closed eyes:1.3), (soft smile:1.3), sweat, heavy breathing, (blush:1.4), looking at viewer, "),
]

# gen_04 の desc から服装・立ち絵向けの表情を外し、髪・目・体型のみ流用
CHARS = [
    ("hiyori", 22,
     "1girl, solo, 22 years old, young woman, petite, short stature, curvy figure, (large breasts:1.4), slim waist, "
     "(beige hair:1.5), (pale brown hair:1.4), (shoulder-length hair:1.5), wavy hair, outward curls, "
     "big droopy eyes, tareme, (brown eyes:1.4), dimple on right cheek, "
     "(coral pink babydoll:1.5), (see-through babydoll:1.4), (babydoll lifted:1.3), (nude:1.2), "),
    ("mio", 18,
     "1girl, solo, 18 years old, (black hair:1.5), long straight hair, blunt bangs, "
     "(dark purple eyes:1.3), narrow eyes, (fair skin:1.2), (natural healthy skin tone:1.3), (warm skin tone:1.2), mole under left collarbone, slender, long legs, (small breasts:1.2), "
     "(indigo blue babydoll:1.5), (see-through babydoll:1.4), (babydoll lifted:1.3), (nude:1.2), "),
    ("kokone", 18,
     "1girl, solo, 18 years old, (light chestnut brown hair:1.5), medium hair, inward curled ends, side braid, "
     "(large round eyes:1.3), (brown eyes:1.4), (large breasts:1.4), slim waist, narrow shoulders, mole on right wrist, "
     "(mint green babydoll:1.5), (see-through babydoll:1.4), (babydoll lifted:1.3), (nude:1.2), "),
    ("sara", 18,
     "1girl, solo, 18 years old, (dark brown hair:1.5), long hair, soft inner waves, glossy hair, "
     "sharp upturned eyes, double eyelid, long legs, slender, medium breasts, "
     "(wine red babydoll:1.5), (see-through babydoll:1.4), (babydoll lifted:1.3), (nude:1.2), "),
]

SEEDS = {"hiyori": 61101, "mio": 61202, "kokone": 61303, "sara": 61404}

NEG_EXTRA = ", child, loli, underage, 2girls, multiple girls, (male face:1.6), (man's face:1.5), chibi, reference sheet, standing, clothed sex, bra, panties, cross-section, internal view, x-ray, cutaway, uterus, womb, (pale skin:1.3), (pallid skin:1.3), (sickly white skin:1.4), desaturated skin"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tries = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    for name, _age, desc in CHARS:
        for sid, tags in STAGES:
            for t in range(tries):
                seed = SEEDS[name] + t * 1000
                dest = OUT / f"{name}_{sid}_{seed}.png"
                if dest.exists():
                    continue
                body = g.payload({"desc": desc}, seed)
                body["prompt"] = g.PREFIX + desc + BASE + tags + g.TAIL
                neg = g.NEG.replace("sitting, lying, from behind, bra, panties, underwear", "from behind")
                body["negative_prompt"] = neg + NEG_EXTRA
                body["width"], body["height"] = 1216, 832
                req = urllib.request.Request(
                    g.URL, data=json.dumps(body).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                )
                print("start", dest.name, flush=True)
                with urllib.request.urlopen(req, timeout=900) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                dest.write_bytes(base64.b64decode(data["images"][0]))
                print("done", dest.name, flush=True)
    print("batch complete", flush=True)


if __name__ == "__main__":
    main()
