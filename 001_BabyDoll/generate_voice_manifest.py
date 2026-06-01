"""
莉子4作目「終わらない生中出し ～二泊三日の南国旅行～」
本文から莉子のセリフを抽出し、Irodori-TTS VoiceDesign バッチ合成用
マニフェスト JSON を生成するスクリプト。

生成されたマニフェストは batch_voicedesign_babydoll.py で合成可能:
    cd Irodori-TTS
    uv run python scripts/babydoll/batch_voicedesign_babydoll.py \
        --manifest <manifest.json>
"""

import sys
import json
import re
import argparse
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

NOVEL_PATH = Path(__file__).parent / "本文" / "莉子4作目_終わらない生中出し.md"
OUTPUT_DIR = Path(__file__).parent / "voice_manifests"

# ============================================================
# シーン定義: 見出しパターン → (シーンID, 感情キャプション)
# ============================================================

SCENE_DEFS: list[dict] = [
    {
        "id": "scene01",
        "heading_pattern": r"^到着$",
        "label": "到着",
        "caption": (
            "10歳くらいの女の子の高めで明るい声。素直で無邪気な口調。"
            "南国に着いて興奮している。嬉しさが抑えきれない。"
            "はしゃいでいるが、ふとした瞬間に少しだけ大人びた響きが混じる。"
        ),
    },
    {
        "id": "scene02",
        "heading_pattern": r"^砂浜——おにいさん$",
        "label": "砂浜——おにいさん",
        "caption": (
            "10歳くらいの女の子のやわらかく甘えた声。恥ずかしそうだが素直。"
            "好きな人の前で自然に甘える口調。計算ではなく本心から出る甘さ。"
            "気持ちよさにとろけて、声が少しかすれる。"
        ),
    },
    {
        "id": "scene03",
        "heading_pattern": r"^BBQ——お肉$",
        "label": "BBQ——お肉",
        "caption": (
            "10歳くらいの女の子の元気で明るい声。お肉を美味しそうに食べている。"
            "口いっぱいに頬張りながら話す。子どもらしい無邪気さ。"
            "後半は少し戸惑いながらも受け入れる声色に変わる。"
        ),
    },
    {
        "id": "scene04",
        "heading_pattern": r"^夜——ヴィラのソファで$",
        "label": "夜——ヴィラのソファで",
        "caption": (
            "10歳くらいの女の子の乱れた甘い声。息が荒い。"
            "快感に翻弄されて声が弾ける。おねだりの声は甘く、途切れ途切れ。"
            "激しい刺激に煽られて声量が大きくなる。"
        ),
    },
    {
        "id": "scene05",
        "heading_pattern": r"^深夜——月光$",
        "label": "深夜——月光",
        "caption": (
            "10歳くらいの女の子のとても小さな囁き声。深夜。"
            "息遣いが近い。マイクのすぐそばで囁いている距離感。"
            "やさしさに包まれて、声が震えている。涙ぐんでいる。"
            "ゆっくり、静かに、一言ずつ丁寧に。"
        ),
    },
    {
        "id": "scene06",
        "heading_pattern": r"^朝——シャワーの中$",
        "label": "朝——シャワーの中",
        "caption": (
            "10歳くらいの女の子の寝起きで少しぼんやりした声。"
            "シャワーの水音の中で驚いている。寝ぼけた甘さがそのまま漏れる。"
            "頭がぼんやりしているからこそ、本音が出る。"
        ),
    },
    {
        "id": "scene07",
        "heading_pattern": r"^午前——プールサイド$",
        "label": "午前——プールサイド",
        "caption": (
            "10歳くらいの女の子の甘えた声。能動的に動いている。"
            "自分から求めているが、声は甘い。立て続けの快感で声が上ずる。"
            "おねだりの声が自然に出るようになっている。"
        ),
    },
    {
        "id": "scene08",
        "heading_pattern": r"^昼——一人の時間$",
        "label": "昼——一人の時間",
        "caption": (
            "10歳くらいの女の子の穏やかで静かな独り言。"
            "ぼんやりと考え事をしている。水面に浮かんでいる。"
            "心の中の声。小さくて、やわらかくて、少し切ない。"
        ),
    },
    {
        "id": "scene09",
        "heading_pattern": r"^午後——三人$",
        "label": "午後——三人",
        "caption": (
            "10歳くらいの女の子の壊れかけた甘い声。泣いている。"
            "気持ちよすぎて涙が止まらない。おねだりが自動的に出る。"
            "声が途切れ途切れで、甘さと嗚咽が混じっている。"
            "理性が溶けている状態の声。"
        ),
    },
    {
        "id": "scene10",
        "heading_pattern": r"^夕方——テラス$",
        "label": "夕方——テラス",
        "caption": (
            "10歳くらいの女の子の落ち着いた素直な声。"
            "泣いた後の少しかすれた声。安心できる相手の前で弱さを見せている。"
            "穏やかで、少しだけ笑っている。"
        ),
    },
    {
        "id": "scene11",
        "heading_pattern": r"^夜——全員集合$",
        "label": "夜——全員集合",
        "caption": (
            "10歳くらいの女の子の完全に蕩けた声。言葉にならない。"
            "快感が常態化して、意識が朦朧としている。"
            "甘い喘ぎ声と途切れたおねだりだけが残っている。"
            "声が裏返ったり、かすれたり、詰まったりする。"
        ),
    },
    {
        "id": "scene12",
        "heading_pattern": r"^深夜——蓮$",
        "label": "深夜——蓮",
        "caption": (
            "10歳くらいの女の子のとても小さな囁き声。深夜。暗闇。"
            "自分から相手を求めている。主導権を握っている。"
            "囁きだが、芯のある声。切実で、素直で、甘い。"
            "距離がとても近い。額が触れ合うくらい。"
        ),
    },
    {
        "id": "scene13",
        "heading_pattern": r"^朝——おにいさんと二人で$",
        "label": "朝——おにいさんと二人で",
        "caption": (
            "10歳くらいの女の子の穏やかで幸せそうな声。朝。"
            "安心しきっている。甘えた声だが、落ち着いている。"
            "笑いながら話している。にこにこしている声。"
        ),
    },
    {
        "id": "scene14",
        "heading_pattern": r"^最後のビーチ$",
        "label": "最後のビーチ",
        "caption": (
            "10歳くらいの女の子の落ち着いた、覚悟のある声。"
            "自分の意思で選んでいる。穏やかだが、芯がある。"
            "一人ひとりに向き合って、それぞれ違うトーンで話す。"
            "最後は笑いながら泣いている。"
        ),
    },
    {
        "id": "scene15",
        "heading_pattern": r"^エンディングインタビュー$",
        "label": "エンディングインタビュー",
        "caption": (
            "10歳くらいの女の子の、はっきりした自信のある声。"
            "カメラに向かって宣言している。最初は静かだが、途中から小悪魔モードが復活。"
            "いたずらっぽい笑みを含んだ挑発的な口調。舌を出すような軽さ。"
        ),
    },
    {
        "id": "scene16",
        "heading_pattern": r"^エピローグ：帰りの飛行機$",
        "label": "エピローグ：帰りの飛行機",
        "caption": (
            "10歳くらいの女の子の静かで穏やかな声。飛行機の中。"
            "日常に戻ろうとしている。少しだけ寂しい。でも前を向いている。"
            "小悪魔モードに切り替わる瞬間がある。声のトーンが変わる。"
        ),
    },
]


