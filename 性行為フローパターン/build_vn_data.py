# -*- coding: utf-8 -*-
"""HPT セリフ MD から vn-data.js を生成する。"""
from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent

NODE_LABELS = {
    "ST01": "ST01(イベント・会話進行)",
    "ST02": "ST02(雰囲気・関係性の変化)",
    "ST03": "ST03(Hシーン突入トリガー)",
    "IN00": "IN00(Hシーン開始)",
    "IN01": "IN01(場所・状況の提示)",
    "IN02": "IN02(キス・抱き寄せ)",
    "IN03": "IN03(衣服を乱す/脱衣開始)",
    "IN10": "IN10(入浴・シャワー)",
    "FP01": "FP01(胸・首筋への愛撫)",
    "FP02": "FP02(身体を撫でる)",
    "FP03": "FP03(下着をずらす/脱がす)",
    "FP04": "FP04(手指での愛撫)",
    "FP05": "FP05(口での愛撫)",
    "FP06": "FP06(感度・濡れの確認)",
    "FP07": "FP07(挿入準備・体位を整える)",
    "FP08": "FP08(パイズリ)",
    "FP09": "FP09(手コキ)",
    "FP10": "FP10(素股)",
    "FP11": "FP11(両手コキ)",
    "FP12": "FP12(フェラと手コキ同時)",
    "MN00": "MN00(生で挿入)",
    "MN01": "MN01(挿入)",
    "MN02": "MN02(ゆっくりした抽送)",
    "MN03": "MN03(テンポを上げる)",
    "MN04": "MN04(体位変更)",
    "MN05": "MN05(クライマックス接近)",
    "MN06": "MN06(絶頂)",
    "MN07": "MN07(射精/中出しor外出し)",
    "MN11": "MN11(フェラ中・後背位挿入)",
    "MN12": "MN12(抽送・口奉仕継続)",
    "MN15": "MN15(二人責め・接近)",
    "MN16": "MN16(二人にイカされる)",
    "MN17": "MN17(1人目中出し)",
    "MN21": "MN21(正常位＋お掃除フェラ)",
    "MN22": "MN22(抽送・お掃除継続)",
    "MN27": "MN27(中出しと口内射精同時)",
    "AF01": "AF01(余韻・呼吸を整える)",
    "AF02": "AF02(抱き合い・会話)",
    "AF03": "AF03(後始末・着衣)",
    "AF10": "AF10(会話・心理・インタビュー延長)",
    "AF11": "AF11(控え室・ソロ)",
    "AF99": "AF99(Hシーン終了→ストーリー再開)",
    "FIN": "FIN(奉仕フィニッシュ)",
}

BRANCH_POINTS = {
    # MN00 は生固定（選択肢なし）。protection は常に raw。
    "MN07": {
        "title": "本番フィニッシュ",
        "promptKey": "MN07:prompt",
        "choices": [
            {
                "id": "creampie",
                "label": "中に出す",
                "actKey": "MN07:act:中",
                "dialogueKey": "MN07:中",
                "finish": "creampie",
            },
            {
                "id": "pullout",
                "label": "外に出す",
                "actKey": "MN07:act:外",
                "dialogueKey": "MN07:外",
                "finish": "pullout",
            },
        ],
        # セリフキーは protection=raw 固定で {base}:生 に解決
        "protectSuffix": True,
    },
    "FIN_ORAL": {
        "title": "口奉仕フィニッシュ",
        "atNode": "FIN",
        "promptKey": "FIN:prompt",
        "choices": [
            {"id": "mouth", "label": "口に出す", "actKey": "FIN:act:口", "dialogueKey": "FIN:口"},
            {"id": "face", "label": "顔にかける", "actKey": "FIN:act:顔", "dialogueKey": "FIN:顔"},
            {"id": "chest", "label": "胸にかける", "actKey": "FIN:act:胸", "dialogueKey": "FIN:胸"},
            {"id": "hold", "label": "我慢する（奉仕継続）", "dialogueKey": "FIN:我慢", "loop": True},
        ],
    },
    "FIN_PAIZURI": {
        "title": "パイズリフィニッシュ",
        "atNode": "FIN",
        "promptKey": "FIN:prompt",
        "choices": [
            {"id": "chest", "label": "胸に出す", "actKey": "FIN:act:胸", "dialogueKey": "FIN:胸"},
            {"id": "face", "label": "顔にかける", "actKey": "FIN:act:顔", "dialogueKey": "FIN:顔"},
            {"id": "hold", "label": "我慢する（奉仕継続）", "dialogueKey": "FIN:我慢", "loop": True},
        ],
    },
}

DEFAULT_FIN_ACT = {
    "FIN:act:口": "（口の中で射精する）",
    "FIN:act:顔": "（顔にかけて射精する）",
    "FIN:act:胸": "（胸にかけて射精する）",
}

SERVICE_ROUTE_BRANCH = {
    "FP05": "FIN_ORAL",
    "FP08": "FIN_PAIZURI",
}

# MN07 フィニッシュ直後に、中出し/外出しで差し替えるノード
POST_MN07_VARIANT_NODES = ["AF01", "AF02", "AF03", "AF10"]

# 中出しルート専用の語（外出し側テキストに入っていたら矛盾）
INSIDE_ROUTE_RE = re.compile(
    r"(抜かない|中に[、]?出|中、いっぱい|中で(?!外)|子宮|溢[れる]|注[がが]|孕|生(?!活)|"
    r"コンドーム.*(なし|無)|中に.*?あったか|中が.*?熱)"
)

