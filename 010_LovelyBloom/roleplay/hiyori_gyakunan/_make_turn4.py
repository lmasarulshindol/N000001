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
room = "hotel room, large white bed, white sheets, warm bedside lamp, closed curtains, indoors, evening"
beats = [
 ("004_01_walk", f"1girl, 1boy, hetero, {H}, {look['male_look']}, city street in Shinjuku, building entrance, afternoon, (faceless male, head out of frame:1.3), she holds man's hand and walks ahead, looking back with happy smile, blush, cowboy shot, from side"),
 ("004_02_room", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {room}, (faceless male, head out of frame:1.3), standing at door, she stands before him hands behind back, shy smile, blush, looking up at man, cowboy shot, from side"),
 ("004_03_timer", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {room}, (faceless male:1.3), man sitting on edge of bed, she kneels on floor in front of him, holding smartphone timer in one hand, other hand on his thigh, teasing smile, blush, looking up at man, from side"),
 ("004_04_touch", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {room}, (faceless male:1.3), man sitting on edge of bed, she kneels between his legs, hand rubbing bulge through trousers, erection under trousers, blush, looking at crotch, smile, from side"),
 ("004_05_handjob", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {room}, (faceless male, head out of frame:1.3), man sitting on edge of bed, she kneels between his legs, trousers pulled down, (handjob:1.4), (detailed penis:1.3), (glans:1.2), single penis, her small hand wrapped around shaft, saliva, heavy blush, looking at penis, happy smile, from side"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))