def extract_dialogues(text: str) -> list[dict]:
    """本文から鉤括弧内のセリフを抽出し、シーン情報付きで返す。

    Returns:
        list of {"line_num": int, "text": str, "scene_id": str,
                 "scene_label": str, "prev_lines": list[str]}
    """
    lines = text.split("\n")
    results = []
    current_scene_idx = -1

    dialogue_re = re.compile(r"「([^」]+)」")

    for line_num, line in enumerate(lines, start=1):
        stripped = line.strip()

        if stripped.startswith("### "):
            heading = stripped[4:].strip()
            for idx, sd in enumerate(SCENE_DEFS):
                if re.search(sd["heading_pattern"], heading):
                    current_scene_idx = idx
                    break

        if current_scene_idx < 0:
            continue

        prev_lines = [
            lines[max(0, line_num - 4 + j)].strip()
            for j in range(3)
            if line_num - 4 + j >= 0
        ]

        if stripped.startswith("「"):
            matches = dialogue_re.findall(stripped)
        else:
            matches = []

        for m in matches:
            clean = m.strip()
            if not clean:
                continue
            if len(clean) <= 3 and not re.search(r"[！!？?。ー〜っ]", clean):
                continue
            results.append({
                "line_num": line_num,
                "text": clean,
                "scene_id": SCENE_DEFS[current_scene_idx]["id"],
                "scene_label": SCENE_DEFS[current_scene_idx]["label"],
                "prev_lines": prev_lines,
            })

    return results