# 外出しルート専用の語（中出し側リアクションに単独で強く出たら要確認）
OUTSIDE_ROUTE_RE = re.compile(
    r"(外に(出|出し)|外出し|抜い(て|た)|顔(に|へ).*?(出|かけ|汚)|胸(に|へ).*?(出|かけ)|"
    r"盛り付け|ティッシュ|拭(いて|い))"
)

# 各 HPT の進行定義: linear または branch
FLOWS: dict[str, dict] = {
    "HPT-01": {
        "title": "HPT-01(一本道スタンダード)",
        "linear": [
            "IN00", "IN01", "IN02", "IN03",
            "FP01", "FP02", "FP03", "FP04", "FP05", "FP06", "FP07",
            "MN01", "MN02", "MN03", "MN05", "MN06", "MN07",
            "AF01", "AF02", "AF03", "AF99",
        ],
    },
    "HPT-02": {
        "title": "HPT-02(前戯短縮)",
        "linear": [
            "IN00", "IN01", "IN02", "IN03", "FP06", "FP07",
            "MN01", "MN02", "MN03", "MN05", "MN06", "MN07", "AF01", "AF99",
        ],
    },
    "HPT-04": {
        "title": "HPT-04(口先行)",
        "linear": [
            "IN00", "IN01", "IN02", "IN03",
            "FP01", "FP02", "FP05", "FP04", "FP06", "FP07",
            "MN01", "MN02", "MN03", "MN05", "MN06", "MN07",
            "AF01", "AF02", "AF03", "AF99",
        ],
    },
    "HPT-17": {
        "title": "HPT-17(奉仕フィニッシュ)",
        "linear": ["IN00", "IN01", "IN02", "IN03", "FP01", "FP02", "FP03"],
        "branch": {
            "at": "FP03",
            "choices": [
                {"label": "FP08(パイズリ)", "next": "FP08"},
                {"label": "FP05(口での愛撫)", "next": "FP05"},
                {"label": "FP09(手コキ)", "next": "FP09"},
                {"label": "FP10(素股)", "next": "FP10"},
            ],
            "tail": ["FIN", "AF01", "AF02", "AF03", "AF99"],
        },
    },
    "HPT-15": {
        "title": "HPT-15(ドキュメンター)+HPT-04体部",
        "linear": [
            "ST01", "ST02", "ST03",
            "IN00", "IN01", "IN02", "IN03",
            "FP01", "FP02", "FP05", "FP04", "FP06", "FP07",
            "MN01", "MN02", "MN03", "MN05", "MN06", "MN07",
            "AF01", "AF02", "AF03", "AF99", "AF11",
        ],
    },
}

_std_mn = ["MN01", "MN02", "MN03", "MN05", "MN06", "MN07"]
_std_af = ["AF01", "AF02", "AF03", "AF99"]
_in = ["IN00", "IN01", "IN02", "IN03"]
_fp_full = ["FP01", "FP02", "FP03", "FP04", "FP05", "FP06", "FP07"]

FLOWS["HPT-03"] = {"title": "HPT-03(前戯フル)", "linear": _in + _fp_full + _std_mn + _std_af}
FLOWS["HPT-05"] = {
    "title": "HPT-05(指・絶頂優先)",
    "linear": _in + ["FP01", "FP02", "FP03", "FP04", "FP06", "FP07"] + _std_mn + _std_af,
}
FLOWS["HPT-06"] = {
    "title": "HPT-06(体位変更1回)",
    "linear": _in + _fp_full + ["MN01", "MN02", "MN03", "MN04", "MN05", "MN06", "MN07"] + _std_af,
}
FLOWS["HPT-07"] = {
    "title": "HPT-07(騎乗位主導)",
    "linear": _in + _fp_full + _std_mn + _std_af,
}
FLOWS["HPT-08"] = {
    "title": "HPT-08(後背位フィニッシュ)",
    "linear": _in + _fp_full + ["MN01", "MN02", "MN03", "MN04", "MN05", "MN06", "MN07"] + _std_af,
}
FLOWS["HPT-09"] = {
    "title": "HPT-09(二回戦)",
    "linear": _in + _fp_full + _std_mn + ["AF01"] + _std_mn + _std_af,
}
FLOWS["HPT-10"] = {
    "title": "HPT-10(事後厚め)",
    "linear": _in + _fp_full + _std_mn + ["AF01", "AF02", "AF10", "AF03", "AF99"],
}
FLOWS["HPT-11"] = {
    "title": "HPT-11(多回戦)",
    "linear": _in + _fp_full + _std_mn + ["AF01", "AF10"] + _std_mn + ["AF01", "AF10"] + _std_mn + _std_af,
}
FLOWS["HPT-12"] = {
    "title": "HPT-12(体位多段)",
    "linear": _in + _fp_full + ["MN01", "MN02", "MN03", "MN04", "MN03", "MN04", "MN05", "MN06", "MN07"] + _std_af,
}
FLOWS["HPT-13"] = {"title": "HPT-13(対面座位フィニッシュ)", "linear": _in + _fp_full + _std_mn + _std_af}
FLOWS["HPT-14"] = {
    "title": "HPT-14(入浴から)",
    "linear": ["IN00", "IN10", "IN01", "IN02", "IN03"] + _fp_full + _std_mn + _std_af,
}
FLOWS["HPT-16"] = {
    "title": "HPT-16(パイズリ経由)",
    "linear": _in + ["FP01", "FP02", "FP03", "FP08", "FP06", "FP07"] + _std_mn + _std_af,
}

