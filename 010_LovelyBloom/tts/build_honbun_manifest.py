#!/usr/bin/env python3
"""LovelyBloom 小説版本文を、話者別に句点分割して VoiceDesign マニフェストにする。

完全版は章ファイルの結合なので対象にしない。
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_SCRIPTS = Path(r"c:\Users\lmasa\Cursor\Irodori-Studio\Irodori-TTS\scripts")
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from tts_split_concat import estimate_seconds, split_into_chunks  # noqa: E402

BASE = Path(r"c:\Users\lmasa\Cursor\N000001\010_LovelyBloom")
HONBUN = BASE / "本文"
TTS_DIR = BASE / "tts"
AUDIO = BASE / "audio"
PARTS = AUDIO / "parts"

CHAPTERS = [
    ("00_プロローグ.md", "00_プロローグ", "talk"),
    ("01_オープニングインタビュー.md", "01_オープニングインタビュー", "talk"),
    ("02_1回目.md", "02_1回目", "talk"),
    ("03_中間インタビュー.md", "03_中間インタビュー", "talk"),
    ("04_2回目_前半.md", "04_2回目_前半", "talk"),
    ("05_2回目_後半.md", "05_2回目_後半", "sex"),
    ("06_終了後インタビュー.md", "06_終了後インタビュー", "talk"),
]

# 同一話者は seed 固定。女性 caption は「女性の声」を自然文に入れる。
SPEAKERS = {
    "narr": {
        "seed": 2214,
        "caption": "20代前半の女性の声。やわらかく明るい声で、物語を読み聞かせるようにはっきりと語っている。クリアな音質。",
        "line": "落ち着いたテンポで、情景を語っている。",
    },
    "hiyori": {
        "seed": 4142,
        "talk": "22歳の小柄な女性の声。やや高めではきはきしていて、人懐っこく明るい口調で話している。近い距離感。クリアな音質。",
        "heat": "22歳の小柄な女性の声。やや高めの甘い声で、近い距離から話している。クリアな音質。",
    },
    "director": {
        "seed": 4210,
        "caption": "30代後半の男性の声。柔らかく落ち着いた声で、やさしいテンポで話している。クリアな音質。",
        "line": "少し離れたところから、穏やかに話しかけている。",
    },
    "manami": {
        "seed": 3301,
        "caption": "30代の女性の声。やわらかく面倒見のよい口調で、落ち着いて話している。クリアな音質。",
        "line": "そばにいて、やさしく確かめている。",
    },
    "yui": {
        "seed": 2088,
        "caption": "20代の女性の声。親しみやすく軽い口調で、隣にいるように話している。クリアな音質。",
        "line": "気さくに、短く話しかけている。",
    },
    "mori": {
        "seed": 4242,
        "caption": "40代の男性が、穏やかで深みのある声で、ゆっくり話している。クリアな音質。",
        "line": "低く抑えすぎず、気遣うように話している。",
    },
    "kurosaki": {
        "seed": 3131,
        "caption": "30代前半の男性の声。短く、少し強めの口調で話している。クリアな音質。",
        "line": "言葉を少なく、淡々と話している。",
    },
    "staff": {
        "seed": 2190,
        "caption": "20代の男性の声。短く事務的に、はっきりと話している。クリアな音質。",
        "line": "現場の合図を、短く言っている。",
    },
}

HIYORI_LINES = {
    "talk": "弾むように、はっきりした話し声で。",
    "shy": "声を少し細くして、照れながら話している。",
    "foreplay": "息が混じり、我慢が漏れるように途切れがちに話している。",
    "oral": "口がふさがってくぐもり、鼻から抜ける吐息が混じっている。",
    "sex": "声が高くなり、言葉が途切れて甘い息が絡んでいる。",
    "sex_talk": "息が少し混じるけれど、言葉ははっきり話している。",
    "climax": "頭が真っ白で、とろけた声が切れ切れに絡んでいる。",
    "afterglow": "息がまだ近く、力の抜けた甘い声で話している。",
}

# 章内の通し番号ではなく、ファイル内の台詞本文で固定する。
GOLDEN: list[tuple[str, str, str]] = [
    ("00_", "おはようございます", "hiyori"),
    ("00_", "おはよう、ひよりちゃん", "manami"),
    ("00_", "ゆうべは眠れた", "manami"),
    ("00_", "えへへ、ちょっと寝不足", "hiyori"),
    ("00_", "ピルは", "manami"),
    ("00_", "今朝も飲みました", "hiyori"),
    ("00_", "NGのところは", "director"),
    ("00_", "読まないでください", "hiyori"),
    ("00_", "当日判断のところは", "director"),
    ("00_", "ストップ", "director"),
    ("00_", "こうね。合図があったら", "manami"),
    ("00_", "うん、完璧", "manami"),
    ("00_", "ひより、がんばります", "hiyori"),
    ("00_", "その元気、カメラの前まで", "director"),
    ("00_", "ベースは薄め", "yui"),
    ("00_", "緊張してる？", "yui"),
    ("00_", "変ですか", "hiyori"),
    ("00_", "そういう子のほうが", "yui"),
    ("00_", "そのネックレス、かわいいね", "yui"),
    ("00_", "初めてのお給料で", "hiyori"),
    ("00_", "準備いい？", "director"),
    ("00_", "回すね", "director"),
    ("02_", "いってらっしゃい、ひよりちゃん", "yui"),
    ("02_", "Aカメ、回りました", "staff"),
    ("02_", "Bカメ、オッケー", "staff"),
    ("02_", "じゃあ森さん、お願いします", "director"),
    ("02_", "はじめまして、森です", "mori"),
    ("02_", "星野ひよりです！", "hiyori"),
    ("02_", "第一印象は？", "director"),
    ("02_", "背がおっきい", "hiyori"),
    ("02_", "背だよね", "mori"),
    ("02_", "第一印象どう？", "director"),
    ("02_", "石鹸ですか", "hiyori"),
    ("02_", "シャワー浴びてきた", "mori"),
    ("02_", "Bカメ、寄ります", "director"),
    ("02_", "冷えちゃうからね", "yui"),
    ("02_", "よくがんばったね", "mori"),
    ("04_", "タオルとガウン", "manami"),
    ("04_", "真奈美さん、ありがとうございます", "hiyori"),
    ("04_", "好きって言ってたでしょ", "manami"),
    ("04_", "いっぱい食べてね", "director"),
    ("04_", "体、どこか痛い", "manami"),
    ("04_", "わたしはずっとそばで見てる", "manami"),
    ("04_", "いっぱい泣いた？", "yui"),
    ("04_", "泣いてないです", "hiyori"),
    ("04_", "リップを少しだけ", "yui"),
    ("04_", "白、似合うね", "yui"),
    ("04_", "ベッドの真ん中に座って", "director"),
    ("04_", "また、よろしくね", "mori"),
    ("04_", "電マも使うね", "director"),
    ("04_", "止めたいときは？", "director"),
    ("04_", "すぐ止める", "kurosaki"),
    ("04_", "僕もすぐ止める", "mori"),
    ("04_", "振り向いてみて", "director"),
    ("04_", "よろしく、ひより", "kurosaki"),
    ("04_", "ぜんぶ撮る", "kurosaki"),
    ("04_", "無口だけど", "mori"),
    ("04_", "余計なこと", "kurosaki"),
    ("04_", "ちっさい", "kurosaki"),
    ("04_", "152センチ", "hiyori"),
    ("04_", "言ってない", "kurosaki"),
    ("04_", "大人っぽい", "mori"),
]


def parse_chapter(path: Path) -> list[dict]:
    segments: list[dict] = []
    buf: list[str] = []

    def flush() -> None:
        raw = "\n".join(buf).strip()
        buf.clear()
        if not raw:
            return
        lines = [ln for ln in raw.splitlines() if not ln.strip().startswith("#")]
        text = "\n".join(lines).strip()
        if text:
            segments.append({"kind": "narr", "text": text})

    for ln in path.read_text(encoding="utf-8").splitlines():
        s = ln.strip()
        if s == "---":
            flush()
            segments.append({"kind": "break"})
            continue
        if s.startswith("「") and s.endswith("」") and s.count("「") == 1:
            flush()
            segments.append({"kind": "quote", "text": s[1:-1].strip()})
            continue
        buf.append(ln)
    flush()
    return segments


def _tail(text: str, n: int = 220) -> str:
    flat = re.sub(r"\s+", "", text)
    return flat[-n:]


def _last_sentence(text: str) -> str:
    flat = re.sub(r"\s+", "", text)
    parts = [p for p in re.split(r"[。！？]", flat) if p]
    return parts[-1] if parts else ""


def prospective_speaker(before: str) -> str | None:
    """直前の地の文が、これから話す人を告げているときだけ。"""
    tail = _tail(before, 180)
    found: list[tuple[int, str]] = []
    patterns = [
        ("director", r"(監督|三宅)の声が(続|かか|返)"),
        ("director", r"(監督|三宅)が.{0,18}声をかけ"),
        ("director", r"監督の声が"),
        ("director", r"柔らかい声が返"),
        ("manami", r"真奈美の声がした"),
        ("manami", r"真奈美による"),
        ("manami", r"真奈美が.{0,24}(叩いてみせ|言った|聞いた)"),
        ("yui", r"ヘアメイクのユイ"),
        ("yui", r"ユイの手が"),
        ("staff", r"スタッフの短い声が重"),
    ]
    for sp, pat in patterns:
        for m in re.finditer(pat, tail):
            found.append((m.start(), sp))
    if not found:
        return None
    found.sort()
    return found[-1][1]


def retrospective_speaker(after: str) -> str | None:
    """直後の地の文が、いま終わった台詞の話者を指しているときだけ。"""
    head = _last_sentence(after) if False else re.sub(r"\s+", "", after)[:120]
    if not head:
        return None
    rules = [
        ("director", r"監督の.{0,16}声"),
        ("kurosaki", r"低くて短い声が"),
        ("kurosaki", r"うしろからぼそりと短い声"),
        ("director", r"監督の声が、"),
        ("staff", r"スタッフの短い声が重なって"),
        ("yui", r"^ユイは小さく手を振"),
    ]
    for sp, pat in rules:
        if re.search(pat, head):
            return sp
    return None


def arrival_speaker(before: str) -> str | None:
    """直前の数文の主語。去った人や、黙って手を振る人は話者にしない。"""
    flat = re.sub(r"\s+", "", before)
    parts = [p for p in re.split(r"[。！？]", flat) if p]
    for sent in reversed(parts[-3:]):
        if re.search(r"下が|戻って|照明の向こうへ", sent):
            continue
        if re.search(r"手を振|照れた|うなず|笑ってい", sent) and not re.search(r"声|言った|聞いた", sent):
            continue
        found: list[tuple[int, str]] = []
        for sp, pat in (
            ("director", r"監督|三宅"),
            ("manami", r"真奈美"),
            ("yui", r"ユイ"),
            ("kurosaki", r"黒崎"),
            ("mori", r"森"),
        ):
            for m in re.finditer(pat, sent):
                found.append((m.start(), sp))
        if found:
            found.sort()
            return found[-1][1]
    return None


def is_hiyori_self(text: str) -> bool:
    if text.endswith("ひより") or text.endswith("ひより。"):
        return False
    if re.search(r"(星野ひより|ひよりです|えへへ)", text):
        return True
    if re.search(r"ひより[、はがも]", text):
        return True
    if "ひよりのほう" in text or "ひよりじゃない" in text:
        return True
    if re.search(r"ひより(、)?がんば", text):
        return True
    return False


def is_polite_hiyori(text: str) -> bool:
    if text.startswith("ひよりちゃん"):
        return False
    if "ひよりちゃん" in text and not re.search(r"(です|ます|ました|でした|ください)", text):
        return False
    if re.search(r"(森さん|黒崎さん|黒崎くん)、.*(お願い|ゆっくり)", text):
        return False
    if "カメ" in text and re.search(r"お願い|寄り", text):
        return False
    if re.search(r"(です|ます|ました|でした)(ね|よ|か|！|。|…|$)", text):
        return True
    if "んです" in text or "ください" in text:
        return True
    return False


def is_moan(text: str) -> bool:
    """ひよりの喘ぎ・擬音。単語の途中（あった、あつい）は拾わない。"""
    if re.search(r"んです|ですか|ました。|です！", text) and len(text) > 24:
        return False
    return bool(
        re.search(
            r"んっ|んむ|れろ|じゅる|じゅぷ|じゅぽ|ぢゅる|ちゅぷ|くぽ|しゅき|きもちぃ|んぅ|ふぁい|れろぉ|"
            r"ひゃっ|やっ|やぁ|イく|イっ|(?:^|、|……)あっ|あっ[、…！っ]",
            text,
        )
    )


def is_director_cue(text: str) -> bool:
    if re.search(r"[AB]カメ", text) and re.search(r"お願い|寄り|回", text):
        return True
    if re.search(r"(森さん|黒崎くん|黒崎さん).{0,12}お願い", text):
        return True
    if "回すね" in text:
        return True
    return False


def is_director_prompt(text: str) -> bool:
    if "ひよりちゃん" not in text and "森さん" not in text and "黒崎" not in text:
        if re.search(r"(回すね|寄ります|カット)", text):
            return True
        return False
    return bool(
        re.search(
            r"どんな気持ち|第一印象|何する|準備いい|どう？|どう。|教えて|気持ちは|見てて|座って|振り向",
            text,
        )
    )


def bump_heat(narr: str, heat: str) -> str:
    flat = re.sub(r"\s+", "", narr)
    if re.search(r"インタビュー|シャワー|控え室|ロケ弁|ヘアメイク|ガウン姿", flat):
        return "talk"
    if re.search(r"絶頂|白く弾|中出し|注ぎこま|頭の中が、ぜんぶ", flat):
        return "climax"
    if re.search(r"挿入|腰を|奥まで|繋が|つなが|突き上げ|打ちつ", flat):
        return "sex" if heat != "climax" else heat
    if re.search(r"咥|舐め|舌を|口に含|唇をすぼ|フェラ", flat):
        if heat in ("talk", "foreplay", "oral"):
            return "oral"
        return heat
    if re.search(r"キス|乳首|胸を|愛撫|太もも|指が", flat):
        if heat == "talk":
            return "foreplay"
        return heat
    return heat


def decay_heat(heat: str, calm_run: int) -> tuple[str, int]:
    if heat == "climax":
        calm_run += 1
        if calm_run >= 2:
            return "sex", 0
        return heat, calm_run
    return heat, 0


def hiyori_phase(text: str, heat: str) -> str:
    spoken = bool(re.search(r"です|ます|だもん|だよ", text)) and len(text) >= 16
    if (not spoken) and re.search(r"♡|らめぇ|しゅき|とまん|きもちぃ|イっ|イく|でてる", text):
        return "climax"
    muffled = bool(re.search(r"んむ|れろ|じゅる|じゅぷ|じゅぽ|ぢゅる|くぽ|んっ|んぅ", text))
    if muffled and not spoken:
        return "oral"
    if heat == "climax" and not spoken:
        return "climax"
    if heat == "afterglow":
        return "afterglow"
    if spoken and heat in ("foreplay", "oral", "sex", "climax"):
        if "えへへ" in text or text.startswith("……"):
            return "shy"
        return "sex_talk"
    if heat == "foreplay" and not spoken:
        return "foreplay"
    if heat == "oral" and not spoken:
        return "oral"
    if heat == "sex" and not spoken:
        return "sex"
    if "えへへ" in text or "……" in text[:4]:
        return "shy"
    return "talk"


def classify_quote(
    text: str,
    before: str,
    after: str,
    focus: str,
    expect: str | None,
    prev_speaker: str,
) -> tuple[str, str]:
    if re.search(r"^[AB]カメ、", text) or ("オッケーです" in text and "カメ" in text):
        return "staff", "cue"
    if "はじめまして、森です" in text:
        return "mori", "intro"
    if text.endswith("よろしく、ひより"):
        return "kurosaki", "address"
    if text.startswith("おはよう") and "真奈美" in before:
        return "manami", "greet"
    if text.startswith(("ふ、", "わっ")):
        return "hiyori", "wa"
    if is_hiyori_self(text) or "えへへ" in text:
        return "hiyori", "self"
    if "うれしい" in text and "ひよりちゃん" not in text:
        return "hiyori", "tic"
    if is_moan(text):
        return "hiyori", "moan"
    if is_director_cue(text):
        return "director", "cue"
    if text.startswith("黒崎くん") and "？" not in text and "ひよりちゃん" not in text:
        return "mori", "to-kurosaki"
    if text.startswith("黒崎くん") and "？" in text:
        return "director", "ask-kurosaki"

    announced = prospective_speaker(before)
    if announced and not is_polite_hiyori(text):
        return announced, "before"
    retro = retrospective_speaker(after)
    if (
        retro == "director"
        and not is_polite_hiyori(text)
        and not is_moan(text)
        and not is_hiyori_self(text)
    ):
        return "director", "after"
    if retro and not is_polite_hiyori(text) and "ひよりちゃん" not in text:
        return retro, "after"

    if expect == "hiyori" and "？" not in text:
        return "hiyori", "expect"
    if expect == "hiyori" and re.search(r"です|ます|ました|でした", text):
        return "hiyori", "expect"
    if expect in ("mori", "kurosaki") and not is_polite_hiyori(text) and "ひよりちゃん" not in text:
        return expect, "expect"

    if re.search(r"痛いところ|午後はふたり", text):
        return "manami", "check"
    if re.search(r"そのあとは|最後は、|使うね", text):
        return "director", "rundown"
    if is_director_prompt(text) or re.search(r"(森さん|黒崎くん).{0,16}(から見て|印象|どう|は？)", text):
        return "director", "prompt"
    if re.search(r"ゆっくり(ね|お願)", text) or "僕も" in text:
        return "mori", "care"
    if text.endswith("すぐ止める"):
        return "kurosaki", "short-stop"
    if "言ってない" in text and "です" not in text:
        return "kurosaki", "deny"
    if prev_speaker == "hiyori" and text.startswith(("……", "えっ", "うぅ", "えっと", "うーん")):
        if "？" not in text:
            return "hiyori", "cont"
    if is_polite_hiyori(text):
        return "hiyori", "polite"
    if re.fullmatch(r"[はう]い[っ！。…]*", text) or text in ("はい", "うん"):
        return "hiyori", "ack"
    if (
        prev_speaker == "director"
        and "？" not in text.replace("！？", "")
        and "ひよりちゃん" not in text
        and not text.endswith(("ね", "よ"))
        and len(text) <= 24
    ):
        return "hiyori", "echo"
    if "ひよりちゃん" in text:
        if focus in ("manami", "yui", "mori", "kurosaki"):
            return focus, "focus-chan"
        return "director", "chan"
    if focus in ("mori", "kurosaki", "yui", "manami", "director"):
        return focus, "focus"
    return "director", "default"


def expect_from(text: str, speaker: str) -> str | None:
    if speaker == "director":
        if "黒崎" in text and re.search(r"印象|どう", text):
            return "kurosaki"
        if "森さん" in text and "ひよりちゃん" in text and re.search(r"印象|から見て|どう", text):
            return "mori"
        if "？" in text or text.endswith("かな"):
            return "hiyori"
    if speaker in ("manami", "yui", "mori", "kurosaki") and "？" in text:
        return "hiyori"
    return None


def normalize(text: str) -> str:
    t = text.replace("♡", "")
    t = t.replace("『", "").replace("』", "")
    t = re.sub(r"^\u3000+", "", t, flags=re.M)
    t = t.replace("\u3000", "、")
    t = t.replace("Lovely Bloom", "ラブリーブルーム")
    t = t.replace("星野ひより", "ホシノひより")
    t = t.replace("真奈美", "マナミ")
    t = t.replace("三宅", "ミヤケ")
    t = t.replace("黒崎", "クロサキ")
    t = t.replace("森さん", "モリさん")
    t = t.replace("森", "モリ")
    t = t.replace("NG", "エヌジー")
    t = t.replace("OK", "オーケー")
    t = t.replace("POV", "ピーオーブイ")
    t = t.replace("Aカメ", "エーカメ")
    t = t.replace("Bカメ", "ビーカメ")
    t = t.replace("22歳", "にじゅうにさい")
    t = t.replace("19歳", "じゅうきゅうさい")
    t = t.replace("152センチ", "ひゃくごじゅうにセンチ")
    t = t.replace("6時", "ろくじ")
    t = t.replace("2台", "にだい")
    t = t.replace("2杯", "にはい")
    t = t.replace("3ヶ月", "さんかげつ")
    t = t.replace("1回目", "いっかいめ")
    t = t.replace("2回目", "にかいめ")
    t = re.sub(r"(?<![0-9])3回", "さんかい", t)
    t = re.sub(r"(?<![0-9])4回", "よんかい", t)
    t = re.sub(r"(?<![0-9])3人", "さんにん", t)
    t = re.sub(r"(?<![0-9])2回", "にかい", t)
    t = re.sub(r"(?<![0-9])2つ", "ふたつ", t)
    t = t.replace("E、", "イー、").replace("Eな", "イーな").replace("Eです", "イーです")
    t = t.replace("夜中", "よなか")
    t = re.sub(r"夜(?=[もはにでをが、。])", "ヨル", t)
    t = t.replace("梅雨", "つゆ")
    t = t.replace("一軒家", "いっけんや")
    t = re.sub(r"、{2,}", "、", t)
    t = re.sub(r"\s+", "", t)
    t = t.strip("、")
    return t


def emoji_for(phase: str, text: str) -> str:
    if phase == "climax" and len(text) <= 40 and re.search(r"イっ|イく|らめ|しゅき|♡", text):
        return "🥵"
    if phase in ("foreplay", "oral", "sex") and len(text) <= 18 and not re.search(r"です|ます", text):
        return "🌬️"
    return ""


def caption_for(speaker: str, phase: str) -> str:
    if speaker != "hiyori":
        sp = SPEAKERS[speaker]
        return f"{sp['caption']}{sp['line']}"
    root = SPEAKERS["hiyori"]["heat" if phase in ("foreplay", "oral", "sex", "sex_talk", "climax", "afterglow") else "talk"]
    return f"{root}{HIYORI_LINES[phase]}"


def build() -> tuple[dict, dict, list[str]]:
    items: list[dict] = []
    takes: list[dict] = []
    review: list[str] = []
    quotes_by_file: dict[str, list[tuple[str, str]]] = {}

    for filename, take_id, heat0 in CHAPTERS:
        segments = parse_chapter(HONBUN / filename)
        focus = "director" if "インタビュー" in take_id or filename.startswith("00") else "director"
        if filename.startswith("05"):
            focus = "mori"
        heat = heat0
        calm = 0
        expect: str | None = None
        prev_speaker = ""
        part_rows: list[dict] = []
        qi = 0
        for idx, seg in enumerate(segments):
            if seg["kind"] == "break":
                if part_rows:
                    part_rows[-1]["gap"] = max(part_rows[-1]["gap"], 0.85)
                heat = "talk"
                continue
            if seg["kind"] == "narr":
                heat = bump_heat(seg["text"], heat)
                if heat == "climax":
                    calm = 0
                else:
                    heat, calm = decay_heat(heat, calm)
                chunks = split_into_chunks(normalize(seg["text"]))
                for ci, chunk in enumerate(chunks):
                    chunk = chunk.strip("、")
                    if not chunk:
                        continue
                    gap = 0.55 if ("、" in chunk and len(chunk) >= 28) else 0.45
                    part_rows.append(
                        {
                            "speaker": "narr",
                            "phase": "talk",
                            "text": chunk,
                            "gap": gap,
                            "why": "narr",
                        }
                    )
                continue

            before = ""
            after = ""
            if idx > 0 and segments[idx - 1]["kind"] == "narr":
                before = segments[idx - 1]["text"]
            if idx + 1 < len(segments) and segments[idx + 1]["kind"] == "narr":
                after = segments[idx + 1]["text"]
            arrival = arrival_speaker(before)
            if arrival:
                focus = arrival
            speaker, why = classify_quote(seg["text"], before, after, focus, expect, prev_speaker)
            qi += 1
            quotes_by_file.setdefault(filename, []).append((seg["text"], speaker))
            review.append(f"{filename}\t{qi:03d}\t{speaker}\t{why}\t{heat}\t{seg['text']}")
            if speaker != "hiyori":
                focus = speaker
            expect = expect_from(seg["text"], speaker)
            prev_speaker = speaker
            phase = hiyori_phase(seg["text"], heat) if speaker == "hiyori" else "talk"
            if (
                speaker == "hiyori"
                and filename[:2] in ("00", "01", "03", "06")
                and not is_moan(seg["text"])
            ):
                phase = "shy" if ("……" in seg["text"][:4] or "えへへ" in seg["text"]) else "talk"
            if speaker == "hiyori" and phase == "climax":
                heat = "climax"
                calm = 0
            spoken = normalize(seg["text"])
            mark = emoji_for(phase if speaker == "hiyori" else "", seg["text"])
            if mark:
                spoken = mark + spoken
            chunks = split_into_chunks(spoken) if len(spoken) > 55 else [spoken]
            for chunk in chunks:
                chunk = chunk.lstrip("、")
                if not chunk:
                    continue
                gap = 0.28 if speaker != "narr" else 0.4
                part_rows.append(
                    {
                        "speaker": speaker,
                        "phase": phase,
                        "text": chunk,
                        "gap": gap,
                        "why": why,
                    }
                )

        take_parts = []
        for pi, row in enumerate(part_rows, start=1):
            rel = PARTS / f"{take_id}_{pi:04d}.wav"
            items.append(
                {
                    "text": row["text"],
                    "caption": caption_for(row["speaker"], row["phase"]),
                    "seed": SPEAKERS[row["speaker"]]["seed"],
                    "seconds": estimate_seconds(row["text"]),
                    "output_wav": str(rel),
                }
            )
            take_parts.append({"wav": str(rel), "gap_after_s": row["gap"]})
        if take_parts:
            take_parts[-1]["gap_after_s"] = 1.4
        takes.append({"id": take_id, "output_wav": str(AUDIO / f"{take_id}.wav"), "parts": take_parts})

    problems = []
    for prefix, snippet, want in GOLDEN:
        hit = None
        for fn, pairs in quotes_by_file.items():
            if prefix not in fn:
                continue
            for text, sp in pairs:
                if snippet in text:
                    hit = (fn, sp, text)
                    break
        if hit is None:
            problems.append(f"MISSING {prefix} {snippet}")
        elif hit[1] != want:
            problems.append(f"MISMATCH {want}!={hit[1]} {hit[0]} {hit[2][:40]}")

    infer = {
        "hf_checkpoint": "Aratako/Irodori-TTS-v4.1-Small",
        "model_device": "cuda",
        "codec_device": "cuda",
        "codec_repo": "Aratako/Semantic-DACVAE-Japanese-32dim",
        "model_precision": "fp32",
        "codec_precision": "fp32",
        "codec_deterministic_encode": True,
        "codec_deterministic_decode": True,
        "enable_watermark": False,
        "compile_model": False,
        "compile_dynamic": False,
        "num_steps": 40,
        "cfg_scale_text": 3.0,
        "cfg_scale_caption": 4.0,
        "no_ref": True,
        "max_seconds": 14,
        "trim_tail": True,
        "tail_std_threshold": 0.05,
        "items": items,
    }
    concat = {"gap_default_s": 0.45, "tail_silence_s": 1.4, "takes": takes}
    return infer, concat, review + ["", *problems]


def write_tts_md(infer: dict) -> None:
    lines = [
        "# LovelyBloom 本文 VoiceDesign",
        "",
        "話者ごとに seed を固定し、句点で55字以内に分割した読み上げ台本。",
        "",
        "| # | text | caption |",
        "|---|------|---------|",
    ]
    for i, it in enumerate(infer["items"], start=1):
        text = it["text"].replace("|", "\\|")
        cap = it["caption"].replace("|", "\\|")
        lines.append(f"| {i} | {text} | {cap} |")
    (TTS_DIR / "本文_TTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    TTS_DIR.mkdir(parents=True, exist_ok=True)
    infer, concat, review = build()
    (TTS_DIR / "_honbun_infer.json").write_text(json.dumps(infer, ensure_ascii=False, indent=2), encoding="utf-8")
    (TTS_DIR / "_honbun_concat.json").write_text(json.dumps(concat, ensure_ascii=False, indent=2), encoding="utf-8")
    (TTS_DIR / "_honbun_speakers.tsv").write_text("\n".join(review) + "\n", encoding="utf-8")
    write_tts_md(infer)
    n = len(infer["items"])
    probs = [ln for ln in review if ln.startswith("MISSING") or ln.startswith("MISMATCH")]
    print(f"items {n} takes {len(concat['takes'])} problems {len(probs)}")
    for ln in probs:
        print(ln)


if __name__ == "__main__":
    main()
