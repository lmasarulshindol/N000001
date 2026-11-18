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
 ("002_01_whisper", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male, head out of frame:1.3), sitting at round table, she leans in close whispering behind her hand toward man, shy smile, blush, eyes glancing sideways, upper body, from side"),
 ("002_02_explain", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting at round table, she holds a small coral smartphone showing a screen to man, finger to lips shushing, embarrassed smile, blush, upper body, from side"),
 ("002_03_confirm", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting at round table, she clasps both hands in front of chest, worried pleading eyes, blush, looking up at man, upper body, from side"),
 ("002_04_crew", f"1girl, {H}, {S}, sitting at table, turning head slightly toward far street corner, (tiny distant camera crew with video camera on tripod far away on street:1.2), small wave, nervous laugh, blush, cowboy shot, from front"),
 ("002_05_hands", f"1girl, 1boy, hetero, {H}, {look['male_look']}, {S}, (faceless male:1.3), sitting at round table, her small hands wrapped over man's big hand on table, tilted head, shy pleading smile, blush, looking up at man, close shot, from side"),]
jobs = [{"filename_prefix": n, "prompt": p, "negative_prompt": neg} for n, p in beats]
(root / "_rp_turn.json").write_text(json.dumps({"defaults": defaults, "jobs": jobs}, ensure_ascii=False, indent=2), encoding="utf-8")
print("ok", len(jobs))