# HPT-18: 男2女1・同時奉仕
_hpt18_fp = ["FP01", "FP02", "FP03", "FP11", "FP12", "FP06", "FP07"]
_hpt18_mn = ["MN11", "MN12", "MN15", "MN16", "MN17", "MN21", "MN22", "MN27"]
FLOWS["HPT-18"] = {
    "title": "HPT-18(男2女1・同時奉仕)",
    "linear": _in + _hpt18_fp + _hpt18_mn + _std_af,
}


def inject_mn00(linear: list[str]) -> list[str]:
    """最初の MN01 または MN11 の直前に MN00 を1回だけ挿入（HPT-17 等は対象外）。"""
    out: list[str] = []
    done = False
    for n in linear:
        if n in ("MN01", "MN11") and not done:
            out.append("MN00")
            done = True
        out.append(n)
    return out


for _fid, _flow in list(FLOWS.items()):
    if _flow.get("linear"):
        _flow["linear"] = inject_mn00(_flow["linear"])

HPT_REF_RE = re.compile(r"HPT-(\d+)")


def _append_node_line(out: dict[str, str | list[str]], node_id: str, text: str) -> None:
    text = text.strip()
    if not text:
        return
    if node_id not in out:
        out[node_id] = text
        return
    prev = out[node_id]
    if isinstance(prev, list):
        prev.append(text)
    else:
        out[node_id] = [prev, text]


def _split_route_footnotes(body: str) -> tuple[str, str | None, str | None]:
    """本文と ※中出し後 / ※外出し後 を分離。"""
    inside_note: str | None = None
    outside_note: str | None = None
    main_lines: list[str] = []
    for line in body.splitlines():
        s = line.strip()
        m_in = re.match(r"^※中出し後\s*[:：]\s*(.+)$", s)
        m_out = re.match(r"^※外出し後\s*[:：]\s*(.+)$", s)
        if m_in:
            inside_note = m_in.group(1).strip()
            continue
        if m_out:
            outside_note = m_out.group(1).strip()
            continue
        main_lines.append(line)
    main = "\n".join(main_lines).strip()
    return main, inside_note, outside_note


def _split_protection_footnotes(body: str) -> tuple[str, str | None, str | None]:
    """本文と ※ゴム / ※生 を分離。"""
    condom: str | None = None
    raw: str | None = None
    main_lines: list[str] = []
    for line in body.splitlines():
        s = line.strip()
        m_c = re.match(r"^※ゴム\s*[:：]\s*(.+)$", s)
        m_r = re.match(r"^※生\s*[:：]\s*(.+)$", s)
        if m_c:
            condom = m_c.group(1).strip()
            continue
        if m_r:
            raw = m_r.group(1).strip()
            continue
        main_lines.append(line)
    return "\n".join(main_lines).strip(), condom, raw


def _split_mn07_variants(body: str) -> tuple[str, str | None]:
    """本文と ※外出し 行を分離。"""
    pullout: str | None = None
    main_lines: list[str] = []
    for line in body.splitlines():
        m = re.match(r"^※外出し\s*[:：]\s*(.+)$", line.strip())
        if m:
            pullout = m.group(1).strip().strip("「」")
            if not pullout.startswith("「"):
                pullout = f"「{pullout}」" if pullout else pullout
            continue
        main_lines.append(line)
    main = "\n".join(main_lines).strip()
    return main, pullout


def _parse_inline_nodes(part: str, out: dict[str, str | list[str]]) -> None:
    chunks = re.split(r"\*\*([A-Z]+\d+)[:：]\*\*\s*", part)
    if len(chunks) < 3:
        return
    for node_id, text in zip(chunks[1::2], chunks[2::2]):
        text = text.strip()
        if node_id == "MN07":
            main, pullout = _split_mn07_variants(text)
            _append_node_line(out, "MN07", main)
            if pullout:
                out["MN07:外"] = pullout
        else:
            _append_node_line(out, node_id, text)


def _merge_include_from_body(body: str, char_dir: Path, seen: set[Path]) -> dict[str, str | list[str]]:
    merged: dict[str, str | list[str]] = {}
    if "HPT-01 同様" in body or "HPT-01同様" in body:
        ref = char_dir / "HPT-01_セリフ.md"
        if ref.is_file() and ref not in seen:
            merged.update(parse_dialogue_file(ref, char_dir, seen))
    ref_m = HPT_REF_RE.search(body)
    if ref_m and ("使用" in body or "同様" in body or "想定" in body):
        num = ref_m.group(1)
        ref = char_dir / f"HPT-{num}_セリフ.md"
        if ref.is_file() and ref not in seen:
            merged.update(parse_dialogue_file(ref, char_dir, seen))
    return merged


