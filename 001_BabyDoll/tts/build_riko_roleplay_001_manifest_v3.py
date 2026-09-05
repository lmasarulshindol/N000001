#!/usr/bin/env python3
"""莉子ロールプレイ001 TTSマニフェスト生成（性行為中は途切れ・吐息混じり）。"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT.parent / "ロールプレイ_莉子_001.md"
OUT = ROOT / "riko_roleplay_001_manifest_v3.json"
OUT_DIR = "outputs/babydoll/riko_roleplay_001_v3"

VOICE_BASE = (
    "やや高めの幼い声の少女。小悪魔的で年上をからかう口調。"
    "近い距離感。マイク近接。残響なし。"
)

# 性行为・接触が始まった後の「台詞」向け声学（喘ぎ専用行とは別）
SEX_DIALOGUE_CAPTION = (
    "息が混じり途切れ途切れ。余裕がなく言葉が断片になる。吐息の合間に話す。"
)
SEX_MOAN_CAPTION = "甘い喘ぎ。息混じり。途切れがち。"
SEX_CLIMAX_CAPTION = "絶頂で頭が真っ白。とろけた声が絡む。息が荒い。"
SEX_AFTER_CAPTION = "絶頂の余韻。息切れ。掠れた弱めの声。"


def estimate_seconds(text: str) -> float:
    clean = re.sub(r"[\U0001F300-\U0001FAFF]", "", text)
    n = len(clean.replace("……", "").replace("——", "").replace("っ", ""))
    if n <= 4:
        return 5.0
    if n <= 10:
        return 8.0
    if n <= 20:
        return 10.0
    if n <= 35:
        return 12.0
    if n <= 55:
        return 14.0
    return 16.0


def fragment_sex_dialogue(text: str) -> str:
    """性行為中の台詞を切れ切れにする（語中分割はしない）。"""
    t = text.strip()
    core = re.sub(r"[\U0001F300-\U0001FAFF]", "", t)
    if len(re.sub(r"[っ！？…—〜ぁあうわやひんむ\s]", "", core)) <= 2:
        return t

    # 句点は常に途切れへ（切れ切れ原文でも）
    t = t.replace("。", "……っ")
    t = t.replace("、", "……")
    t = re.sub(r"……+", "……", t)

    # 原文がすでに切れ切れなら、ここで終了
    core2 = re.sub(r"[\U0001F300-\U0001FAFF]", "", t)
    if core2.count("……") >= 2 or core2.count("っ") >= 3:
        return t

    t = re.sub(r"……+", "……", t)
    t = re.sub(r"(っ){2,}", "っ", t)
    bare = re.sub(r"[\U0001F300-\U0001FAFF]", "", t)
    if len(bare) > 24 and bare.count("……") < 2:
        cut = len(t) // 2
        for j in range(max(1, cut - 4), min(len(t) - 1, cut + 8)):
            if t[j] in "っ　 ":
                t = t[: j + 1] + "……" + t[j + 1 :]
                break
        else:
            t = t[:cut] + "……っ" + t[cut:]
    t = re.sub(r"……+", "……", t)
    return t


def add_emoji_prefix(text: str, emojis: str) -> str:
    # 先頭に既にある絵文字は残し、必要なものを足す
    if not emojis:
        return text
    existing = set(re.findall(r"[\U0001F300-\U0001FAFF]", text))
    to_add = "".join(e for e in emojis if e not in existing)
    if not to_add:
        return text
    # 先頭の絵文字ブロックの後ろ、または先頭
    m = re.match(r"^([\U0001F300-\U0001FAFF]+)", text)
    if m:
        return m.group(1) + to_add + text[len(m.group(1)) :]
    return to_add + text


def classify_block(block_idx: int, text: str) -> str:
    """
    ロールプレイ進行に沿った粗分類。
    block_idx: 莉子のブロック番号（1始まり）
    """
    # 導入〜キス前後
    if block_idx <= 2:
        return "intro"
    # 愛撫・指・絶頂1
    if block_idx <= 8:
        return "sex"
    # 指イキ直後・交渉
    if block_idx <= 10:
        return "after_finger"
    # フェラ・奉仕（ある程度余裕あり、ただし興奮で息は混じる）
    if block_idx <= 16:
        return "oral"
    # 妊娠トーク〜挿入〜本番〜後背位〜中出し〜余韻
    if block_idx <= 28:
        return "sex"
    return "afterglow"


def is_moan_like(text: str) -> bool:
    core = re.sub(r"[\U0001F300-\U0001FAFF\s「」]", "", text)
    dialogue_words = (
        "だめ",
        "いや",
        "もっと",
        "おじさん",
        "イく",
        "いく",
        "中に",
        "出して",
        "すき",
        "好き",
        "お仕事",
        "お願い",
        "入れて",
        "ばか",
        "意地悪",
        "うるさい",
        "締めて",
        "気持ち",
        "違う",
        "初めて",
        "鳴け",
        "無理",
        "ゆっくり",
        "満タン",
        "責任",
        "ピル",
        "せーし",
    )
    if any(w in text for w in dialogue_words) and len(core) > 8:
        return False
    moan_tokens = ("あっ", "んぁ", "ひぁ", "あぁ", "やっ", "んっ", "はぁ", "ひっ")
    if len(core) <= 14 and any(t in core for t in moan_tokens):
        return True
    return len(core) <= 6


def style_line(phase: str, text: str) -> tuple[str, str]:
    raw = text.strip()

    if phase == "intro":
        if "緊張" in raw or "お話" in raw:
            return add_emoji_prefix(raw, "😏🫣"), "甘えてからかう。少し照れ。"
        if "！？" in raw or raw.startswith("——"):
            return add_emoji_prefix(raw, "😲"), "不意を突かれて息をのむ。"
        if "ぷは" in raw:
            return add_emoji_prefix(raw, "🌬️"), "キスが離れて荒い息。"
        if any(x in raw for x in ("ねぇ", "ふふ", "変態", "指名", "強引", "キス", "足りない")):
            return add_emoji_prefix(raw, "😏"), "からかう口調。余裕。近い距離。"
        return raw, "からかう口調。余裕。近い距離。"

    if phase == "oral":
        if any(x in raw for x in ("れろ", "んむ", "じゅる", "ちゅ", "んぐ", "じゅぷ", "おえっ")):
            return add_emoji_prefix(raw, "👅"), "舐める音と水音。口が塞がり気味。"
        if "注文" in raw or "素直" in raw or "得意" in raw or "褒めて" in raw or "上手" in raw:
            return add_emoji_prefix(raw, "😏"), "奉仕の合間の小悪魔。少し息が上がる。"
        if any(x in raw for x in ("せーし", "にんしん", "妊娠", "ピル", "責任", "精子")):
            t = add_emoji_prefix(fragment_sex_dialogue(raw), "🌬️🥺")
            return t, "息混じり。恥ずかしさで声が途切れる。余裕が薄い。"
        if any(x in raw for x in ("欲しい", "早く", "ちょうだい", "入るんだ")):
            t = add_emoji_prefix(fragment_sex_dialogue(raw), "🌬️🥵")
            return t, SEX_DIALOGUE_CAPTION
        t = add_emoji_prefix(raw, "🌬️") if "っ" in raw else raw
        return t, "奉仕中。息が少し上がる。"

    if phase in ("after_finger", "afterglow"):
        if is_moan_like(raw) or any(x in raw for x in ("はぁ", "あ……", "ぁ……")):
            return add_emoji_prefix(raw, "🌬️"), SEX_AFTER_CAPTION
        t = add_emoji_prefix(fragment_sex_dialogue(raw), "🌬️🥺")
        return t, "余韻で息切れ。掠れ。言葉がまとまらない。"

    # phase == sex
    if is_moan_like(raw):
        if any(x in raw for x in ("イく", "いく", "イっ", "きたっ")):
            return add_emoji_prefix(raw, "🥵😱"), SEX_CLIMAX_CAPTION
        return add_emoji_prefix(raw, "🥵🌬️"), SEX_MOAN_CAPTION

    # 性行為中の「台詞」→ 切れ切れ・吐息必須（喘ぎ専用ではない）
    frag = fragment_sex_dialogue(raw)
    frag = add_emoji_prefix(frag, "🌬️🥵")
    cap = SEX_DIALOGUE_CAPTION
    if any(x in raw for x in ("お願い", "入れて", "出して", "もっと", "一緒に", "満タン")):
        cap = "息混じり途切れ途切れ。余裕なくおねだり。吐息の合間に。"
    if any(x in raw for x in ("すき", "好き", "お仕事")):
        cap = "息混じり途切れ途切れ。本音が漏れる。余裕がない。"
    return frag, cap


def parse_riko_lines(md: str) -> list[tuple[int, str]]:
    """**莉子**：ブロック内の「」セリフを順に抽出。"""
    lines: list[tuple[int, str]] = []
    block_idx = 0
    in_riko = False
    for line in md.splitlines():
        if line.strip().startswith("**莉子**"):
            in_riko = True
            block_idx += 1
            continue
        if line.strip().startswith("**男優**"):
            in_riko = False
            continue
        if line.strip().startswith("---"):
            # シーン区切りでも莉子継続があり得るので、男優以外は維持
            continue
        if not in_riko:
            continue
        m = re.match(r"^[\u3000\s]*[「『]([^」』]+)[」』]", line.strip())
        if not m:
            continue
        body = m.group(1).strip()
        if not body or body == "…………":
            continue
        lines.append((block_idx, body))
    return lines


def build() -> dict:
    md = SRC.read_text(encoding="utf-8")
    rows = parse_riko_lines(md)
    items = []
    for i, (block_idx, body) in enumerate(rows, start=1):
        phase = classify_block(block_idx, body)
        text, caption = style_line(phase, body)
        items.append(
            {
                "line_index": i,
                "block": block_idx,
                "phase": phase,
                "text": text,
                "caption": caption,
                "seconds": estimate_seconds(text),
                "output_wav": f"{OUT_DIR}/riko_{i:03d}.wav",
            }
        )
    return {
        "title": "莉子ロールプレイ001「BabyDoll通常接客」v3（性行為中途切れ吐息）",
        "episode": "riko_roleplay_001",
        "character": "riko",
        "character_label": "佐藤 莉子",
        "source_md": "N000001/001_BabyDoll/ロールプレイ_莉子_001.md",
        "caption": VOICE_BASE,
        "hf_checkpoint": "Aratako/Irodori-TTS-500M-v2-VoiceDesign",
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
        "seed": 20260905,
        "cfg_scale_text": 3.0,
        "cfg_scale_caption": 6.0,
        "no_ref": True,
        "seconds": 14.0,
        "trim_tail": True,
        "tail_std_threshold": 0.09,
        "line_count": len(items),
        "items": items,
    }


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"missing: {SRC}")
    data = build()
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sex_n = sum(1 for x in data["items"] if x["phase"] == "sex")
    print(f"Wrote {data['line_count']} lines -> {OUT}")
    print(f"  sex phase lines: {sex_n}")
    # sample sex dialogue (non-moan)
    print("ok")


if __name__ == "__main__":
    main()
