"""
莉子4作目「終わらない生中出し ～二泊三日の南国旅行～」
全シーン × 各10枚の画像を生成するスクリプト

使用API: AUTOMATIC1111 WebUI (stable-diffusion-webui)
デフォルトエンドポイント: http://127.0.0.1:7860
"""

import json
import sys
import base64
import time
import random
import argparse
from pathlib import Path
from urllib import request, error

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# ============================================================
# 設定
# ============================================================

API_URL = "http://127.0.0.1:7860"
OUTPUT_DIR = Path(__file__).parent / "generated_images"
IMAGES_PER_SCENE = 10

DEFAULT_PARAMS = {
    "steps": 30,
    "cfg_scale": 7.5,
    "width": 832,
    "height": 1216,
    "sampler_name": "DPM++ 2M SDE",
    "scheduler": "Karras",
    "seed": -1,
    "batch_size": 1,
    "n_iter": 1,
}

# ============================================================
# スタイル: 同人誌・エロゲCG風（Style B）
# ============================================================

QUALITY_PREFIX = (
    "masterpiece, best quality, absurdres, highres, "
    "game cg, visual novel cg, detailed skin texture, "
    "soft shading, gradient shading, glossy skin, "
    "detailed collarbone, detailed navel, "
    "professional illustration"
)

# ============================================================
# キャラクター固定タグ（莉子 南国旅行バージョン v6）
# ============================================================

RIKO_BASE = (
    "(1girl:1.3, loli, child, petite, short stature, small frame, "
    "flat chest, narrow hips, thin arms, thin legs, "
    "light pink hair:1.2, shoulder-length hair, wavy hair, hair down:1.1, "
    "hair falling naturally, hair not sticking up, "
    "aqua blue eyes:1.1, both eyes visible, symmetrical eyes, detailed eyes, "
    "long eyelashes, normal round pupils, "
    "small human ears, ears visible, "
    "pale skin, fair skin, smooth skin, "
    "no hair ornament, no accessories)"
)

NEGATIVE_BASE = (
    # 品質
    "worst quality, low quality, bad quality, normal quality, oldest, very displeasing, "
    "bad anatomy, anatomical nonsense, bad proportions, bad perspective, "
    # 手指
    "extra fingers, missing fingers, fused fingers, too many fingers, "
    "poorly drawn hands, bad hands, "
    # 体パーツ
    "extra arms, extra legs, extra limbs, fused limbs, merged bodies, "
    # 顔・目の崩壊防止
    "deformed eyes, asymmetric eyes, mismatched eyes, crushed eyes, "
    "missing eye, extra eyes, one eye closed unintentionally, "
    "poorly drawn eyes, melting eyes, fused eyes, "
    "deformed pupils, no pupils, empty eyes, "
    # 耳の崩壊防止 + 獣耳防止
    "deformed ears, missing ears, extra ears, misplaced ears, "
    "elf ears, pointy ears, animal ears, cat ears, fox ears, dog ears, "
    "bunny ears, kemonomimi, nekomimi, ear fluff, "
    "poorly drawn ears, melting ears, ears too high, ears too low, "
    "hair antenna, ahoge, hair sticking up, hair tufts on top of head, "
    # アヘ顔・舌出し禁止
    "ahegao, rolling eyes, rolled eyes, eyes rolled back, "
    "tongue out, tongue sticking out, long tongue, drooling excessively, "
    "crazy expression, insane expression, mindbreak, heart-shaped pupils, "
    # 髪・アクセ
    "hair ornament, hair clip, hairpin, hairband, headband, hair ribbon, "
    "x hair ornament, cross hair ornament, bandaid on face, bandaid, bandage, "
    "forehead mark, forehead jewel, bindi, tiara, crown, "
    "multicolored hair, gradient hair, streaked hair, blue hair, "
    # 年齢体型ミス
    "mature woman, large breasts, medium breasts, tall girl, muscular girl, wide hips, "
    "old man, elderly, ugly bastard, bodybuilder, huge muscles, very muscular, "
    # 検閲
    "censored, mosaic censorship, bar censor, blur censor, "
    # 断面
    "cross-section, x-ray, xray, uterus, womb, anatomy cutaway, "
    # その他
    "jewelry, earrings, piercing, tattoo, collar, leash, "
    "lens flare, light leaks, chromatic aberration, "
    "watermark, signature, text, logo, username, artist name"
)

# 体位別ネガティブ（性行為シーンで使用）
NEG_NOT_MISSIONARY = (
    "doggy style, all fours, from behind, bent over, "
    "cowgirl position, girl on top, riding, reverse cowgirl, "
    "standing sex, standing position, "
    "side position, spooning, lateral, "
    "sitting position, lap sitting, "
    "prone bone, face down"
)

NEG_NOT_DOGGY = (
    "missionary, on back, lying down, "
    "cowgirl position, girl on top, riding, reverse cowgirl, "
    "standing sex, standing position, "
    "side position, spooning"
)

NEG_NOT_RIDING = (
    "missionary, on back, lying down, "
    "doggy style, all fours, from behind, bent over, "
    "standing sex, standing position, "
    "side position, spooning"
)

NEG_NOT_STANDING = (
    "lying down, on back, missionary, on bed, "
    "doggy style, all fours, bent over, "
    "cowgirl position, girl on top, riding"
)

# ============================================================
# 構図バリエーション（各シーンで10枚分ランダム選択用）
# ============================================================

CAMERA_ANGLES = [
    "from above, looking down",
    "from below, looking up",
    "from side, profile view",
    "from behind, looking back over shoulder",
    "dutch angle, tilted frame",
    "straight on, eye level",
    "bird's eye view",
    "worm's eye view, low angle",
    "three-quarter view",
    "close-up face, extreme close-up",
]

SHOT_DISTANCES = [
    "full body shot",
    "cowboy shot, upper body",
    "bust shot, upper body focus",
    "close-up portrait",
    "medium shot, waist up",
    "extreme close-up, face only",
    "full body, wide shot",
    "thigh-up shot",
    "knee shot",
    "upper body, arms visible",
]

COMPOSITIONS = [
    "rule of thirds",
    "centered composition, symmetrical",
    "off-center framing",
    "foreground bokeh, depth of field",
    "silhouette framing",
    "frame within frame",
    "leading lines",
    "negative space composition",
    "dynamic diagonal composition",
    "layered depth composition",
]

# ============================================================
# 全シーン定義（オープニングから旅行終了まで細分化）
# ============================================================