def parse_dialogue_file(path: Path, char_dir: Path | None = None, seen: set[Path] | None = None) -> dict[str, str | list[str]]:
    if not path.is_file():
        return {}
    if seen is None:
        seen = set()
    if path in seen:
        return {}
    seen.add(path)
    if char_dir is None:
        char_dir = path.parent

    text = path.read_text(encoding="utf-8")
    out: dict[str, str | list[str]] = {}
    parts = re.split(r"\n---+\n", text)
    for part in parts:
        part = part.strip()
        if not part:
            continue
        m = re.match(r"###\s+(.+?)\s*\n\n(.*)", part, re.S)
        if not m:
            _parse_inline_nodes(part, out)
            continue
        title, body = m.group(1).strip(), m.group(2).strip()

        if "〜" in title or "～" in title:
            out.update(_merge_include_from_body(body, char_dir, seen))
            _parse_inline_nodes(body, out)
            continue

        included = _merge_include_from_body(body, char_dir, seen)
        if included:
            out.update(included)

        if "MN01" in title and "MN07" in title:
            _parse_inline_nodes(body, out)
            continue
        if "AF01" in title and "AF99" in title:
            _parse_inline_nodes(body, out)
            continue

        id_m = re.match(r"([A-Z]+\d+)", title) or re.search(r"([A-Z]+\d+)", title)

        if "**" in body and re.search(r"\*\*[A-Z]+\d+\*\*", body):
            _parse_inline_nodes(body, out)
            continue

        node_id = id_m.group(1) if id_m else None
        if title.startswith("FIN") or "フィニッシュ" in title and node_id is None:
            node_id = "FIN"

        if not node_id:
            continue

        if node_id == "MN07":
            main, pullout = _split_mn07_variants(body)
            _append_node_line(out, "MN07", main)
            if pullout:
                out["MN07:外"] = pullout
        elif node_id in ("MN00", "MN01"):
            main, _condom, raw = _split_protection_footnotes(body)
            if node_id == "MN00":
                parts = [x for x in (main, raw) if x]
                if parts:
                    out["MN00"] = "\n\n".join(parts)
                if main:
                    out["MN00:prompt"] = main
                if raw:
                    out["MN00:生"] = raw
            else:
                if main:
                    _append_node_line(out, "MN01", main)
                if raw:
                    out["MN01:生"] = raw
                if raw and not main:
                    _append_node_line(out, "MN01", raw)
        elif node_id in POST_MN07_VARIANT_NODES:
            main, note_in, note_out = _split_route_footnotes(body)
            if note_in:
                out[f"{node_id}:中"] = note_in
            if note_out:
                out[f"{node_id}:外"] = note_out
            if main:
                if INSIDE_ROUTE_RE.search(main) and not OUTSIDE_ROUTE_RE.search(main):
                    out[f"{node_id}:中"] = main
                elif OUTSIDE_ROUTE_RE.search(main) and not INSIDE_ROUTE_RE.search(main):
                    out[f"{node_id}:外"] = main
                else:
                    _append_node_line(out, node_id, main)
        else:
            _append_node_line(out, node_id, body)

    return out


# 選択「後」リアクションにだけ出すべき語
RESULT_AFTER_RE = re.compile(
    r"(あったかい|いっぱい|溢[れる]|ごくん|どろ|脉|ビク|しょっぱ|べとべと|粘つ|谷間.*いっぱい|う、うぅ|汚された|汚した)"
)

# prompt に入ってはいけない「事後」語（予感の「温かいの、来る」は除外）
PROMPT_FORBIDDEN_RE = re.compile(
    r"(あったかい|いっぱい|溢[れる]|ごくん|どろどろ|べとべと|粘つ)"
)

# 許可・指示（選択後の MN07:中/外 には入れない）
PERMISSION_RE = re.compile(
    r"(出していい|出して[。、]|出して\s|ちょうだい|ください|全部|どおり|盛り付け|外に、出|中に、出|中、出して|中にっ)"
)

DEFAULT_MN07_ACT = {
    "MN07:act:中:生": "（そのまま深く抱き寄せ、生のまま膣内で射精する）",
    "MN07:act:外:生": "（腰を引き、外へ抜いてから射精する）",
}

DEFAULT_MN00_ACT = {
    "MN00:act:生": "（何もつけず、そのまま先端をあてがう）",
}

DEFAULT_MN00: dict[str, dict[str, str]] = {
    "riko": {
        "MN00:prompt": "（息を整え、下を見やる）\n\n「……入れて……っ……生で……っ」",
        # 選択「後」は反応のみ（許可・指示禁止）
        "MN00:生": "「ん……っ……熱い……っ……直接……っ」",
        "MN01:生": "「っ……あ……っ……生……入っ……た……っ……熱い……っ」",
        "MN07:prompt:生": "「中……出して……っ……全部……ちょうだい……っ」",
        "MN07:中:生": "「あっ……あったかい……っ……中、いっぱい……んぅっ……」",
        "MN07:外:生": "「……あ、外……っ……んあっ……！　……お腹……熱い……っ……う、ぅっ……」",
    },
    "popura": {
        "MN00:prompt": "（息を整え、小さくうなずく）\n\n「……入れ……ますか……？　……生……で……っ」",
        "MN00:生": "「ん……っ……熱い……です……っ……直接……っ」",
        "MN01:生": "「っ……あ……っ……生……入っ……た……っ……熱い……っ」",
        "MN07:prompt:生": "「中……にっ……！　出して……ください……っ……全部……っ」",
        "MN07:中:生": "「あっ……あったかい……っ……中、いっぱい……んぅっ……ごちそう……さま……っ」",
        "MN07:外:生": "「……あ、外……っ……んあっ……！　……お腹……熱い……っ……う、ぅっ……」",
    },
    "ai": {
        "MN00:prompt": "（息を整え、目線だけ上げる）\n\n「……入れる……とき……っ……生……で……いい……？……っ」",
        "MN00:生": "「ん……っ……熱い……っ……直接……っ」",
        "MN01:生": "「っ……あ……っ……生……入っ……た……っ……熱い……っ」",
        "MN07:prompt:生": "「中に、出して、いい、ですよ……。……全部、ください……」",
        "MN07:中:生": "「あっ……あったかい……っ……中、いっぱい……んぅっ……」",
        "MN07:外:生": "「……あ、外……っ……んあっ……！　……お腹……熱い……っ……う、ぅっ……」",
    },
}

