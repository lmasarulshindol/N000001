import json, pathlib
root = pathlib.Path(__file__).parent
d = json.loads(pathlib.Path(r"c:\Users\lmasa\Cursor\N000001\001_BabyDoll\roleplay\_rp_sd_roleplay_defaults.json").read_text(encoding="utf-8"))
defaults = dict(d["batch_defaults"]); defaults.update(width=1344, height=768)
look = json.loads((root / "_rp_look.json").read_text(encoding="utf-8"))
neg = ("score_4, score_5, score_6, (worst quality), (low quality), (bad anatomy), text, watermark, signature, "
 "worst quality, low quality, bad anatomy, extra fingers, deformed eyes, deformed ears, animal ears, elf ears, ahegao, tongue out, "
 "hair ornament, jewelry, earrings, piercing, tattoo, mature body, tall, censored, mosaic, lens flare, multiple heads, mutated head, "
 "extra body parts, deformed, two faces, child, loli, underage, flat chest, black hair, blonde hair, blue hair, dark brown hair, "
 "(waxy skin:1.4), (buttery skin:1.35), 3d render, photorealistic, anime screencap, "
 "(animal ears:1.8), (cat ears:1.8), (kemonomimi:1.8), (elf ears:1.8), (pointy ears:1.8), crown, "
 "2girls, multiple girls, (2boys:1.6), (multiple boys:1.6), extra person, (looking at viewer:1.5), (looking at camera:1.5), "
 + look["forbid"] + ", (2boys:1.7), (two penises:1.7), (multiple penises:1.7), (extra penis:1.6)")
H = look["heroine_look"] + ", " + look["outfit"]
S = look["location"]
room = "hotel room, large white bed, white sheets, warm bedside lamp, closed curtains, indoors, evening"
pov = "1girl, 1boy, hetero, pov, (pov crotch:1.3), male pubic hair, (detailed penis:1.3), single penis, kneeling between his legs, from above, (looking up at man:1.4), (upturned eyes:1.3), "
pov2 = "1girl, 1boy, hetero, pov, (pov crotch:1.3), male pubic hair, (detailed penis:1.2), single penis, kneeling between his legs, from above, (looking up at man:1.4), (upturned eyes:1.3), "
beats = [
 ("008_01_last", pov2 + f"{H}, {S}, (paizuri:1.5), breasts pressing tightly around shaft, fast, glans peeking out, sweat, heavy blush, panting, determined smile"),
 ("008_02_timer", f"1girl, 1boy, hetero, {H}, {S}, (faceless male, head out of frame:1.3), kneeling on bed, holding smartphone with ringing timer in front of her, surprised happy face, wide eyes, blush, bare breasts, from side, man sitting on bed edge"),
 ("008_03_pleased", f"1girl, solo, {H}, {S}, sitting on bed, hands on cheeks, overjoyed shy smile, heavy blush, sparkling eyes, bare breasts, looking up, upper body, from front"),
 ("008_04_panties", f"1girl, {H}, {S}, kneeling on bed, one hand lifting her pleated skirt, pulling pink panties down her thighs under the skirt, shy smile, heavy blush, looking at man, from side, bare breasts"),
 ("008_05_hover", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male, head out of frame:1.3), (cowgirl position:1.3), girl straddling man on bed, hovering above penis, holding skirt up with one hand, glans touching her pussy, vaginal, heavy blush, looking down at man, from side"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))










