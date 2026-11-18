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
beats = [
 ("006_01_kiss", pov + f"{H}, {room}, (kissing glans:1.4), lips touching tip of penis, tongue tip out, hand holding base, saliva strand, heavy blush, smile"),
 ("006_02_lick", pov + f"{H}, {room}, (licking shaft:1.4), tongue on underside of penis, (glans:1.2), saliva, hand holding base, half-lidded eyes, heavy blush"),
 ("006_03_shallow", pov + f"{H}, {room}, (fellatio:1.5), (penis in mouth:1.4), taking only the glans, lips around tip, cheek bulge, saliva, hand holding base, heavy blush"),
 ("006_04_deep", pov + f"{H}, {room}, (fellatio:1.5), (penis in mouth:1.4), taking half the shaft, hollow cheeks, saliva dripping on chin, tears at eyes, hand at base, heavy blush"),
 ("006_05_pulloff", pov + f"{H}, {room}, mouth just pulled off penis, saliva strands from lips to glans, (glans:1.2), hand holding base, panting, open mouth, mischievous grin, holding smartphone timer"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))