DEFAULT_MN07_INSIDE: dict[str, str] = {
    "riko": "「あっ……あったかい……。……中、いっぱい……ん……」",
    "popura": "「あっ……あったかい……。……中、いっぱい……ん……。……ごちそう、さま……でした……」",
    "ai": "「あっ……あったかい……。……中、いっぱい……ん……」",
}

DEFAULT_MN07_OUTSIDE: dict[str, str] = {
    "riko": "「……外、……？　……ん、っ……。……まだ、中、熱いのに……。……汚した、でしょ……」",
    "popura": "「……あ、外、に……。……んっ……。……か、顔、に……？　……う、うぅ……」",
    "ai": "「……あ、外……っ。……んっ……。……お腹の上、……熱い……。……う、うぅ……」",
}

DEFAULT_AF_AFTER: dict[str, dict[str, str]] = {
    "riko": {
        "AF01:中:生": "「はぁ……はぁ……。……重い。……まだ、抜かないで。……ちょっとだけ」",
        "AF01:外:生": "「はぁ……はぁ……。……外、出したのに……。……離れないで。……まだ、余韻……」",
        "AF02:中:生": "「……どうだった？ あたし、可愛かった？ ……当たり前ね」",
        "AF02:外:生": "「……外、汚したくせに。……どうだった？ ……当たり前、可愛いでしょ」",
        "AF03:中:生": "「タオル、取って。……ベビードール、着直すの手伝って。……リボン、後ろで結べる？」",
        "AF03:外:生": "「タオル、取って。……顔、拭いて。……ベビードール、着直すの手伝って」",
    },
    "popura": {
        "AF01:中:生": "「はぁ……はぁ……。……重い……です。……まだ、抜かないで……ください。……ちょっと、だけ……」",
        "AF01:外:生": "「はぁ……はぁ……。……外、に……出しました、ね……。……離れないで……ください……」",
        "AF02:中:生": "「……どう、でしたか？　私、可愛かった……？　……か、可愛くないです……っ」",
        "AF02:外:生": "「……外、に……。……どう、でしたか？　……可愛かった……です、よね……？」",
        "AF03:中:生": "「タオル、取ってください。……制服、着直すの、手伝って……。」",
        "AF03:外:生": "「タオル、取ってください。……顔、拭いて……。……制服、着直すの、手伝って……。」",
    },
    "ai": {
        "AF01:中:生": "「はぁ……はぁ……。……重い……です。……まだ、抜かないで……ください。……ちょっと、だけ……」",
        "AF01:外:生": "「はぁ……はぁ……。……外、に……出しました、ね……。……離れないで……ください……。……まだ、余韻、あります……」",
        "AF02:中:生": "「……どう、でしたか……？　……私、変、じゃなかった、ですか……？」",
        "AF02:外:生": "「……外、にしたの、……残念、でした。……次は、中、も……いい、ですか……？」",
        "AF03:中:生": "「タオル、ありますか……？　……ブラウス、着直すの、手伝って……ください」",
        "AF03:外:生": "「タオル、……お腹、拭いて……ください。……ブラウス、着直すの、手伝って……」",
    },
}

DEFAULT_FIN_PROMPT: dict[str, str] = {
    "riko": "（息を荒げながら、目線だけ上げる）\n\n「……出す、前に言って。……どこ、がいい？」",
    "popura": "（奉仕を続けながら、小さくうなずく）\n\n「……出す、時、言って、ください。……口と、顔と、胸、どれ、が、いい、ですか？」",
    "ai": "（息を整えながら、目線だけ上げる）\n\n「……出す、とき、……どこ、が、いい、ですか……？」",
}


def _quotes_from_text(text: str) -> list[str]:
    return re.findall(r"「[^」]*」", text)


def _reaction_only(text: str, char_key: str, *, pullout: bool) -> str:
    """許可・指示を除き、受け止め側のリアクションのみ残す。"""
    text = text.strip()
    default = DEFAULT_MN07_OUTSIDE[char_key] if pullout else DEFAULT_MN07_INSIDE[char_key]
    if not text:
        return default

    if PERMISSION_RE.search(text) and not RESULT_AFTER_RE.search(text):
        return default

    if PERMISSION_RE.search(text) and RESULT_AFTER_RE.search(text):
        quotes = _quotes_from_text(text)
        if quotes:
            react_quotes = [q for q in quotes if RESULT_AFTER_RE.search(q) and not (
                PERMISSION_RE.search(q) and not RESULT_AFTER_RE.search(q)
            )]
            if react_quotes:
                return "\n\n".join(react_quotes)
        chunks = re.split(r"(?<=[。!！?？])", text)
        react = [c for c in chunks if c.strip() and RESULT_AFTER_RE.search(c)]
        if react:
            return "".join(react).strip()

    if PERMISSION_RE.search(text):
        return default
    return text


