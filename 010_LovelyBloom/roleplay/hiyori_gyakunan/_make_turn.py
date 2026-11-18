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
 ("001_01_scout", f"1girl, solo, {H}, {S}, sitting at cafe terrace table, holding iced drink with both hands, scanning the street, looking to the side, pouty thinking face, upper body, from front slightly right, ((no men in frame))"),
 ("001_02_found", f"1girl, {H}, {S}, standing at terrace railing, hand on chest, wide eyes, blush, looking off to the side at a distant table, excited smile, cowboy shot, from behind slightly left, (distant faceless man reading a book at table in background:1.2)"),
 ("001_03_approach", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male, head out of frame:1.3), standing beside table, leaning forward slightly with hands behind back, bright playful smile, blush, looking down at man, cowboy shot, from side"),
 ("001_04_sit", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting across the same small round table, elbows on table, leaning in, shy smile, dimple, blush, hand reaching toward man's hand on table, upper body, from side"),
 ("001_05_ask", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting side by side on terrace bench, she holds man's sleeve with both hands, tilted head, pleading puppy smile, flushed cheeks, looking up at man, close shot, from side"),
]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))