def classify_speaker(text: str, prev_lines: list[str] | None = None) -> str:
    """セリフの話者を簡易推定する。莉子以外のセリフを除外するため。

    判定ロジック:
    1. 男性キャラの口調・語彙パターン → other
    2. 莉子の口調パターン → riko
    3. 前後の地の文の手がかり → 推定
    4. それ以外 → riko（莉子の一人称小説のため）
    """
    non_riko_patterns = [
        r"^莉子ちゃん[、。]",
        r"^莉子[、。]",
        r"^よぉ、莉子",
        r"^おう[、。]",
        r"任せろ",
        r"^二号ってやめろ",
        r"^黒川拓海だ",
        r"^タクミでいい",
        r"^初めまして、莉子ちゃん",
        r"^篠原涼",
        r"^牧野剛だよ",
        r"^おじさんはやめて",
        r"^三日間、カメラの前では",
        r"^変わったよ$",
        r"^変わった$",
        r"^変じゃないよ",
        r"お前.*(生意気|かわいい|馬鹿)",
        r"^お前に言われると",
        r"^まだ食えるだろ",
        r"^食ってみろよ",
        r"^飲めよ",
        r"^舌、使え",
        r"^さっきから見てた",
        r"^眠れなくて。隣",
        r"^してない$",
        r"^昼間は周りに",
        r"^うるさい。暗くて",
        r"^気持ちいいなら、泣いて",
        r"^約束する$",
        r"^行ってらっしゃい",
        r"^莉子ちゃん、大丈夫",
        r"^莉子ちゃん、三日間",
        r"……莉子$",
        r"^……ありがとう$",
        r"^……おやすみ、莉子$",
        r"^……うん。出す",
        r"^……出すよ。中に",
        r"だろ[？?]$",
        r"だぜ[。？]?$",
        r"するぞ[。]?$",
        r"^はい、莉子",
        r"^スペシャルだ$",
        r"^こっちも、お願い",
        r"俺[がはもの]",
        r"^……眠れなくて。莉子ちゃんのこと",
        r"^……さっきの3P、俺",
        r"^……昼間は仕事だから",
        r"^……今は、ただ、触りたかった",
        r"^うん。全部$",
        r"^……昼間は、仕事の顔に戻る",
        r"^おはよう。最終日",
        r"^お前って.*おもしれぇ",
        r"^今夜.*最後",
        r"^莉子.*まっすぐ",
        r"^明日.*帰ったら",
        r"^お前.*面白い",
        r"^莉子.*変わった",
        r"^莉子ちゃん.*ありがとう",
    ]

    for pat in non_riko_patterns:
        if re.search(pat, text):
            return "other"

    riko_patterns = [
        r"あたし",
        r"ねぇ[、。]",
        r"ね[、。？?]$",
        r"おにいさん",
        r"もん[。]?$",
        r"だもん",
        r"の[。？?]$",
        r"よ[ぉ〜ー][。！!]?$",
        r"だよ[ぉ〜ー。？?]",
        r"ください",
        r"お[ね]だ[り]",
        r"して[。？]",
        r"タクミさん",
        r"涼さん",
        r"剛さん",
        r"蓮くん",
        r"ん[っ……]+[。！!]",
        r"あ[っ……]+",
        r"や[、。？?！!]",
        r"ダメ",
        r"いっちゃ",
        r"イっちゃ",
        r"中に.*(出して|ちょうだい)",
        r"おなか",
        r"ぺこぺこ",
    ]
    for pat in riko_patterns:
        if re.search(pat, text):
            return "riko"

    if prev_lines:
        context = "\n".join(prev_lines[-3:])
        if re.search(r"(店長|スタッフ|ディレクター|AD).*(言った|聞いた|告げた|声)", context):
            return "other"
        if re.search(r"(タクミ|涼|剛|蓮).*(言った|囁いた|呟いた|低い声|耳元)", context):
            return "other"

    return "riko"