def _split_mn07_body(main: str, char_key: str) -> tuple[str, str]:
    """MN07 本文を「選択前 prompt」と「中出しリアクション」に分割。"""
    main = main.strip()
    if not main:
        return "", DEFAULT_MN07_INSIDE[char_key]

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", main) if p.strip()]
    if len(paragraphs) >= 2:
        last = paragraphs[-1]
        rest = "\n\n".join(paragraphs[:-1])
        if RESULT_AFTER_RE.search(last):
            return rest, _reaction_only(last, char_key, pullout=False)
        return main, DEFAULT_MN07_INSIDE[char_key]

    quotes = _quotes_from_text(main)
    if len(quotes) >= 2 and RESULT_AFTER_RE.search(quotes[-1]):
        prompt = "\n\n".join(quotes[:-1])
        return prompt, _reaction_only(quotes[-1], char_key, pullout=False)

    if PERMISSION_RE.search(main) and RESULT_AFTER_RE.search(main):
        quotes = _quotes_from_text(main)
        if len(quotes) == 1:
            inner = quotes[0].strip("「」")
            parts = [p for p in re.split(r"(?<=[。!！?？])", inner) if p.strip()]
            perm = [p for p in parts if PERMISSION_RE.search(p) and not RESULT_AFTER_RE.search(p)]
            react = [p for p in parts if RESULT_AFTER_RE.search(p)]
            prompt = f"「{''.join(perm)}」" if perm else main
            reaction = f"「{''.join(react)}」" if react else DEFAULT_MN07_INSIDE[char_key]
            return prompt, _reaction_only(reaction, char_key, pullout=False)

    if RESULT_AFTER_RE.search(main):
        return DEFAULT_FIN_PROMPT.get(char_key, ""), _reaction_only(main, char_key, pullout=False)

    # 許可のみ → prompt。リアクションは default
    return main, DEFAULT_MN07_INSIDE[char_key]


def _split_fp05_for_fin(text: str) -> tuple[str, str | None]:
    """FP05 を奉仕継続と口内フィニッシュ結果に分割。"""
    text = text.strip()
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if len(paragraphs) >= 2:
        last = paragraphs[-1]
        if RESULT_AFTER_RE.search(last) or ("出" in last and "口" in last):
            return "\n\n".join(paragraphs[:-1]), last
    quotes = _quotes_from_text(text)
    if len(quotes) >= 2 and (RESULT_AFTER_RE.search(quotes[-1]) or "ごくん" in quotes[-1]):
        return "\n\n".join(quotes[:-1]), quotes[-1]
    return text, None


def _process_one_mn07(text: str, char_key: str, pullout: str | None) -> tuple[str, str, str]:
    main, pullout_line = _split_mn07_variants(text)
    prompt, inside = _split_mn07_body(main, char_key)
    raw_out = pullout_line or pullout or ""
    outside = _reaction_only(raw_out, char_key, pullout=True) if raw_out else DEFAULT_MN07_OUTSIDE[char_key]
    inside = _reaction_only(inside, char_key, pullout=False)
    return prompt, inside, outside


def split_branch_dialogues(d: dict[str, str | list[str]], char_key: str) -> dict[str, str | list[str]]:
    """MN07 / FIN / FP05 を選択前後に分割。"""
    out = deepcopy(d)
    pullout_global = out.pop("MN07:外", None)
    raw_mn07 = out.pop("MN07", None)

    if raw_mn07 is not None:
        if isinstance(raw_mn07, list):
            prompts, insides, outsides = [], [], []
            for i, item in enumerate(raw_mn07):
                po = pullout_global if i == len(raw_mn07) - 1 and isinstance(pullout_global, str) else None
                p, inn, o = _process_one_mn07(item, char_key, po)
                prompts.append(p)
                insides.append(inn)
                outsides.append(o)
            out["MN07:prompt"] = prompts
            out["MN07:中"] = insides
            out["MN07:外"] = outsides
        else:
            p, inn, o = _process_one_mn07(str(raw_mn07), char_key, pullout_global if isinstance(pullout_global, str) else None)
            out["MN07:prompt"] = p
            out["MN07:中"] = inn
            out["MN07:外"] = o

    # レガシーキー → 生フラグ付きキーへ展開（MD 未分割時）
    for base in ("MN07:prompt", "MN07:中", "MN07:外"):
        if base in out and f"{base}:生" not in out:
            out[f"{base}:生"] = out[base]

    for k, v in DEFAULT_MN07_ACT.items():
        out.setdefault(k, v)

    for k, v in DEFAULT_MN00_ACT.items():
        out.setdefault(k, v)
    for k, v in DEFAULT_MN00.get(char_key, DEFAULT_MN00["riko"]).items():
        out.setdefault(k, v)

    fp05_raw = out.get("FP05")
    if fp05_raw:
        if isinstance(fp05_raw, list):
            fp05_raw = fp05_raw[-1]
        lead, fin_mouth = _split_fp05_for_fin(str(fp05_raw))
        if fin_mouth:
            out["FP05"] = lead
            out.setdefault("FIN:口", fin_mouth)

    out.setdefault("FIN:prompt", DEFAULT_FIN_PROMPT[char_key])

    fp08_raw = out.get("FP08")
    if fp08_raw and isinstance(fp08_raw, str):
        parts = [p.strip() for p in re.split(r"\n\s*\n", fp08_raw) if p.strip()]
        if len(parts) >= 3:
            out["FP08"] = "\n\n".join(parts[:-2])
            out.setdefault("FIN:prompt", parts[-2] if "どっち" in parts[-2] or "どれ" in parts[-2] else out["FIN:prompt"])
            if RESULT_AFTER_RE.search(parts[-1]):
                out.setdefault("FIN:胸", parts[-1])

    return out


