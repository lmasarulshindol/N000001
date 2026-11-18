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
 + look["forbid"])
H = look["heroine_look"] + ", " + look["outfit"]
S = look["location"]
beats = [
 ("003_01_happy", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male, head out of frame:1.3), sitting at round table, she lights up, both hands clasped, big happy smile, sparkling eyes, blush, upper body, from side"),
 ("003_02_rule", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting at round table, she holds up ten fingers in front of man, teasing smile, one eye closed, blush, upper body, from side"),
 ("003_03_nama", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting at round table, she leans in whispering behind her hand, shy embarrassed smile, deep blush, eyes averted, upper body, from side"),
 ("003_04_lose", f"1girl, {H}, {S}, sitting at table, finger on chin, thinking face, playful pout, head tilted, cowboy shot, from front, looking away"),
 ("003_05_lead", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), standing up from table, she holds man's hand and pulls him along, looking back with bright smile, blush, cowboy shot, from side"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))



