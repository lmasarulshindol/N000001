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
cg = f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), (head out of frame:1.6), (cropped head:1.4), man's torso only, (cowgirl position:1.4), girl straddling man on bed, (vaginal:1.3), (penis in pussy:1.3), single penis, skirt lifted, from side, "
beats = [
 ("009_01_thrust", cg + "man's hands gripping her hips, hips thrusting up, deep penetration, her head thrown back, mouth open, eyes squeezed shut, heavy blush"),
 ("009_02_cry", cg + "arched back, hands on his chest, trembling thighs, moaning, tears at eyes, heavy blush, looking down"),
 ("009_03_rhythm", cg + "man's hands on her hips lifting her, bouncing, breasts bouncing, motion lines, sweat, half-lidded eyes, panting, heavy blush"),
 ("009_04_melt", cg + "leaning forward with hands on his chest, hair hanging, drool, melted expression, breasts hanging, heavy blush, sweat"),
 ("009_05_deep", cg + "sitting fully down on him, thighs pressed against his hips, clutching sheets, chin up, eyes rolling slightly, trembling, heavy blush, open mouth"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))