def split_post_mn07_dialogues(d: dict[str, str | list[str]], char_key: str) -> dict[str, str | list[str]]:
    """AF01 等を 中/外 × 生/ゴム へ展開（未記述はデフォルト補完）。"""
    out = deepcopy(d)
    defaults = DEFAULT_AF_AFTER.get(char_key, DEFAULT_AF_AFTER["riko"])

    for nid in POST_MN07_VARIANT_NODES:
        # レガシー AF01:中 / AF01:ゴム → フラグ付きへ
        if f"{nid}:中" in out and f"{nid}:中:生" not in out:
            out[f"{nid}:中:生"] = out[f"{nid}:中"]
        if f"{nid}:外" in out and f"{nid}:外:生" not in out:
            out[f"{nid}:外:生"] = out[f"{nid}:外"]
        raw = out.get(nid)
        if raw and f"{nid}:中:生" not in out and f"{nid}:外:生" not in out:
            text = _stringify_dialogue(raw, 0) or ""
            if INSIDE_ROUTE_RE.search(text):
                out[f"{nid}:中:生"] = deepcopy(raw)
            elif OUTSIDE_ROUTE_RE.search(text):
                out[f"{nid}:外:生"] = deepcopy(raw)
            else:
                out[f"{nid}:中:生"] = deepcopy(raw)
                out[f"{nid}:外:生"] = deepcopy(raw)

        for key, val in defaults.items():
            if key.startswith(f"{nid}:"):
                out.setdefault(key, val)

    return out


def _texts_from_value(value: str | list[str] | None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v) for v in value]
    return [str(value)]


def validate_branch_consistency(
    char_name: str, hpt: str, d: dict[str, str | list[str]]
) -> list[str]:
    """選択前セリフと結果セリフの矛盾を検出。"""
    warnings: list[str] = []
    prompt = d.get("MN07:prompt")
    if prompt:
        texts = prompt if isinstance(prompt, list) else [prompt]
        for i, t in enumerate(texts):
            if PROMPT_FORBIDDEN_RE.search(t):
                warnings.append(
                    f"[{char_name}/{hpt}] MN07:prompt#{i+1} にフィニッシュ「後」語が含まれています（選択前に出すのはNG）"
                )

    fin_prompt = d.get("FIN:prompt")
    if fin_prompt and RESULT_AFTER_RE.search(str(fin_prompt)):
        warnings.append(f"[{char_name}/{hpt}] FIN:prompt にフィニッシュ「後」語が含まれています")

    for key, pullout in (("MN07:中", False), ("MN07:外", True)):
        text = str(d.get(key, ""))
        if not text:
            continue
        if PERMISSION_RE.search(text) and not RESULT_AFTER_RE.search(text):
            warnings.append(
                f"[{char_name}/{hpt}] {key} が許可セリフのままです（射精後のリアクションに差し替えてください）"
            )

    if hpt == "HPT-17":
        fp05 = d.get("FP05")
        if fp05 and RESULT_AFTER_RE.search(str(fp05)):
            warnings.append(
                f"[{char_name}/{hpt}] FP05 にフィニッシュ「後」語が残っています（FIN 分岐前の奉仕中のみに分割してください）"
            )

    for key in ("FIN:口", "FIN:顔", "FIN:胸"):
        text = str(d.get(key, ""))
        if key in d and not RESULT_AFTER_RE.search(text) and not re.search(r"(出|かけ|ごくん|溢)", text):
            warnings.append(f"[{char_name}/{hpt}] {key} がフィニッシュ結果っぽくありません")

    act_in = str(d.get("MN07:act:中", ""))
    act_out = str(d.get("MN07:act:外", ""))
    if act_out and INSIDE_ROUTE_RE.search(act_out):
        warnings.append(f"[{char_name}/{hpt}] MN07:act:外 が中出し行為を示しています")
    if act_in and re.search(r"外へ抜|外出", act_in):
        warnings.append(f"[{char_name}/{hpt}] MN07:act:中 が外出し行為を示しています")

    for i, text in enumerate(_texts_from_value(d.get("MN07:外"))):
        if INSIDE_ROUTE_RE.search(text):
            warnings.append(
                f"[{char_name}/{hpt}] MN07:外#{i+1} に中出し前提の語があります（外出し専用文にしてください）"
            )
    for i, text in enumerate(_texts_from_value(d.get("MN07:中"))):
        if re.search(r"^(「)?外に、出", text) or (OUTSIDE_ROUTE_RE.search(text) and not INSIDE_ROUTE_RE.search(text)):
            warnings.append(
                f"[{char_name}/{hpt}] MN07:中#{i+1} が外出し専用っぽい内容です"
            )

    for nid in POST_MN07_VARIANT_NODES:
        generic = _stringify_dialogue(d.get(nid))
        if generic and INSIDE_ROUTE_RE.search(generic) and f"{nid}:外" not in d:
            warnings.append(
                f"[{char_name}/{hpt}] {nid} が中出し前提のみです（{nid}:外 または ※外出し後 を追加）"
            )
        for i, text in enumerate(_texts_from_value(d.get(f"{nid}:外"))):
            if INSIDE_ROUTE_RE.search(text):
                warnings.append(
                    f"[{char_name}/{hpt}] {nid}:外#{i+1} に中出し前提の語があります（例: 抜かないで）"
                )
        for i, text in enumerate(_texts_from_value(d.get(f"{nid}:中"))):
            if re.search(r"外、出した|外に.*?出し", text) and "中" not in text:
                pass  # rare dual - skip
            if OUTSIDE_ROUTE_RE.search(text) and INSIDE_ROUTE_RE.search(text):
                warnings.append(
                    f"[{char_name}/{hpt}] {nid}:中#{i+1} に外出しと中出しが混在しています"
                )

    return warnings


