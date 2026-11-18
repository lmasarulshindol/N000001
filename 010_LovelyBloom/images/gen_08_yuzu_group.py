"""ゆず(18歳)の複数人プレイ(店の特別コース)シーン。gen_04 / gen_06 の設定を流用。"""
from __future__ import annotations

import base64
import json
import sys
import urllib.request
from pathlib import Path

import gen_04_new_actresses as g

OUT = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom\images\06_ゆず複数人")

CHAR = (
    "1girl, solo focus, 18 years old, young woman, (very petite:1.4), (short stature:1.4), mini body, "
    "slender, (small breasts:1.3), slim waist, (honey brown hair:1.4), twintails, fluffy hair, "
    "(large round eyes:1.3), (amber eyes:1.3), (fair healthy skin tone:1.2), "
    "(heavy blush:1.5), (full-body blush:1.3), (sweat:1.4), (drooling:1.3), saliva, (tears:1.2), (trembling:1.3), (rolling eyes:1.1), (open mouth:1.2), (moaning:1.3), (heart-shaped pupils:1.1), (steam:1.2), (motion lines:1.3), (emphasis lines:1.2), (motion blur:1.3), (blurry foreground:1.2), (depth of field:1.2), (sound effects:0.0),  (lemon yellow babydoll:1.4), (see-through babydoll:1.3), (babydoll lifted:1.3), (nude:1.2), "
    "(gangbang:1.5), (group sex:1.4), (multiple boys:1.4), (many hands:1.2), (hands on body:1.2), faceless male, (male faces out of frame:1.4), (no male faces:1.3), "
    "bedroom, soft warm light, "
)

SCENES = [
    ("01_kneeling_service",
     "(kneeling on floor:1.5), (4boys:1.5), (handjob:1.4), (fellatio:1.5), (double handjob:1.2), (bukkake:1.2), (cum on face:1.3), (multiple penises:1.3), "
     "looking up at viewer, tears in eyes, from above, "),
    ("02_standing_doggy_fellatio",
     "(standing sex from behind:1.5), (doggystyle:1.2), (bent over:1.4), (3boys:1.5), (fellatio:1.5), "
     "(penis in pussy:1.4), (penis in mouth:1.4), gripping male's thighs, moaning, from side, "),
    ("03_doggy_fellatio",
     "(doggystyle:1.5), (all fours:1.4), (3boys:1.5), (sex from behind:1.4), (fellatio:1.5), (penis in mouth:1.4), "
     "(penis in pussy:1.4), (arched back:1.3), ass up, from side, "),
    ("04_missionary_service",
     "(missionary:1.5), (lying on back:1.5), (4boys:1.5), (vaginal:1.4), (penis in pussy:1.4), "
     "(handjob:1.4), (fellatio:1.4), (holding penis in each hand:1.3), (penis in mouth:1.3), from above, "),
    ("05_creampie_facial",
     "(missionary:1.4), (4boys:1.5), (cum in pussy:1.5), (creampie:1.4), (cum on face:1.5), (cum on breasts:1.5), "
     "(facial:1.4), (bukkake:1.2), (orgasm:1.5), (ahegao-like:0.0), half-closed eyes, open mouth, from above, "),
    ("06_cowgirl_service",
     "(girl on top:1.4), (cowgirl position:1.5), (4boys:1.5), (vaginal:1.4), (penis in pussy:1.4), "
     "(handjob:1.4), (fellatio:1.3), (spread legs:1.3), (bouncing:1.2), looking at viewer, "),
    ("07_spitroast_lifted",
     "(suspended congress:1.4), (held up by 2boys:1.4), (4boys:1.5), (double penetration:1.2), (fellatio:1.4), "
     "(spread legs:1.4), (legs held:1.4), from front, sweat, "),
    ("08_surrounded_afterglow",
     "(lying on back:1.4), (surrounded by 6boys:1.4), (multiple penises:1.3), (cum on face:1.5), (cum on breasts:1.5), "
     "(cum on stomach:1.4), (cum in pussy:1.4), (cum dripping from pussy:1.4), exhausted, (half-closed eyes:1.3), "
     "weak smile, spread legs, from above, "),
]

NEG_EXTRA = (
    ", child, loli, underage, chibi, reference sheet, standing alone, clothed sex, bra, panties, "
    "(male face:1.6), (man's face:1.5), fat man, old man, "
    "cross-section, internal view, x-ray, cutaway, uterus, womb, "
    "(pale skin:1.3), (sickly white skin:1.4), desaturated skin"
)


def main() -> None:
    tries = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    OUT.mkdir(parents=True, exist_ok=True)
    for sid, tags in SCENES:
        for t in range(tries):
            seed = 62001 + t * 1000
            dest = OUT / f"yuzu_{sid}_{seed}.png"
            if dest.exists():
                continue
            body = g.payload({"desc": ""}, seed)
            body["prompt"] = g.PREFIX + CHAR + tags + g.TAIL
            neg = g.NEG.replace("1boy, male, extra person, ", "")
            neg = neg.replace("2girls, ", "2girls, multiple girls, ")
            neg = neg.replace("sitting, lying, from behind, bra, panties, underwear", "")
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
    print("batch complete")


if __name__ == "__main__":
    main()

