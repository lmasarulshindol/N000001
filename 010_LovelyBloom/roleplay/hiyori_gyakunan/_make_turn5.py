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
pov = "1girl, 1boy, hetero, pov, (pov crotch:1.3), male pubic hair, (detailed penis:1.3), (glans:1.2), single penis, (handjob:1.4), kneeling between his legs, from above, (looking up at man:1.4), (upturned eyes:1.3), "
beats = [
 ("005_01_slow", pov + f"{H}, {room}, her small right hand slowly stroking shaft, left hand on his thigh, gentle smile, blush, saliva"),
 ("005_02_spit", pov + f"{H}, {room}, mouth open letting saliva drip onto glans, tongue slightly out, both hands around shaft, saliva strands, teasing smile, heavy blush"),
 ("005_03_palm", pov + f"{H}, {room}, her palm rubbing the glans in circles, other hand holding base, precum, wet sheen, smirk, heavy blush"),
 ("005_04_twohands", pov + f"{H}, {room}, both hands twisting around shaft, fast strokes, precum, saliva, panting, flushed face, excited smile"),
 ("005_05_tease", pov + f"{H}, {room}, fingers pinching base to hold it back, glans swollen, precum dripping, mischievous grin, holding smartphone timer in other hand, heavy blush"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))