def _stringify_dialogue(value: str | list[str], index: int = 0) -> str | None:
    if isinstance(value, list):
        if not value:
            return None
        return value[min(index, len(value) - 1)]
    return value


def augment_branch_dialogues(d: dict[str, str | list[str]], char_key: str) -> dict[str, str | list[str]]:
    """MN07:外 / FIN:* など分岐用キーを補完（分割前の raw 用）。"""
    out = deepcopy(d)

    fp05 = _stringify_dialogue(out.get("FP05", ""))
    # 選択「後」リアクションのみ（許可禁止）
    fin_oral = {
        "FIN:口": "「んっ……！ ……ごくん。……しょっぱ……。……上手、だった……？」",
        "FIN:顔": "「んあっ……！ ……顔……あったかい……っ……汚した……っ」",
        "FIN:胸": "「んっ……！ ……胸……あったかい……っ……受け止めた……っ」",
        "FIN:我慢": "「……ん、んっ……。……まだ……続ける……っ」",
    }
    if char_key == "popura":
        fin_oral = {
            "FIN:口": "「んっ……！ ……ごくん。……ごちそう、さま……です……っ」",
            "FIN:顔": "「んあっ……！ ……顔……あったかい……っ……汚され……ました……っ」",
            "FIN:胸": "「んっ……！ ……谷間……いっぱい……っ……あったかい……っ」",
            "FIN:我慢": "「……ん、んっ……。……まだ……奉仕……続けます……っ」",
        }

    for k, v in DEFAULT_FIN_ACT.items():
        out.setdefault(k, v)

    if fp05 or out.get("FP08"):
        for k, v in fin_oral.items():
            # 許可セリフが残っていたら上書き
            existing = out.get(k)
            if existing is None:
                out[k] = v
            elif isinstance(existing, str) and (
                PERMISSION_RE.search(existing) or "出していい" in existing or "かけて、ください" in existing
            ):
                out[k] = v  # 許可セリフは強制置換
            else:
                out.setdefault(k, v)

    if "FIN" not in out:
        out["FIN"] = "（フィニッシュのタイミング）\n\n「……出す……？　……どこ……っ」"

    return out


def merge_dialogues(base: dict, overlay: dict) -> dict:
    result = deepcopy(base)
    for k, v in overlay.items():
        if k not in result or not result[k]:
            result[k] = v
        elif k.startswith("MN07") or k.startswith("FIN"):
            result[k] = v
        elif isinstance(v, list) and isinstance(result.get(k), list):
            result[k] = v
        elif isinstance(v, list):
            result[k] = v
        else:
            result[k] = v
    return result


def load_hpt_dialogue(char_dir: Path, hpt_id: str) -> dict[str, str | list[str]]:
    num = hpt_id.replace("HPT-", "")
    for name in (f"HPT-{num}_セリフ.md", f"HPT-{num.zfill(2)}_セリフ.md"):
        p = char_dir / name
        if p.is_file():
            return parse_dialogue_file(p, char_dir)
    return {}


def load_character(char_key: str, folder: str, display_name: str) -> dict:
    char_dir = ROOT / folder
    base = load_hpt_dialogue(char_dir, "HPT-01")
    dialogues: dict[str, dict] = {}
    for hpt in FLOWS:
        overlay = load_hpt_dialogue(char_dir, hpt)
        merged = merge_dialogues(base, overlay)
        merged = augment_branch_dialogues(merged, char_key)
        merged = split_branch_dialogues(merged, char_key)
        merged = split_post_mn07_dialogues(merged, char_key)
        dialogues[hpt] = merged
    return {"name": display_name, "dialogues": dialogues}


def main() -> None:
    all_warnings: list[str] = []
    chars = {
        "riko": load_character("riko", "佐藤莉子", "佐藤莉子"),
        "popura": load_character("popura", "種島ぽぷら", "種島ぽぷら"),
        "ai": load_character("ai", "水原愛衣", "水原愛衣"),
    }
    for ck, cdata in chars.items():
        for hpt, dlg in cdata["dialogues"].items():
            all_warnings.extend(validate_branch_consistency(cdata["name"], hpt, dlg))

    data = {
        "nodeLabels": NODE_LABELS,
        "branchPoints": BRANCH_POINTS,
        "postMn07VariantNodes": POST_MN07_VARIANT_NODES,
        "serviceRouteBranch": SERVICE_ROUTE_BRANCH,
        "flows": FLOWS,
        "characters": chars,
    }
    js_path = ROOT / "vn-data.js"
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    js_path.write_text(f"window.VN_DATA = {payload};\n", encoding="utf-8")
    print(f"Wrote {js_path} ({js_path.stat().st_size} bytes)")
    if all_warnings:
        print(f"--- 分岐矛盾チェック: {len(all_warnings)} 件 ---")
        for w in all_warnings[:40]:
            print(w)
        if len(all_warnings) > 40:
            print(f"... 他 {len(all_warnings) - 40} 件")
    else:
        print("分岐矛盾チェック: OK")


if __name__ == "__main__":
    main()