SCENES = [
    # ================================================================
    # DAY 1 — シーン1：到着
    # ================================================================
    {"id": "d1_01_airport", "name": "DAY1: 空港タラップ", "description": "飛行機を降りる莉子。両手を広げて海に向かって叫ぶ", "outfit": "white summer dress, straw sun hat, sandals, small travel bag", "setting": "tropical airport tarmac, airplane stairs, palm trees, vivid blue sky, ocean in distance", "mood": "excited, arms spread wide, genuinely happy, childlike wonder, laughing, open mouth joy", "lighting": "bright tropical midday sun, vivid blue sky, strong sunlight, warm sunbeams", "extra": "wind blowing dress and hair, luggage at feet, tropical air shimmer, stepping off plane", "aspect": (832, 1216)},
    {"id": "d1_02_car_ocean", "name": "DAY1: 海沿いドライブ", "description": "送迎車の窓から海を眺める。エメラルドグリーンの海にうっとり", "outfit": "white summer dress, hat in lap, hair wind-blown", "setting": "inside car backseat, open window, coastal road, emerald green ocean outside, palm-lined highway", "mood": "mesmerized, wide eyes, mouth slightly open, awestruck, leaning toward window", "lighting": "bright sunlight through car window, warm natural light, ocean reflections", "extra": "wind from open window blowing hair, ocean sparkling, distant islands visible", "aspect": (1216, 832)},
    {"id": "d1_03_villa_exterior", "name": "DAY1: ヴィラ外観", "description": "ヴィラ到着。白い壁、プール、オーシャンビュー。驚く莉子", "outfit": "white summer dress, sandals, sun hat, travel bag", "setting": "luxury private villa exterior, white walls, infinity pool, ocean view terrace, tropical garden, blue sky", "mood": "amazed, jaw dropped, looking up at building, overwhelmed by luxury, spinning around to take it all in", "lighting": "bright afternoon sun, white villa reflecting light, tropical clarity", "extra": "villa entrance, bougainvillea flowers, palm trees, turquoise pool water visible", "aspect": (1216, 832)},
    {"id": "d1_04_villa_interior", "name": "DAY1: ヴィラ室内", "description": "広いリビングに入る。天井が高い。窓の向こうに海", "outfit": "white summer dress, barefoot on marble floor", "setting": "luxury villa interior, high ceiling, floor-to-ceiling windows, ocean view, modern furniture, marble floor", "mood": "exploring, touching furniture, childlike curiosity, comparing to own small apartment, excited", "lighting": "natural light through large windows, bright airy interior, ocean reflected light", "extra": "large living room, designer furniture, fruit basket on table, vast ocean through window", "aspect": (1216, 832)},
    {"id": "d1_05_terrace_manager", "name": "DAY1: テラスで店長と会話", "description": "テラスのテーブル。マンゴージュース。仮面を預ける約束", "outfit": "white summer dress, sitting in terrace chair, bare feet on stone", "setting": "villa terrace, ocean view, terrace table with two mango juice glasses, afternoon sun, rattan chairs", "mood": "serious but calm, determined eyes, direct gaze, making a promise, glass condensation on fingertips", "lighting": "warm afternoon terrace light, ocean backlight, soft shadows from overhead parasol", "extra": "two glasses of mango juice, condensation drops, ocean breeze, serious conversation atmosphere", "aspect": (1216, 832)},
    {"id": "d1_06_bikini_mirror", "name": "DAY1: ビキニに着替え（鏡の前）", "description": "白いビキニに着替えて鏡の前。恥ずかしそう。素の恥じらい", "outfit": "white triangle string bikini, barefoot, hair down", "setting": "villa bedroom, full-length mirror, white interior, afternoon light through curtains", "mood": "shy, blushing, looking at own reflection, slight embarrassment, hands fidgeting with bikini string, genuine shyness", "lighting": "soft bedroom light, afternoon sun through sheer curtains, warm diffused glow", "extra": "full-length mirror reflection, discarded white dress on bed, bikini strings visible, self-conscious pose", "aspect": (832, 1216)},
    {"id": "d1_07_beach_first_step", "name": "DAY1: 波打ち際へ駆け出す", "description": "ビーチに走り出す。波に足が触れて「きゃっ！」。十歳の笑顔", "outfit": "white triangle bikini, bare feet, hair flowing behind", "setting": "white sand beach, turquoise waves, foam at feet, clear sky, pristine tropical beach", "mood": "running, laughing, splashing, kicked by cold water, pure childlike joy, arms out for balance", "lighting": "bright beach sunlight, sparkling water, vivid blue sky, sun overhead", "extra": "water splashing at ankles, footprints in wet sand, hair streaming behind, ocean spray", "aspect": (832, 1216)},

    # ================================================================
    # DAY 1 — シーン2：砂浜——おにいさんと遊ぶ〜H
    # ================================================================
    {"id": "d1_08_beach_volley", "name": "DAY1: ビーチバレー", "description": "男優とビーチバレーで遊ぶ。ジャンプして打つ莉子", "outfit": "white triangle string bikini, barefoot on sand, hair bouncing", "setting": "white sand beach, beach volleyball net, turquoise ocean background, bright afternoon sun, clear blue sky", "mood": "jumping to hit ball, arms raised, athletic, laughing, competitive fun, energetic", "lighting": "bright afternoon tropical sun, vivid blue sky, warm sunlight on skin", "extra": "2people, hetero, age difference, beach volleyball, jumping, dynamic pose, sand kicking up, happy expression, sweat on skin", "aspect": (832, 1216)},
    {"id": "d1_09_splash_fight", "name": "DAY1: 波打ち際で水かけ", "description": "波打ち際で男優と水を掛け合って遊ぶ", "outfit": "white triangle string bikini, soaking wet, water droplets on skin", "setting": "beach shoreline, shallow turquoise water at ankles, white sand, afternoon sun, waves foaming", "mood": "splashing water at each other, laughing, playful, water in midair, childlike joy, mischievous grin", "lighting": "bright sun on water, sparkling reflections everywhere, warm natural light", "extra": "2people, hetero, age difference, water splashing, playing in waves, wet hair clinging to neck, dynamic motion", "aspect": (832, 1216)},
    {"id": "d1_10_chase", "name": "DAY1: 追いかけっこ", "description": "男優さんと追いかけっこ。逃げる莉子", "outfit": "white triangle string bikini, wet, running, hair flowing behind", "setting": "white sand beach, turquoise ocean, wide open beach, afternoon sun, footprints in sand", "mood": "running away laughing, looking back over shoulder, teasing expression, playful escape, breathless giggling", "lighting": "bright afternoon sun, golden warm light on running figures, sand sparkling", "extra": "2people, hetero, age difference, running on beach, looking back, hair streaming, sand flying from feet, happy escape", "aspect": (1216, 832)},
    {"id": "d1_11_caught_hug", "name": "DAY1: 捕まって後ろから抱きしめ", "description": "捕まって後ろから抱きしめられる。嬉しそうに笑う", "outfit": "white triangle string bikini, wet, being held from behind", "setting": "white sand beach, turquoise ocean background, afternoon sun, secluded beach area", "mood": "caught, being hugged from behind, laughing happily, leaning back into embrace, warm contact", "lighting": "warm afternoon sun, golden light on wet skin, ocean sparkle behind", "extra": "2people, hetero, age difference, hug from behind:1.3, man arms around girl waist, back against chest, happy laugh, head tilted back", "aspect": (832, 1216)},
    {"id": "d1_12_standing_kiss", "name": "DAY1: 後ろから抱きしめたままキス", "description": "同じ体勢で振り向いてキス。甘い表情", "outfit": "white triangle string bikini, wet skin glistening, being held", "setting": "white sand beach, ocean background, afternoon sun, intimate standing position", "mood": "turning head back for kiss, lips meeting, eyes half-closed, sweet expression, tender moment", "lighting": "warm golden afternoon light, sun on wet skin, soft romantic lighting", "extra": "2people, hetero, age difference, kiss:1.3, hug from behind, man holding girl, girl turning head back, lips touching, romantic, blushing", "aspect": (832, 1216)},
    {"id": "d1_13_fondle_standing", "name": "DAY1: 水着をズラして愛撫", "description": "水着をズラされて胸やおまんこを愛撫される。立ったまま", "outfit": "white triangle bikini pulled aside:1.3, nipples exposed, bikini bottom shifted, uncensored, explicit", "setting": "secluded beach area, ocean background, afternoon sun, standing together", "mood": "being fondled, gasping, knees weak, blushing deeply, mouth slightly open, pleasure building", "lighting": "warm afternoon sun, golden light on exposed skin, intimate outdoor", "extra": "2people, hetero, age difference, groping:1.2, breast grab, hand on pussy, fingering, standing, man behind girl, touching from behind, bikini shifted aside, erect nipples, wet skin, trembling legs", "aspect": (832, 1216)},
    {"id": "d1_14_standing_insert", "name": "DAY1: 立ったまま挿入", "description": "立ったまま後ろから挿入。声が出る", "outfit": "white bikini pulled aside, nude from waist down, standing bent slightly forward, uncensored, explicit", "setting": "secluded beach, ocean background, afternoon sun, standing sex on sand", "mood": "gasping from insertion, eyes wide, mouth open, gripping man's arms, knees buckling slightly", "lighting": "bright afternoon sun, warm golden light on bodies, sweat glistening", "extra": "2people, hetero, age difference, standing sex:1.4, sex from behind:1.3, vaginal sex:1.3, penis in pussy, standing insertion, man behind girl, hands on her hips, girl leaning forward slightly, sweat drops", "neg_extra": NEG_NOT_STANDING, "aspect": (832, 1216)},
    {"id": "d1_15_ekiben", "name": "DAY1: 駅弁", "description": "持ち上げられて駅弁体位。しがみつく莉子", "outfit": "white bikini completely shifted aside, legs wrapped around man, uncensored, explicit", "setting": "secluded beach, ocean in background, afternoon sun, lifted off ground", "mood": "clinging desperately, arms around neck, legs wrapped around waist, bouncing, moaning, overwhelmed", "lighting": "bright afternoon sun, sweat glistening on both bodies, warm light from all angles", "extra": "2people, hetero, age difference, carrying sex:1.4, ekiben:1.3, standing carry:1.3, vaginal sex:1.3, girl lifted off ground, legs wrapped around man, arms clinging to shoulders, deep penetration, bouncing, small body held up", "neg_extra": NEG_NOT_STANDING, "aspect": (832, 1216)},
    {"id": "d1_16_missionary_move", "name": "DAY1: シートに移動・正常位", "description": "シートの上に移動して正常位。脚を広げて受け入れる", "outfit": "white bikini disheveled barely on, lying on blue beach sheet, uncensored, explicit", "setting": "blue beach sheet on white sand, ocean in background, afternoon sun, secluded area", "mood": "lying on back, accepting, legs spread, looking up at man, flushed, panting, welcoming", "lighting": "bright afternoon sun from above, warm golden light, sand reflecting warmth", "extra": "2people, hetero, age difference, missionary position:1.4, vaginal sex:1.3, man on top:1.2, girl lying on back:1.3, legs spread, knees bent, penis in pussy, on beach sheet, sand on skin", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_17_missionary_pleasure1", "name": "DAY1: 気持ちいい①——目を細めて", "description": "正常位で気持ちよさそうな莉子。目を細めてとろける表情", "outfit": "white bikini barely on, lying on beach sheet, sweat glistening, uncensored, explicit", "setting": "blue beach sheet, white sand beach, ocean waves in background, bright sun", "mood": "melting with pleasure, half-lidded eyes, parted lips, soft moans, body relaxed into pleasure, dreamy", "lighting": "warm afternoon sun, golden light on flushed skin, sweat catching sunlight", "extra": "2people, hetero, age difference, missionary position:1.4, vaginal sex:1.3, man on top:1.2, girl lying on back:1.3, pleasure face, half-closed eyes, blushing, sweat on forehead, fingers curling on sheet", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_18_missionary_pleasure2", "name": "DAY1: 気持ちいい②——背中を反らして", "description": "背中を反らして腰を押し付ける。声が漏れる", "outfit": "white bikini shifted off, nude, on beach sheet, sweating, uncensored, explicit", "setting": "blue beach sheet, white sand, ocean sound, afternoon sun, intimate", "mood": "arching back, pressing hips up, moaning loudly, gripping sheet, toes curling, increasing pleasure", "lighting": "bright sun above, sweat glistening all over, warm golden shadows", "extra": "2people, hetero, age difference, missionary position:1.4, vaginal sex:1.3, man on top:1.2, girl lying on back, back arched off sheet:1.2, toes curled, gripping sheet, open mouth moan, full body blush", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_19_missionary_pleasure3", "name": "DAY1: 気持ちいい③——涙目で見上げる", "description": "涙目で男優を見上げる。「もっと」と言いたそうな顔", "outfit": "nude, on beach sheet, flushed all over, tears at corners of eyes, uncensored, explicit", "setting": "blue beach sheet, white sand beach, afternoon sun, ocean background", "mood": "looking up with teary eyes, begging expression, wanting more, trembling, emotional pleasure, vulnerable", "lighting": "warm sun from above, tears glistening, sweat on skin, soft golden light", "extra": "2people, hetero, age difference, missionary position:1.4, vaginal sex:1.3, man on top:1.2, girl looking up:1.2, teary eyes, reaching up to man, hands on his chest, begging expression, full body flush", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_20_creampie", "name": "DAY1: 中出し", "description": "奥に出される。体をビクンとさせて受け止める", "outfit": "nude, on beach sheet, body tensing, uncensored, explicit", "setting": "blue beach sheet, white sand, ocean waves, afternoon sun, climax moment", "mood": "receiving cum, body jolting, eyes wide then squeezing shut, mouth open in silent scream, ultimate pleasure", "lighting": "bright afternoon sun, sweat glistening, dramatic moment lighting", "extra": "2people, hetero, age difference, missionary position:1.4, vaginal sex:1.3, cum in pussy:1.3, creampie:1.2, nakadashi, man pressing deep, girl body arching, orgasm, trembling, toes curled tight, gripping man's back", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_21_cum_overflow", "name": "DAY1: 抜いた直後・精液溢れ", "description": "ペニスを抜いた直後。出された精液が溢れてくる", "outfit": "nude, lying on beach sheet, legs slightly spread, uncensored, explicit", "setting": "blue beach sheet, white sand, ocean background, afternoon sun, post-sex", "mood": "just after withdrawal, exhausted, panting, looking down at own body, dazed satisfied expression", "lighting": "warm afternoon sun, glistening on wet skin, peaceful post-climax light", "extra": "2people, hetero, age difference, after sex:1.2, cum dripping from pussy:1.4, cum overflow:1.3, cum on inner thighs, pussy juice, spread legs, freshly creampied, satisfied exhaustion", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},

    # ================================================================
    # DAY 1 — シーン3：BBQ——お肉（複数男性のフェラ）
    # ================================================================
    {"id": "d1_22_bbq_setup", "name": "DAY1: ビーチBBQの風景", "description": "BBQセットが組まれたビーチ。グリル、肉、夕暮れ。男たちと合流", "outfit": "white triangle bikini, clean, hair re-done, refreshed", "setting": "beach BBQ setup, large charcoal grill, grilled meat and seafood, tiki torches, sunset beach", "mood": "arriving at BBQ, eyes lighting up at food, excited about meal, social atmosphere", "lighting": "warm sunset glow, charcoal fire glow, orange sky, tiki torch flames flickering", "extra": "plates of grilled steak, multiple men around grill, beach chairs, tropical sunset", "aspect": (1216, 832)},
    {"id": "d1_23_bbq_eating", "name": "DAY1: がつがつ食べる莉子", "description": "分厚いステーキにかぶりつく。口の周りにタレ", "outfit": "white triangle bikini, BBQ sauce on chin and fingers", "setting": "beach BBQ area, sitting in chair, plate of thick steak, charcoal grill behind, multiple men around", "mood": "eating messily, mouth full, sauce on face, happy cheeks puffed, childlike appetite", "lighting": "warm sunset and firelight mix, orange-red flickering, charcoal glow on face", "extra": "thick steak in hands, biting into meat, sauce dripping, messy fingers, happy eating", "aspect": (832, 1216)},
    {"id": "d1_24_bbq_oral1", "name": "DAY1: お肉①——陽介のを咥える", "description": "陽介の前に跪いて咥える。炭火の明かり", "outfit": "white triangle bikini, kneeling on sand, hair held back, uncensored, explicit", "setting": "beach BBQ area at night, charcoal fire glowing, tiki torches, stars visible, firelight", "mood": "on knees, looking up with big eyes, mouth around penis, eager, obedient, firelight on face", "lighting": "charcoal fire glow from below, warm amber, tiki torch flicker, dramatic shadows", "extra": "2people, hetero, age difference, oral sex:1.3, fellatio:1.4, blowjob, kneeling:1.2, looking up, penis in mouth, sucking, hands on thighs, firelight on face", "aspect": (832, 1216)},
    {"id": "d1_25_bbq_oral2", "name": "DAY1: お肉②——拓海の太いの", "description": "拓海の番。太い。頬が膨らむ。目を潤ませながら頑張る", "outfit": "white triangle bikini, kneeling, tears forming from effort, uncensored, explicit", "setting": "night beach BBQ, charcoal glow, tiki torches, stars, firelit sand", "mood": "struggling with size, cheeks puffed, teary eyes, determined, trying hard, drool at corner of mouth", "lighting": "warm amber firelight, tiki torch glow, dramatic shadows on face", "extra": "2people, hetero, age difference, oral sex:1.3, fellatio:1.4, blowjob, kneeling:1.2, large penis, cheeks bulging, effort, tears forming, drool dripping, hands on shaft", "aspect": (832, 1216)},
    {"id": "d1_26_bbq_oral3", "name": "DAY1: お肉③——涼を舐める", "description": "涼の番。丁寧に舐める。涼が息を呑む", "outfit": "white triangle bikini, kneeling, focused expression, uncensored, explicit", "setting": "night beach BBQ, charcoal glow, tiki torches, intimate firelit atmosphere", "mood": "concentrated, tongue working carefully, licking shaft, teasing tip, skilled, sultry eyes looking up", "lighting": "warm amber tiki torch light, charcoal glow, golden highlights on tongue", "extra": "2people, hetero, age difference, oral sex:1.3, fellatio:1.4, licking penis:1.3, tongue on shaft, kneeling:1.2, focused expression, licking from base to tip, seductive gaze upward", "aspect": (832, 1216)},
    {"id": "d1_27_bbq_oral4", "name": "DAY1: お肉④——蓮を咥える", "description": "蓮の番。恥ずかしそうな蓮。莉子がリードする", "outfit": "white triangle bikini, kneeling, confident expression, uncensored, explicit", "setting": "night beach BBQ, dying charcoal, tiki torches, stars, quiet nighttime", "mood": "confident, taking initiative, guiding shy partner, gentle but sure, encouraging look upward", "lighting": "soft tiki torch glow, fading charcoal, gentle warm darkness, starlight", "extra": "2people, hetero, age difference, oral sex:1.3, fellatio:1.4, blowjob, kneeling:1.2, girl initiating, confident expression, hand holding shaft, gentle sucking, looking up encouragingly", "aspect": (832, 1216)},
    {"id": "d1_28_bbq_oral5", "name": "DAY1: お肉⑤——剛の巨大なの", "description": "剛の番。大きすぎて入らない。舌で必死に舐める", "outfit": "white triangle bikini, kneeling, wide eyes, drool on chin, uncensored, explicit", "setting": "night beach BBQ, tiki torches, charcoal remains, night sky with stars", "mood": "overwhelmed by size, can't fit in mouth, licking desperately, wide eyes, drool everywhere, amazed", "lighting": "warm tiki torch amber, fading fire glow, starlight backdrop", "extra": "2people, hetero, age difference, oral sex:1.3, licking penis:1.4, too large for mouth, kneeling:1.2, tongue out licking, both hands on shaft, drool dripping, amazed expression", "aspect": (832, 1216)},
    {"id": "d1_29_bbq_oral_double", "name": "DAY1: お肉⑥——二本同時に舐める", "description": "二人分を同時に。両手で握って交互に口に含む", "outfit": "white triangle bikini, kneeling between two men, messy face, uncensored, explicit", "setting": "night beach, tiki torch light, sand, stars above, two men standing", "mood": "servicing two at once, alternating between them, eager, messy, saliva strands, working hard", "lighting": "warm amber firelight from side, tiki torches, dramatic shadows", "extra": "3people, 1girl 2boys, hetero, double fellatio:1.3, two penises:1.2, oral sex, kneeling between two men, alternating, one in each hand, saliva strands, messy chin", "aspect": (832, 1216)},
    {"id": "d1_30_bbq_facial", "name": "DAY1: お肉⑦——顔に出される", "description": "口を開けて受ける。顔にかかる。幸せそう", "outfit": "white triangle bikini, kneeling, cum on face, uncensored, explicit", "setting": "night beach BBQ area, tiki torches, firelight, night sky", "mood": "receiving facial, eyes closed happily, mouth open catching cum, satisfied expression, pleased", "lighting": "warm firelight on cum-covered face, amber glow, tiki torch flicker", "extra": "2people, hetero, age difference, facial:1.4, cum on face:1.3, cum on tongue, mouth open, receiving cum, kneeling:1.2, happy expression, eyes closed", "aspect": (832, 1216)},
    {"id": "d1_31_bbq_cleanup", "name": "DAY1: お肉⑧——口元を拭ってもらう", "description": "陽介にタオルで顔を拭いてもらう。満足げな表情", "outfit": "white triangle bikini, messy face being cleaned, kneeling", "setting": "night beach BBQ, dying embers, tiki torches dimming, quiet night ocean, stars", "mood": "being cared for, face being wiped clean, satisfied smile, exhausted but content, grateful", "lighting": "dying ember glow, starlight, gentle tiki torch, warm peaceful darkness", "extra": "2people, hetero, age difference, after oral, face being wiped with towel, gentle care, kneeling on sand, satisfied smile, peaceful exhaustion", "aspect": (1216, 832)},

    # ================================================================
    # DAY 1 — シーン4：夜——ヴィラのソファで
    # ================================================================
    {"id": "d1_32_villa_sofa_start", "name": "DAY1: ヴィラのソファ——始まり", "description": "膝の上に座らされる。前後から挟まれる。二人の体温", "outfit": "white triangle bikini, being pulled off, partially undressed, uncensored, explicit", "setting": "luxury villa living room, large L-shaped sofa, night, interior lamps, glass windows showing dark ocean", "mood": "sandwiched, on someone's lap, flushed, nervous anticipation, hands gripping sofa cushion", "lighting": "warm indoor lamp light, dim mood lighting, glass reflection of interior", "extra": "3people, 1girl 2boys, hetero, sitting on lap:1.3, straddling, being undressed, night ocean through glass", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (832, 1216)},
    {"id": "d1_33_villa_finger", "name": "DAY1: 涼の指技——初絶頂", "description": "涼の指だけでイく。テクニックの差を体に分からされる", "outfit": "nude, bikini removed, on sofa, uncensored, explicit", "setting": "villa sofa, soft cushions, warm interior, night, someone kneeling before her", "mood": "shocked by pleasure, eyes wide, mouth open, gasping, fingers gripping cushion, surprised climax", "lighting": "warm lamp light, soft shadows on skin, intimate interior glow", "extra": "2people, hetero, age difference, fingering:1.3, pussy juice, head thrown back, gripping cushion edges, body tensing, surprised expression, tears forming", "aspect": (832, 1216)},
    {"id": "d1_34_villa_3p_peak", "name": "DAY1: 3P——拓海の激しさ", "description": "拓海の後背位。声が弾ける。容赦ない速度。体が弾む", "outfit": "nude, sweating, skin glistening, uncensored, explicit", "setting": "villa sofa, cushions scattered, messy sofa area, night, lamp-lit room", "mood": "overwhelmed, body bouncing, crying out, hair flying, gripping sofa arm, intense sensation", "lighting": "warm lamp glow, sweat glistening in light, dynamic shadows from movement", "extra": "3people, 1girl 2boys, hetero, doggy style:1.4, sex from behind:1.3, on all fours on sofa, penis in pussy, vaginal sex, hair disheveled, sweat droplets, cushions displaced", "neg_extra": NEG_NOT_DOGGY, "aspect": (832, 1216)},
    {"id": "d1_35_villa_3p_after", "name": "DAY1: 3P後——毛布", "description": "ぐったり。陽介が毛布をかけてくれる。「おやすみ」消え入る声", "outfit": "nude, wrapped in soft blanket, curled up on sofa", "setting": "villa sofa, night, dimmed lights, someone draping blanket over small body, quiet room", "mood": "exhausted, drifting to sleep, small curled up body under blanket, peaceful exhaustion, faint smile", "lighting": "very dim lamp, mostly dark, soft warm glow on sleeping face", "extra": "blanket being draped, small figure on large sofa, messy hair peeking out, peaceful sleep beginning", "aspect": (1216, 832)},

    # ================================================================
    # DAY 1 — シーン5：深夜——月光（涼の夜這い）
    # ================================================================
    {"id": "d1_36_moonlight_wake", "name": "DAY1深夜: 月光の中で目覚める", "description": "手が腰に触れて目覚める。月光の中にシルエット。寝ぼけた目", "outfit": "nude under thin white sheet, barely covered, sleepy", "setting": "villa bedroom, moonlight streaming through window, silver ocean visible, dark room, bed", "mood": "waking up slowly, confused, blinking, someone's silhouette in moonlight, drowsy, vulnerable", "lighting": "moonlight only, silver-blue beam across bed, dark room, single light source from window", "extra": "2people, hetero, age difference, moonbeam across pillow, shadow of someone at bed edge, sheet clinging to body, sleepy eyes", "aspect": (1216, 832)},
    {"id": "d1_37_moonlight_kiss", "name": "DAY1深夜: 月光のキス", "description": "唇だけのキス。何回も。ちゅ、ちゅ。昼間と違う優しさ", "outfit": "nude, thin sheet at waist, face lit by moonlight", "setting": "bed, moonlight, lying side by side, faces close together, silver-blue darkness", "mood": "gentle kiss, lips barely touching, eyes half-closed, tender, repeated soft kisses, romantic", "lighting": "silver moonlight on two faces, blue-silver tones, gentle shadows, nocturnal intimacy", "extra": "2people, hetero, age difference, faces close together, soft repeated kisses, moonlight on lips, peaceful intimate moment", "aspect": (1216, 832)},
    {"id": "d1_38_moonlight_hands", "name": "DAY1深夜: 手を繋いだまま", "description": "指を絡めて繋いだ手。ゆっくり動く。波のように。初めての手繋ぎH", "outfit": "nude, moonlit skin, sheet tangled at feet, uncensored, explicit", "setting": "bed, moonlight, intertwined hands on pillow, gentle movement, silver-blue room", "mood": "hand holding during intimacy, fingers interlocked, gentle slow rhythm, deep connection, tears forming", "lighting": "moonlight on intertwined hands, silver highlights on skin, delicate light and shadow", "extra": "2people, hetero, age difference, missionary position:1.3, vaginal sex, hand holding:1.3, intertwined fingers, moonbeam across linked fingers, tears glistening in moonlight", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_39_moonlight_tears", "name": "DAY1深夜: 月光の涙", "description": "深くて静かな絶頂。涙が滲む。嬉しくて泣く。30秒の長い波", "outfit": "nude, moonlit, tears on cheeks, uncensored, explicit", "setting": "bed, moonlight flooding through window, ocean waves audible, intimate darkness", "mood": "silent orgasm, tears flowing, body trembling gently, squeezing hand tight, peaceful ecstasy, crying from warmth", "lighting": "moonlight on tear-streaked face, silver tears, blue-silver intimacy, ethereal glow", "extra": "2people, hetero, age difference, missionary position:1.3, vaginal sex, cum in pussy, creampie, tears catching moonlight, hand squeezing partner's, body arching gently, silent trembling", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (1216, 832)},
    {"id": "d1_40_moonlight_sleep", "name": "DAY1深夜: 胸に顔を埋めて眠る", "description": "繋いだ手はそのまま。涼の胸に顔を埋めて眠りに落ちる", "outfit": "nude, curled against someone's chest, peaceful", "setting": "bed, fading moonlight, ocean waves, two figures in bed, one sleeping peacefully", "mood": "falling asleep, face buried in chest, hand still holding, peaceful breathing, complete safety", "lighting": "gentle moonlight, mostly dark, just enough light to see peaceful sleeping face", "extra": "hand still clasped, face against chest, hair spread on pillow, deepening sleep, ocean wave sounds", "aspect": (1216, 832)},

    # ================================================================
    # DAY 2 — シーン6：朝——シャワーの中
    # ================================================================
    {"id": "d2_01_morning_wake", "name": "DAY2朝: 目覚め——隣に誰もいない", "description": "朝日。隣に誰もいない。右手に温度だけが残っている", "outfit": "nude, sheet loosely covering, morning light on face", "setting": "villa bedroom, morning sunlight through curtains, empty bed beside her, indent in pillow", "mood": "waking up, reaching for empty space beside, slightly sad, warmth lingering on palm, bittersweet", "lighting": "warm morning sunlight through curtains, golden rays on white sheets, soft morning glow", "extra": "empty indent on adjacent pillow, hand reaching out to empty space, morning birds outside", "aspect": (1216, 832)},
    {"id": "d2_02_shower_alone", "name": "DAY2朝: シャワー", "description": "ガラス張りシャワールーム。お湯を浴びる。朝の光", "outfit": "nude, water streaming down body, steam rising", "setting": "glass shower room, morning light through frosted glass, steam, hot water spray, modern bathroom", "mood": "relaxed under water, eyes closed, washing away yesterday, water running down face, peaceful", "lighting": "bright morning light diffused through glass and steam, sparkling water droplets, soft white", "extra": "water droplets on glass, steam filling shower, wet hair, water running down skin", "aspect": (832, 1216)},
    {"id": "d2_03_shower_intrusion", "name": "DAY2朝: 蓮がシャワーに乱入", "description": "ドアが開く。蓮。驚いて胸を隠す莉子", "outfit": "nude, wet, covering chest with hands, surprised", "setting": "glass shower room, door opening, steam escaping, bright bathroom, morning light", "mood": "shocked, covering chest with both hands, wide eyes, mouth open in surprise, water still running", "lighting": "bright morning bathroom light, steam, backlit from shower, water sparkles", "extra": "hands covering chest, water still running, steam escaping through opened door, surprised face", "aspect": (832, 1216)},
    {"id": "d2_04_shower_wall", "name": "DAY2朝: シャワーの壁に手をつく", "description": "壁に手をつく。後ろから。お湯が二人に降り注ぐ。鋭い絶頂", "outfit": "nude, wet, hands pressed against tile wall, uncensored, explicit", "setting": "shower room, water pouring from above, tiles, steam, glass walls, water everywhere", "mood": "hands pressed on wet tiles, leaning forward, water cascading, gasping, sudden sharp climax", "lighting": "water-filtered light, steam, sparkling droplets, bright but steamy", "extra": "2people, hetero, age difference, standing sex:1.4, sex from behind:1.3, vaginal sex, hands on wall, water streaming between bodies, steam filling room, knees trembling", "neg_extra": NEG_NOT_STANDING, "aspect": (832, 1216)},

    # ================================================================
    # DAY 2 — シーン7：午前——プールサイド
    # ================================================================
    {"id": "d2_05_pool_sunscreen", "name": "DAY2午前: 日焼け止めを塗られる", "description": "水色ビキニ。デッキチェア。日焼け止めを塗られる。際どいところも", "outfit": "light blue bikini, sunglasses on head, lying on deck chair", "setting": "poolside, turquoise pool water, deck chairs, tropical garden, morning sun, sunscreen bottle", "mood": "lying on deck chair, someone rubbing sunscreen on back, ticklish, slightly aroused, blushing", "lighting": "bright morning tropical sun, pool water reflections, dappled light through palms", "extra": "sunscreen bottle nearby, hands on skin, pool water sparkling, tropical plants framing", "aspect": (1216, 832)},
    {"id": "d2_06_pool_riding", "name": "DAY2午前: プールサイド騎乗位", "description": "自分で腰を動かす。上に乗っている。口にも。上下同時", "outfit": "light blue bikini top only, bottom removed, straddling, uncensored, explicit", "setting": "poolside deck area, turquoise pool water beside, tropical garden backdrop, morning sun", "mood": "riding on top, actively moving hips, flushed, determined expression, biting lip, self-initiated", "lighting": "bright tropical morning sun, water reflection patterns on skin, dappled palm shadows", "extra": "2people, hetero, age difference, cowgirl position:1.4, girl on top:1.3, riding:1.3, straddling, vaginal sex, penis in pussy, pool water sparkling beside, active hip movement, sunlight on wet skin", "neg_extra": NEG_NOT_RIDING, "aspect": (832, 1216)},
    {"id": "d2_07_pool_continuous", "name": "DAY2午前: 立て続けの絶頂", "description": "中出しと同時にイく。体が覚えてきている。休みがない", "outfit": "light blue bikini completely disheveled, sunglasses fallen off, uncensored, explicit", "setting": "poolside, pool edge visible, scattered sunscreen and towels, tropical morning", "mood": "continuous climax, trembling, overwhelmed, unable to stop, body responding automatically", "lighting": "bright midmorning sun, harsh beautiful light, water reflections dancing", "extra": "2people, hetero, age difference, cowgirl position:1.4, girl on top:1.3, vaginal sex, cum in pussy, creampie, body trembling, gripping pool edge, continuous pleasure, morning sun beating down", "neg_extra": NEG_NOT_RIDING, "aspect": (832, 1216)},

    # ================================================================
    # DAY 2 — シーン8：昼——一人の時間
    # ================================================================
    {"id": "d2_08_pool_float", "name": "DAY2昼: プールに浮かぶ", "description": "浮き輪の上でぷかぷか。目を閉じて。水面がきらきら。内省", "outfit": "light blue bikini, relaxed, dry", "setting": "private pool, floating on inflatable, blue sky above, palm trees framing sky, midday", "mood": "eyes closed, peaceful floating, arms spread, contemplating, slight smile, daydreaming", "lighting": "bright overhead midday sun, water reflections on skin, clear tropical sky", "extra": "floating on pool, water sparkling, sky reflection in pool, alone, serene, weightless", "aspect": (1216, 832)},
    {"id": "d2_09_fruit_nap", "name": "DAY2昼: フルーツを食べて昼寝", "description": "デッキチェアでマンゴーを食べる。うとうと。自然に眠りに落ちる", "outfit": "light blue bikini, relaxed, one arm behind head", "setting": "poolside deck chair, tropical fruits on side table, parasol shade, quiet afternoon", "mood": "sleepy, half-eaten fruit in hand, dozing off, peaceful, fruit juice on lips, curling up", "lighting": "filtered afternoon sun through parasol, dappled warm light, peaceful shade", "extra": "mango slice in hand, tropical fruit plate, parasol shadow, drifting into sleep, alone", "aspect": (1216, 832)},

    # ================================================================
    # DAY 2 — シーン9：午後——三人
    # ================================================================
    {"id": "d2_10_wake_surrounded", "name": "DAY2午後: 目覚めたら三人に囲まれている", "description": "昼寝から目を開ける。体の上に重さ。三方向に男", "outfit": "light blue bikini, just woke up, startled", "setting": "poolside daybed with canopy, afternoon sun filtering through fabric, three shadows around her", "mood": "just woken, disoriented, blinking, realizing three people surround her, mix of surprise and acceptance", "lighting": "warm afternoon light through canopy fabric, golden dappled patterns, dream-like quality", "extra": "waking from nap, three figures around, canopy shadows, drowsy transitioning to alert", "aspect": (832, 1216)},
    {"id": "d2_11_afternoon_intense", "name": "DAY2午後: 輪姦——体が覚えている", "description": "入った瞬間にイく。午前中に覚えた体が反応。連続絶頂", "outfit": "nude, bikini tangled at ankle, sweating, uncensored, explicit", "setting": "poolside daybed, afternoon golden light, canopy fabric billowing, outdoor intimate setting", "mood": "instant climax on entry, body remembering, chain of orgasms, overwhelmed, can't stop", "lighting": "warm golden afternoon light, sun through canopy creating warm patterns, golden hour approaching", "extra": "multiple boys, gangbang, group sex, vaginal sex:1.3, missionary position:1.3, man on top, bikini tangled at ankle, gripping canopy fabric, golden light on sweat-covered skin", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (832, 1216)},
    {"id": "d2_12_afternoon_crying", "name": "DAY2午後: 気持ちよくて泣く", "description": "泣いている。気持ちよすぎて。仮面がないから。涙が止まらない", "outfit": "nude, tears streaming, flushed all over, uncensored, explicit", "setting": "poolside daybed, late afternoon light, messy sheets, outdoor setting", "mood": "crying but smiling, tears and pleasure simultaneously, beautiful tears, overwhelmed emotions, genuine", "lighting": "late afternoon golden light, tears catching sunlight, warm emotional lighting", "extra": "multiple boys, gangbang, group sex, vaginal sex:1.3, tears streaming down smiling face, trembling body, someone's hand wiping tears, messy hair", "aspect": (832, 1216)},
    {"id": "d2_13_afternoon_held", "name": "DAY2午後: 剛に涙を拭われる", "description": "大きな手で涙を拭う剛。「泣いていい」。泣きながら笑う莉子", "outfit": "nude, covered partially by sheet, tear-stained face", "setting": "poolside daybed, calming down, late afternoon, gentle atmosphere after intensity", "mood": "being comforted, large hand on cheek wiping tears, smiling through tears, grateful, safe", "lighting": "warm late afternoon, gentle golden, calming, tears glistening in sunlight", "extra": "large hand wiping small face, tears and smile coexisting, gentle comfort, evening approaching", "aspect": (832, 1216)},

    # ================================================================
    # DAY 2 — シーン10：夕方——テラス
    # ================================================================
    {"id": "d2_14_terrace_sunset", "name": "DAY2夕方: テラスで膝を抱える", "description": "バスローブ。膝を抱えてソファに座る。夕焼け。小さい体", "outfit": "oversized white bathrobe, damp hair, bare feet tucked under, knees to chest", "setting": "villa terrace, spectacular ocean sunset, orange-pink sky, comfortable outdoor sofa, breeze", "mood": "small figure in big robe, knees hugged, contemplative, vulnerable, gentle sadness and peace", "lighting": "golden sunset light, orange backlight, warm rim light on damp hair, silhouette potential", "extra": "tiny figure in huge bathrobe, sunset reflection in eyes, wind moving damp hair, ocean vista", "aspect": (1216, 832)},
    {"id": "d2_15_terrace_talk", "name": "DAY2夕方: おにいさんとの会話", "description": "陽介が隣に座る。頭を撫でられる。安心する。「楽しみかも」", "outfit": "oversized white bathrobe, looking up at someone beside her, small smile forming", "setting": "villa terrace, sunset, two on outdoor sofa, ocean view, orange sky fading", "mood": "opening up, being patted on head, feeling safe, slight smile, recovering, anticipating tonight", "lighting": "fading sunset, warm amber dimming to blue, transition from day to night", "extra": "head being patted, looking up trustingly, sunset behind, peaceful conversation atmosphere", "aspect": (1216, 832)},

    # ================================================================
    # DAY 2 — シーン11：夜——全員集合5P
    # ================================================================
    {"id": "d2_16_dinner_recovery", "name": "DAY2夜: たくさん食べる", "description": "夕食。いっぱい食べて体力回復。まだ食べるの？って顔される", "outfit": "casual summer dress, eating enthusiastically, at dining table", "setting": "villa dining room, dinner table with many dishes, evening interior lighting, wine glasses", "mood": "eating a lot, cheeks puffed, determined eating, recovering energy for tonight, happy appetite", "lighting": "warm indoor dining light, candle light on table, cozy evening interior", "extra": "multiple plates, eating with both hands, determined expression, building strength", "aspect": (1216, 832)},
    {"id": "d2_17_5p_center", "name": "DAY2夜: ベッドの真ん中——五人に囲まれる", "description": "キングサイズベッドの真ん中。周りに五人。「来て」", "outfit": "nude, small body in center of large bed, white sheets, uncensored, explicit", "setting": "large bedroom, king size bed with white sheets, warm lighting, five figures around edges", "mood": "nervous excitement, small body surrounded, trembling with anticipation, beckoning, brave vulnerability", "lighting": "warm bedroom ambient, multiple soft light sources, intimate warm tones", "extra": "multiple boys, gangbang, group sex, tiny figure centered on huge bed, white sheets, five silhouettes surrounding, inviting gesture", "aspect": (832, 1216)},
    {"id": "d2_18_5p_escalation", "name": "DAY2夜: 5P——絶頂の常態化", "description": "入れられるたびにイく。止まらない。おねだりが呼吸になる", "outfit": "nude, drenched in sweat, flushed everywhere, hair wild, uncensored, explicit", "setting": "king size bed, completely messy sheets, pillows everywhere, warm night, bedroom", "mood": "continuous ecstasy, eyes unfocused, mouth open, trembling non-stop, overwhelmed", "lighting": "warm dim bedroom light, sweat glistening, soft orange ambient", "extra": "multiple boys, gangbang, group sex, vaginal sex:1.3, missionary position:1.3, completely disheveled, sweating profusely, sheets twisted, multiple bodies partially visible", "neg_extra": NEG_NOT_MISSIONARY, "aspect": (832, 1216)},
    {"id": "d2_19_5p_broken", "name": "DAY2夜: 5P——壊れかけ", "description": "体が弓なり。意識が白くなる。剛の量。お腹がぱんぱん", "outfit": "nude, body arched, covered in sweat and fluids, uncensored, explicit", "setting": "messy bed, crumpled sheets, warm bedroom, night, aftermath of intensity", "mood": "arched back, body convulsing, at limit, beautiful breaking point, overwhelming pleasure", "lighting": "warm dim lighting, skin glistening with sweat, dramatic body arch shadow", "extra": "multiple boys, gangbang, group sex, vaginal sex, cum in pussy:1.3, excessive cum, cum overflow, body arched off bed, gripping sheets, tears and sweat, hair completely wild", "aspect": (832, 1216)},
    {"id": "d2_20_5p_aftermath", "name": "DAY2夜: 5P後——泣いて笑う", "description": "仰向け。天井を見てる。泣いて笑ってる。壊れてない", "outfit": "nude, covered by crumpled sheet partially, exhausted", "setting": "messy king bed, night, bedroom, ceiling visible, calm after storm", "mood": "lying flat, staring at ceiling, crying and smiling simultaneously, exhausted but intact, alive", "lighting": "dim warm light, tears glistening, peaceful exhaustion lighting", "extra": "hair spread on pillow, tears running to ears, smile on face, breathing heavily, ceiling view", "aspect": (1216, 832)},

    # ================================================================
    # DAY 2 — シーン12：深夜——蓮
    # ================================================================
    {"id": "d2_21_ren_beside", "name": "DAY2深夜: 蓮が隣にいる", "description": "目を開けると蓮が横に。顔が近い。暗闘の中。蓮が緊張している", "outfit": "nude, sheet loosely covering, in dark room", "setting": "dark bedroom, near pitch black, faint light only, two faces very close together, intimate darkness", "mood": "face to face in darkness, close breathing, someone nervous beside her, quiet discovery", "lighting": "near total darkness, faintest moonlight edge on faces, silhouette only, intimate black", "extra": "two faces extremely close, breathing audible, darkness enveloping, quiet nervous atmosphere", "aspect": (1216, 832)},
    {"id": "d2_22_ren_riko_initiates", "name": "DAY2深夜: 莉子が自分から手を伸ばす", "description": "莉子が蓮の頬に手を伸ばす。「あたしから、してもいい？」初めて能動的に", "outfit": "nude silhouette, reaching out hand in darkness", "setting": "dark bedroom, almost black, hand reaching toward face, intimate gesture in darkness", "mood": "taking initiative, hand reaching out tenderly, confident yet sweet, choosing to act, gentle boldness", "lighting": "minimal moonlight, silhouette, hand catching faint light, dramatic darkness", "extra": "hand reaching to touch face in dark, initiative moment, tender gesture, darkness emphasizing touch", "aspect": (1216, 832)},
    {"id": "d2_23_ren_on_top", "name": "DAY2深夜: 莉子が上に乗る", "description": "自分で腰を下ろす。自分の意思で。暗闭の中で手を繋ぐ", "outfit": "nude, straddling, silhouette in darkness, uncensored, explicit", "setting": "dark bedroom, girl on top silhouette, hands finding each other, near-black room", "mood": "girl on top, moving slowly, own rhythm, hands clasped, forehead touching, empowered intimacy", "lighting": "near darkness, edge light on profile, silhouette of riding position, minimal silver moonlight", "extra": "2people, hetero, age difference, cowgirl position:1.4, girl on top:1.3, riding:1.3, vaginal sex, straddling silhouette, hands intertwined, foreheads touching, gentle movement in darkness", "neg_extra": NEG_NOT_RIDING, "aspect": (832, 1216)},
    {"id": "d2_24_ren_simultaneous", "name": "DAY2深夜: 蓮と同時絶頂", "description": "自分で動いて、蓮と同時にイく。額と額がくっついている。主体的な絶頂", "outfit": "nude, foreheads pressed together, in darkness, uncensored, explicit", "setting": "dark bedroom, two silhouettes merging, simultaneous climax, intimate darkness", "mood": "simultaneous orgasm, foreheads pressed, hands gripping, mutual climax, equal, tender peak", "lighting": "near-black, faintest edge light, intimate shadows, just enough to see expressions", "extra": "2people, hetero, age difference, cowgirl position:1.4, girl on top:1.3, vaginal sex, cum in pussy, creampie, foreheads touching, hands tightly clasped, mutual trembling", "neg_extra": NEG_NOT_RIDING, "aspect": (1216, 832)},
    {"id": "d2_25_ren_goodnight", "name": "DAY2深夜: 「おやすみ、蓮くん」", "description": "手を繋いだまま眠りに落ちる。初めての「くん」", "outfit": "nude, curled together, in darkness, peaceful", "setting": "dark bedroom, two small figures close together, hands still linked, drifting to sleep", "mood": "falling asleep together, hands still clasped, peaceful smile in dark, tender goodnight", "lighting": "nearly dark, peaceful darkness, slight moonlight on linked hands", "extra": "two figures curling together, hands never letting go, peaceful sleep approaching, tender dark", "aspect": (1216, 832)},

    # ================================================================
    # DAY 3 — シーン13：朝——おにいさんと二人で
    # ================================================================
    {"id": "d3_01_wake_yousuke", "name": "DAY3朝: 陽介の腕の中で目覚める", "description": "最終日の朝。あったかい腕の中。蓮はいない。陽介の顔が近い", "outfit": "nude under warm sheet, in someone's arms, morning", "setting": "bedroom, warm morning light through curtains, in man's arms, last morning, birds audible", "mood": "waking in safety, warm, slight surprise Ren is gone, but safe in Yousuke's arms, peaceful start", "lighting": "soft golden morning light, warm through curtains, gentle lens flare, dreamy morning", "extra": "wrapped in arms, morning sunbeam on face, tousled hair, peaceful waking, warm cocoon", "aspect": (1216, 832)},
    {"id": "d3_02_morning_gentle", "name": "DAY3朝: 穏やかなH——笑いながら", "description": "シーツの中でゆっくり。安心。笑いながらイく。にへっと笑って震える", "outfit": "nude, under white sheet, entwined with someone", "setting": "bedroom, warm morning, white sheets, sunlight through curtains, gentle peaceful sex", "mood": "laughing during climax, happy tears, gentle, safe, content, smiling orgasm, peaceful joy", "lighting": "warm golden morning rays, sun through sheer curtains, heavenly morning glow", "extra": "sheet draped over bodies, morning sunbeam, laughing expression, gentle trembling, happy tears", "aspect": (1216, 832)},
    {"id": "d3_03_morning_after", "name": "DAY3朝: 朝の余韻——最終日が始まる", "description": "朝日の中で微笑む。最後の一日が始まる。覚悟と安らぎ", "outfit": "nude, sheet wrapped loosely, sitting up in bed, morning light", "setting": "bedroom, brilliant morning sunlight, ocean visible through window, last morning of trip", "mood": "content smile, ready for final day, inner strength, calm resolution, morning peace", "lighting": "brilliant morning sun, warm gold flooding room, silhouette against window light", "extra": "sheet around body, looking toward window, morning ocean view, peaceful determination", "aspect": (832, 1216)},

    # ================================================================
    # DAY 3 — シーン14：最後のビーチ
    # ================================================================
    {"id": "d3_04_final_bikini", "name": "DAY3午前: 白いビキニ——初日と同じ", "description": "白いビキニに着替える。初日と同じ。でも目が違う", "outfit": "white triangle bikini, same as day 1, but different eyes and bearing", "setting": "beach, morning sun, white sand, ocean, standing with quiet confidence", "mood": "same outfit as day 1 but transformed gaze, mature eyes, quiet confidence, ready to choose", "lighting": "clear morning beach light, sun on white bikini, vivid sky and ocean", "extra": "standing tall, wind in hair, same bikini different girl, ocean stretching behind, determined stance", "aspect": (832, 1216)},
    {"id": "d3_05_choosing", "name": "DAY3午前: 「あたしが選ぶ」", "description": "五人を前に宣言。「最後は、あたしが選ぶ。一人ずつ」", "outfit": "white triangle bikini, standing before five men on beach, wind blowing", "setting": "beach, five figures lined up, morning ocean, wide shot, final gathering", "mood": "declaring, pointing, commanding presence despite small size, choosing, leader, resolved smile", "lighting": "bright clear morning light, dramatic ocean backdrop, sun on speaker", "extra": "small figure addressing five larger figures, ocean behind, wind blowing hair, decisive moment", "aspect": (1216, 832)},
    {"id": "d3_06_with_takumi", "name": "DAY3: タクミさんと——BBQの味", "description": "拓海と。激しく短く。口に。BBQの夜のリフレイン", "outfit": "white triangle bikini, on knees in sand, looking up with smirk", "setting": "beach, sand, morning-midday sun, ocean backdrop, callback to BBQ night", "mood": "knowing smirk, confident, referencing BBQ night, playful, mature callback", "lighting": "bright beach sun, warm, direct light from above", "extra": "on sand, looking up with knowing grin, callback to earlier scene, teasing expression", "aspect": (832, 1216)},
    {"id": "d3_07_with_ryo", "name": "DAY3: 涼さんと——昼も夜も好き", "description": "涼と。指で絶頂→挿入。夜這いの秘密を匂わせる", "outfit": "white triangle bikini shifted, on sand, with Ryo", "setting": "beach, sand, ocean sounds, private area, midday sun, intimate beach moment", "mood": "tender, referencing shared secret, peaceful orgasm, experienced body responding, knowing look", "lighting": "midday tropical sun, warm bright, ocean sparkle, sand glowing white", "extra": "sand on skin, experienced pleasure, calm mature response, referencing night secret", "aspect": (1216, 832)},
    {"id": "d3_08_with_ren", "name": "DAY3: 蓮くんと——全力出して", "description": "蓮と。「全力出して」。若い体力の全力。砂にめり込む", "outfit": "white triangle bikini disheveled, pressed into sand", "setting": "beach, sand flying, energetic, midday sun, ocean waves", "mood": "energetic, being pressed into sand, laughing and gasping, full power, youthful intensity", "lighting": "bright harsh midday sun, sand particles in air, dynamic lighting", "extra": "sand flying, pressed into beach, energetic movement, hair full of sand, wild energy", "aspect": (1216, 832)},
    {"id": "d3_09_with_tsuyoshi", "name": "DAY3: 剛さんと——全部ちょうだい", "description": "剛と。大きな体に包まれる。量が多い。「しあわせ」が素で出る", "outfit": "white triangle bikini removed, wrapped in large arms", "setting": "beach, sand, being enveloped by large figure, afternoon sun", "mood": "being wrapped up completely, overflowing, happiness, 'shiawase' escaping lips, complete acceptance", "lighting": "warm afternoon sun, golden light, gentle warmth, embracing light", "extra": "tiny figure in large embrace, overflowing, genuine happiness, sand everywhere, content", "aspect": (832, 1216)},
    {"id": "d3_10_yousuke_hug", "name": "DAY3: おにいさん——抱きしめるだけ", "description": "陽介には行為なし。ただ抱きしめてもらう。砂浜の上で。波の音", "outfit": "white triangle bikini, sandy, being held, no sex, just embrace", "setting": "beach, sand, ocean waves at feet, afternoon sun, just two people holding each other", "mood": "being held, face buried in chest, eyes closed, ultimate safety, no sex just love, tears of peace", "lighting": "warm afternoon sun, golden hour approaching, gentle light on embracing figures", "extra": "small figure held by taller figure, no sexual content, just embrace, waves at feet, tears of joy", "aspect": (832, 1216)},
    {"id": "d3_11_final_lying", "name": "DAY3: 全部終わった後——砂浜に仰向け", "description": "砂浜に仰向け。笑って泣いてる。太ももに白い筋。壊れてないよ", "outfit": "white triangle bikini messy, lying on sand, covered in sand and marks", "setting": "beach, lying on white sand, sunset approaching, waves reaching feet, aftermath", "mood": "lying flat on sand, laughing and crying, exhausted but alive, looking at sky, not broken", "lighting": "late afternoon sun, warm golden, approaching sunset, beautiful end-of-day light", "extra": "spread-eagle on sand, marks on skin, messy hair, tears and laughter, waves touching toes, alive", "aspect": (1216, 832)},

    # ================================================================
    # DAY 3 — シーン15：エンディングインタビュー
    # ================================================================
    {"id": "d3_12_interview_serious", "name": "DAY3: インタビュー——静かな告白", "description": "ワンピース。髪を整えて。「あたし、エッチ好きだよ」静かに言う", "outfit": "white one-piece dress, cleaned up, hair neatly done, looking at camera", "setting": "villa terrace, sunset background, interview camera visible, professional setup, orange evening", "mood": "calm declaration, looking directly at camera, serious eyes, quiet confession, honest, brave", "lighting": "warm sunset backlight, orange glow around silhouette, cinematic interview light, golden hour", "extra": "looking at camera, serious expression, clean appearance, sunset framing, declaration moment", "aspect": (832, 1216)},
    {"id": "d3_13_interview_devil", "name": "DAY3: インタビュー——小悪魔復活", "description": "にんまり。舌ぺろ。小悪魔モードが完全復活。「高かったでしょ？」", "outfit": "white one-piece dress, mischievous expression, tongue out", "setting": "villa terrace, sunset, camera setup, playful final interview moment", "mood": "mischievous grin, tongue sticking out, winking, confident, teasing viewers, small devil returned", "lighting": "warm sunset backlight, playful golden glow, rim light on hair, fun dynamic light", "extra": "tongue out, winking at camera, playful pose, mischievous grin, devil returned, fun farewell", "aspect": (832, 1216)},

    # ================================================================
    # DAY 3 — シーン16：エピローグ——帰りの飛行機
    # ================================================================
    {"id": "d3_14_mask_return", "name": "DAY3: 仮面を返してもらう", "description": "「仮面、返して」。目を閉じて深呼吸。カチカチと組み直す", "outfit": "casual travel clothes, light cardigan, sitting on terrace chair", "setting": "villa terrace, evening, before departure, quiet moment, transitional atmosphere", "mood": "eyes closed, deep breath, reconstructing persona, switching modes, transformation moment", "lighting": "evening light, transitional, warm fading to cool, dramatic personal moment", "extra": "eyes closed, deep breath, hands on knees, mental transformation, preparing to return to normal", "aspect": (832, 1216)},
    {"id": "d3_15_airplane_window", "name": "エピローグ: 飛行機の窓", "description": "窓際席。雲の上。夕焼け。額を窓にくっつけている", "outfit": "casual travel clothes, light cardigan, normal child outfit, seated", "setting": "airplane window seat, above clouds, sunset painting sky orange and pink, cabin interior dim", "mood": "forehead against window, looking at clouds, bittersweet, peaceful, returning to normal life", "lighting": "sunset through airplane window, warm orange-pink light on face, dim cabin ambient", "extra": "forehead on cold window, clouds below lit by sunset, reflection in glass, returning home", "aspect": (832, 1216)},
    {"id": "d3_16_airplane_sleep", "name": "エピローグ: 眠る莉子", "description": "目を閉じている。鞄には百万円と貝殻のキーホルダー。普通の子に戻る", "outfit": "casual travel clothes, light cardigan, eyes closed, peaceful sleep", "setting": "airplane seat, dim cabin, sleeping, small bag on lap, sunset fading outside window", "mood": "sleeping peacefully, normal child sleeping on plane, returning to everyday, mask back on, serene", "lighting": "dim airplane cabin, last sunset glow fading, reading light off, peaceful darkness settling", "extra": "sleeping in seat, small bag with seashell keychain visible, peaceful child face, journey ending", "aspect": (832, 1216)},
]


def build_prompt(scene: dict, variation_idx: int) -> tuple[str, str]:
    """シーンと変動インデックスからpositive/negativeプロンプトを生成"""
    angle = CAMERA_ANGLES[variation_idx % len(CAMERA_ANGLES)]
    distance = SHOT_DISTANCES[variation_idx % len(SHOT_DISTANCES)]
    composition = COMPOSITIONS[variation_idx % len(COMPOSITIONS)]

    positive_parts = [
        QUALITY_PREFIX,
        RIKO_BASE,
        scene["outfit"],
        f"{angle}, {distance}, {composition}",
        scene["mood"],
        scene["setting"],
        scene["lighting"],
        scene.get("extra", ""),
    ]
    positive = ", ".join(p for p in positive_parts if p)

    negative = NEGATIVE_BASE
    neg_extra = scene.get("neg_extra", "")
    if neg_extra:
        negative = f"{negative}, {neg_extra}"

    return positive, negative


def call_txt2img(positive: str, negative: str,
                 width: int, height: int,
                 api_url: str = API_URL,
                 **overrides) -> list[bytes]:
    """AUTOMATIC1111 APIでtxt2imgを呼び出し、画像バイトリストを返す"""
    payload = {**DEFAULT_PARAMS, **overrides}
    payload["prompt"] = positive
    payload["negative_prompt"] = negative
    payload["width"] = width
    payload["height"] = height

    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{api_url}/sdapi/v1/txt2img",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    resp = request.urlopen(req, timeout=600)
    result = json.loads(resp.read().decode("utf-8"))
    return [base64.b64decode(img) for img in result["images"]]


def generate_all(
    api_url: str = API_URL,
    output_dir: Path = OUTPUT_DIR,
    images_per_scene: int = IMAGES_PER_SCENE,
    start_scene: int = 0,
    end_scene: int | None = None,
    dry_run: bool = False,
):
    """全シーンの画像を生成"""
    output_dir.mkdir(parents=True, exist_ok=True)
    scene_list = SCENES[start_scene:end_scene]
    total = len(scene_list) * images_per_scene
    generated = 0
    errors = 0

    print(f"=== 莉子4作目 画像生成 ===")
    print(f"API: {api_url}")
    print(f"出力先: {output_dir}")
    print(f"シーン範囲: {start_scene}〜{end_scene if end_scene else len(SCENES)}")
    print(f"シーン数: {len(scene_list)}, 各{images_per_scene}枚, 合計{total}枚")
    print(f"{'='*50}")

    for scene_idx, scene in enumerate(SCENES):
        if scene_idx < start_scene:
            continue
        if end_scene is not None and scene_idx >= end_scene:
            break

        scene_dir = output_dir / scene["id"]
        scene_dir.mkdir(parents=True, exist_ok=True)
        w, h = scene.get("aspect", (832, 1216))

        print(f"\n[{scene_idx+1}/{len(SCENES)}] {scene['name']}")
        print(f"  設定: {scene['description']}")

        for var_idx in range(images_per_scene):
            positive, negative = build_prompt(scene, var_idx)
            filename = scene_dir / f"{scene['id']}_{var_idx+1:02d}.png"

            if filename.exists():
                print(f"  [{var_idx+1}/{images_per_scene}] スキップ（既存）: {filename.name}")
                generated += 1
                continue

            if dry_run:
                print(f"  [{var_idx+1}/{images_per_scene}] [DRY RUN] {filename.name}")
                print(f"    Positive: {positive[:120]}...")
                generated += 1
                continue

            print(f"  [{var_idx+1}/{images_per_scene}] 生成中...", end="", flush=True)

            try:
                images = call_txt2img(
                    positive, negative, w, h,
                    api_url=api_url,
                    seed=random.randint(0, 2**32 - 1),
                )
                for img_data in images:
                    filename.write_bytes(img_data)
                print(f" OK -> {filename.name}")
                generated += 1
            except error.URLError as e:
                print(f" ERROR: {e}")
                errors += 1
            except Exception as e:
                print(f" ERROR: {e}")
                errors += 1

            time.sleep(0.5)

    print(f"\n{'='*50}")
    print(f"完了: {generated}/{total} 枚生成, {errors} エラー")
    print(f"出力先: {output_dir}")


def export_prompts(output_file: Path | None = None):
    """全プロンプトをJSONファイルに書き出す（デバッグ・調整用）"""
    if output_file is None:
        output_file = OUTPUT_DIR / "all_prompts.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)

    prompts = []
    for scene in SCENES:
        scene_prompts = {
            "id": scene["id"],
            "name": scene["name"],
            "description": scene["description"],
            "variations": [],
        }
        for var_idx in range(IMAGES_PER_SCENE):
            pos, neg = build_prompt(scene, var_idx)
            scene_prompts["variations"].append({
                "index": var_idx + 1,
                "positive": pos,
                "negative": neg,
                "angle": CAMERA_ANGLES[var_idx % len(CAMERA_ANGLES)],
                "distance": SHOT_DISTANCES[var_idx % len(SHOT_DISTANCES)],
            })
        prompts.append(scene_prompts)

    output_file.write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"プロンプト一覧を出力: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="莉子4作目 全シーン画像生成 (AUTOMATIC1111 API)"
    )
    parser.add_argument(
        "--api-url", default=API_URL,
        help=f"AUTOMATIC1111 APIのURL (default: {API_URL})",
    )
    parser.add_argument(
        "--output", type=Path, default=OUTPUT_DIR,
        help=f"出力ディレクトリ (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--count", type=int, default=IMAGES_PER_SCENE,
        help=f"シーンあたりの画像枚数 (default: {IMAGES_PER_SCENE})",
    )
    parser.add_argument(
        "--start-scene", type=int, default=0,
        help="開始シーン番号 (0-indexed, default: 0)",
    )
    parser.add_argument(
        "--end-scene", type=int, default=None,
        help="終了シーン番号 (exclusive, 0-indexed, default: 全シーン)",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="APIを呼ばずにプロンプトだけ表示",
    )
    parser.add_argument(
        "--export-prompts", action="store_true",
        help="全プロンプトをJSONに書き出して終了",
    )
    parser.add_argument(
        "--steps", type=int, default=DEFAULT_PARAMS["steps"],
        help=f"サンプリングステップ数 (default: {DEFAULT_PARAMS['steps']})",
    )
    parser.add_argument(
        "--cfg", type=float, default=DEFAULT_PARAMS["cfg_scale"],
        help=f"CFG Scale (default: {DEFAULT_PARAMS['cfg_scale']})",
    )
    parser.add_argument(
        "--sampler", default=DEFAULT_PARAMS["sampler_name"],
        help=f"サンプラー名 (default: {DEFAULT_PARAMS['sampler_name']})",
    )

    args = parser.parse_args()

    DEFAULT_PARAMS["steps"] = args.steps
    DEFAULT_PARAMS["cfg_scale"] = args.cfg
    DEFAULT_PARAMS["sampler_name"] = args.sampler

    if args.export_prompts:
        export_prompts(args.output / "all_prompts.json")
        return

    generate_all(
        api_url=args.api_url,
        output_dir=args.output,
        images_per_scene=args.count,
        start_scene=args.start_scene,
        end_scene=args.end_scene,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