def build_manifests(
    dialogues: list[dict],
    output_dir: Path,
) -> list[Path]:
    """シーンごとのマニフェストJSONを生成"""
    output_dir.mkdir(parents=True, exist_ok=True)
    created = []

    scenes_grouped: dict[str, list[dict]] = {}
    for d in dialogues:
        scenes_grouped.setdefault(d["scene_id"], []).append(d)

    for sd in SCENE_DEFS:
        scene_id = sd["id"]
        items_raw = scenes_grouped.get(scene_id, [])
        if not items_raw:
            continue

        items = []
        line_index = 0
        for d in items_raw:
            line_index += 1
            speaker = classify_speaker(d["text"], d.get("prev_lines"))
            is_riko = speaker == "riko"

            cleaned = d["text"]
            cleaned = re.sub(r"[——…]+$", "", cleaned)
            cleaned = cleaned.strip()
            if not cleaned:
                continue

            items.append({
                "line_index": line_index,
                "role": "riko" if is_riko else "other",
                "text": cleaned,
                "skip_synthesis": not is_riko,
                "novel_line": d["line_num"],
                "note": "" if is_riko else "非莉子セリフ（スキップ）",
            })

        manifest = {
            "title": f"莉子4作目 {sd['label']}",
            "episode": int(scene_id.replace("scene", "")),
            "character": "riko",
            "caption": sd["caption"],
            "hf_checkpoint": "Aratako/Irodori-TTS-500M-v2-VoiceDesign",
            "no_ref": True,
            "num_steps": 40,
            "seconds": 15.0,
            "cfg_scale_text": 3.0,
            "cfg_scale_caption": 3.0,
            "items": items,
        }

        out_path = output_dir / f"{scene_id}_riko.json"
        out_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        riko_count = sum(1 for it in items if not it.get("skip_synthesis"))
        print(f"  {out_path.name}: {riko_count}セリフ（莉子）/ {len(items)}行（全体）")
        created.append(out_path)

    return created


def main():
    parser = argparse.ArgumentParser(
        description="莉子4作目 セリフ抽出＋VoiceDesignマニフェスト生成"
    )
    parser.add_argument(
        "--novel", type=Path, default=NOVEL_PATH,
        help=f"本文ファイル (default: {NOVEL_PATH.name})",
    )
    parser.add_argument(
        "--output", type=Path, default=OUTPUT_DIR,
        help=f"マニフェスト出力先 (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="統計のみ表示（ファイル生成しない）",
    )
    args = parser.parse_args()

    print("=== 莉子4作目 音声合成マニフェスト生成 ===")
    print(f"本文: {args.novel}")

    text = args.novel.read_text(encoding="utf-8")
    dialogues = extract_dialogues(text)
    print(f"抽出セリフ数: {len(dialogues)}")

    riko_dialogues = [d for d in dialogues if classify_speaker(d["text"], d.get("prev_lines")) == "riko"]
    other_dialogues = [d for d in dialogues if classify_speaker(d["text"], d.get("prev_lines")) != "riko"]
    print(f"  莉子: {len(riko_dialogues)}セリフ")
    print(f"  他キャラ: {len(other_dialogues)}セリフ（スキップ対象）")

    print(f"\n--- シーン別内訳 ---")
    scene_counts: dict[str, dict[str, int]] = {}
    for d in dialogues:
        sc = scene_counts.setdefault(d["scene_id"], {"riko": 0, "other": 0})
        speaker = classify_speaker(d["text"], d.get("prev_lines"))
        sc[speaker] = sc.get(speaker, 0) + 1

    for sd in SCENE_DEFS:
        sid = sd["id"]
        if sid in scene_counts:
            rc = scene_counts[sid].get("riko", 0)
            oc = scene_counts[sid].get("other", 0)
            print(f"  {sd['label']}: 莉子{rc}セリフ / 他{oc}セリフ")

    if args.stats:
        return

    print(f"\n--- マニフェスト生成 ---")
    print(f"出力先: {args.output}")
    created = build_manifests(dialogues, args.output)
    print(f"\n合計: {len(created)} ファイル生成")

    print(f"\n--- 合成コマンド例 ---")
    print("# 全マニフェスト一括合成:")
    tts_dir = "001_声優・音声/Irodori-Studio/Irodori-TTS"
    print(f"cd {tts_dir}")
    print(f"uv run python scripts/babydoll/batch_voicedesign_babydoll.py \\")
    for i, p in enumerate(created):
        sep = " \\" if i < len(created) - 1 else ""
        print(f"    --manifest {p.resolve()}{sep}")

    print(f"\n# 個別シーン合成:")
    if created:
        print(f"uv run python scripts/babydoll/batch_voicedesign_babydoll.py \\")
        print(f"    --manifest {created[0].resolve()}")


if __name__ == "__main__":
    main()
