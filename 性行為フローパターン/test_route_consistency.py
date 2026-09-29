# -*- coding: utf-8 -*-
"""全ルート網羅セルフテスト: 選択肢後の許可セリフ・生固定・中/外の矛盾を検出する。"""
from __future__ import annotations

import itertools
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import build_vn_data as b  # noqa: E402

# 選択「後」に出てはいけない許可・指示
POST_CHOICE_PERMISSION_RE = re.compile(
    r"(出していい|出して[。、]|出して\s|ちょうだい|ください|"
    r"つけて|お願い|いいよ|ほしい|どうする|どれ|どっち|"
    r"中に、出して|外に、出して|ゴム……つけて|生……で)"
)

# 生中出しリアクションに無いとおかしい／ゴム中に「中、いっぱい」「抜かない」はNG寄り
RAW_CREAMPIE_BODY_RE = re.compile(r"(あったかい|いっぱい|中)")
CONDOM_CREAMPIE_FORBIDDEN_RE = re.compile(r"(抜かない|中、いっぱい|子宮|生で|コンドーム.*(なし|無))")
RAW_CREAMPIE_FORBIDDEN_RE = re.compile(r"(ゴム……熱い|ゴムの中|ゴム……つけ)")
PULL_OUT_FORBIDDEN_RE = re.compile(r"(抜かない|中、いっぱい|膣内|中に注)")
CONDOM_ACT_MUST_RE = re.compile(r"ゴム")
RAW_ACT_MUST_NOT_RE = re.compile(r"ゴム|コンドーム")


def _as_list(v):
    if v is None:
        return []
    if isinstance(v, list):
        return v
    return [v]


def pick_key(dlg: dict, base: str, protection: str | None) -> str:
    if protection == "condom":
        tagged = f"{base}:ゴム"
        if tagged in dlg:
            return tagged
    elif protection == "raw":
        tagged = f"{base}:生"
        if tagged in dlg:
            return tagged
    return base


def get_text(dlg: dict, key: str, visit: int = 0) -> str:
    raw = dlg.get(key)
    if raw is None:
        return ""
    if isinstance(raw, list):
        if not raw:
            return ""
        return str(raw[min(visit, len(raw) - 1)])
    return str(raw)


def build_queue(flow: dict, service_next: str | None = None) -> list[str]:
    q = list(flow.get("linear") or [])
    br = flow.get("branch")
    if br and service_next:
        at = br["at"]
        if at in q:
            idx = q.index(at)
            return q[: idx + 1] + [service_next] + list(br.get("tail") or [])
    return q


def inject_done(linear: list[str]) -> list[str]:
    """build_vn_data 側で inject 済み想定。未注入ならここで補完。"""
    if "MN01" in linear and "MN00" not in linear:
        return b.inject_mn00(linear)
    return linear


def enumerate_routes(chars: dict, flows: dict) -> list[dict]:
    routes = []
    for char_id, cdata in chars.items():
        for hpt, flow in flows.items():
            dlg = cdata["dialogues"].get(hpt) or {}
            has_mn = "MN01" in (flow.get("linear") or []) or "MN00" in (flow.get("linear") or [])
            branch = flow.get("branch")
            service_opts = [None]
            if branch:
                service_opts = [c["next"] for c in branch["choices"]]

            for service in service_opts:
                q = inject_done(build_queue(flow, service))
                protections = ["raw"] if ("MN00" in q or has_mn) and hpt != "HPT-17" else [None]
                finishes = ["creampie", "pullout"] if "MN07" in q else [None]
                fin_oral = [None]
                if "FIN" in q and service == "FP05":
                    fin_oral = ["口", "顔", "胸"]
                elif "FIN" in q and service == "FP08":
                    fin_oral = ["胸", "顔"]

                for prot, fin, oral in itertools.product(protections, finishes, fin_oral):
                    if hpt == "HPT-17":
                        prot, fin = None, None
                    routes.append(
                        {
                            "char": char_id,
                            "char_name": cdata["name"],
                            "hpt": hpt,
                            "queue": q,
                            "dlg": dlg,
                            "protection": prot,
                            "finish": fin,
                            "service": service,
                            "oral": oral,
                        }
                    )
    return routes


def check_route(r: dict) -> list[str]:
    errs: list[str] = []
    dlg = r["dlg"]
    label = f"{r['char_name']}/{r['hpt']}/prot={r['protection']}/fin={r['finish']}/svc={r['service']}"
    q = r["queue"]
    prot = r["protection"]
    fin = r["finish"]

    # --- MN00（生固定・選択肢なし） ---
    if "MN00" in q and prot == "raw":
        act = get_text(dlg, "MN00:act:生")
        react = get_text(dlg, "MN00:生") or get_text(dlg, "MN00")
        if not act:
            errs.append(f"[{label}] 欠落: MN00:act:生")
        if react and POST_CHOICE_PERMISSION_RE.search(react) and "生で" not in react:
            # prompt 由来の許可語は無視。純反応のみ検査
            if "MN00:生" in dlg and POST_CHOICE_PERMISSION_RE.search(get_text(dlg, "MN00:生")):
                errs.append(f"[{label}] MN00:生 が許可セリフ: {get_text(dlg, 'MN00:生')[:60]}")
        mn01 = get_text(dlg, "MN01:生") or get_text(dlg, "MN01")
        if mn01 and "ゴム……入" in mn01 and "生" not in mn01:
            errs.append(f"[{label}] 生固定なのに MN01 がゴム挿入文: {mn01[:50]}")

    # --- MN07 ---
    if "MN07" in q and fin and prot:
        tag = "ゴム" if prot == "condom" else "生"
        finish_tag = "中" if fin == "creampie" else "外"
        prompt_key = pick_key(dlg, "MN07:prompt", prot)
        act_key = pick_key(dlg, f"MN07:act:{finish_tag}", prot)
        react_key = pick_key(dlg, f"MN07:{finish_tag}", prot)

        prompt = get_text(dlg, prompt_key) or get_text(dlg, "MN07:prompt")
        act = get_text(dlg, act_key)
        react = get_text(dlg, react_key)

        if not act:
            errs.append(f"[{label}] 欠落: {act_key}")
        if not react:
            errs.append(f"[{label}] 欠落: {react_key}")

        # 選択後に許可のみ
        if react and POST_CHOICE_PERMISSION_RE.search(react) and not b.RESULT_AFTER_RE.search(react):
            errs.append(f"[{label}] MN07選択後が許可のみ: {react_key} = {react[:60]}")
        if react and re.search(r"出していい|ちょうだい|ください", react) and not b.RESULT_AFTER_RE.search(react):
            errs.append(f"[{label}] MN07選択後に許可語: {react_key}")

        if fin == "creampie":
            if prot == "raw":
                if act and RAW_ACT_MUST_NOT_RE.search(act):
                    errs.append(f"[{label}] 生中出し行為にゴム: {act}")
                if react and CONDOM_CREAMPIE_FORBIDDEN_RE.search(react) and "抜かない" in react:
                    errs.append(f"[{label}] 生中出し反応にゴム専用語: {react[:50]}")
            if prot == "condom":
                if act and not CONDOM_ACT_MUST_RE.search(act):
                    errs.append(f"[{label}] ゴム中出し行為に「ゴム」なし: {act}")
                if react and CONDOM_CREAMPIE_FORBIDDEN_RE.search(react):
                    errs.append(f"[{label}] ゴム中出し反応に生中出し語(抜かない等): {react[:50]}")
                if react and RAW_CREAMPIE_FORBIDDEN_RE.search(react) is None and "ゴム" not in react:
                    # soft warn - should mention rubber sensation
                    if "あったかい" in react and "ゴム" not in react and "中、いっぱい" in react:
                        errs.append(f"[{label}] ゴム中出しなのに生中出し反応っぽい: {react[:50]}")

        if fin == "pullout":
            if react and PULL_OUT_FORBIDDEN_RE.search(react):
                errs.append(f"[{label}] 外出し反応に中出し前提: {react[:50]}")
            if act and "外" not in act and "抜" not in act:
                errs.append(f"[{label}] 外出し行為に外/抜がない: {act}")

        # AF ノード
        for nid in b.POST_MN07_VARIANT_NODES:
            if nid not in q:
                continue
            base = f"{nid}:{finish_tag}"
            key = pick_key(dlg, base, prot)
            # also try :中:生 style
            if key not in dlg:
                key = f"{nid}:{finish_tag}:{tag}"
            text = get_text(dlg, key)
            if not text:
                # fallback chain
                for cand in (f"{nid}:{finish_tag}:{tag}", f"{nid}:{finish_tag}", f"{nid}:ゴム", nid):
                    if cand in dlg:
                        text = get_text(dlg, cand)
                        key = cand
                        break
            if not text:
                continue
            if fin == "pullout" and "抜かない" in text:
                errs.append(f"[{label}] 外出し後 {key} に「抜かない」: {text[:50]}")
            if prot == "condom" and fin == "creampie" and "抜かない" in text:
                errs.append(f"[{label}] ゴム中出し後 {key} に「抜かない」: {text[:50]}")
            if fin == "creampie" and prot == "raw" and re.search(r"外、出した|外に……出し", text):
                errs.append(f"[{label}] 生中出し後 {key} が外出し文: {text[:50]}")

    # --- FIN oral ---
    if r["oral"] and "FIN" in q:
        key = f"FIN:{r['oral']}"
        text = get_text(dlg, key)
        if text and POST_CHOICE_PERMISSION_RE.search(text) and not b.RESULT_AFTER_RE.search(text):
            if r["oral"] != "我慢":
                errs.append(f"[{label}] FIN選択後が許可のみ: {key}")

    return errs


def check_static_keys(chars: dict) -> list[str]:
    """データ層の静的チェック（全キャラ・全HPT）。"""
    errs: list[str] = []
    for char_id, cdata in chars.items():
        for hpt, dlg in cdata["dialogues"].items():
            label = f"{cdata['name']}/{hpt}"
            # 選択後キーに許可
            for key in (
                "MN00:生",
                "MN07:中",
                "MN07:外",
                "MN07:中:生",
                "MN07:外:生",
            ):
                for i, t in enumerate(_as_list(dlg.get(key))):
                    if not t:
                        continue
                    if POST_CHOICE_PERMISSION_RE.search(t) and not b.RESULT_AFTER_RE.search(t):
                        errs.append(f"[{label}] 選択後キー {key}#{i+1} が許可セリフ: {t[:60]}")

            # 行為キーの整合
            for k, must, forbid in (
                ("MN07:act:中:生", None, re.compile(r"ゴム")),
                ("MN07:act:外:生", re.compile(r"外|抜"), re.compile(r"膣内で射精")),
                ("MN00:act:生", None, re.compile(r"コンドーム|ゴム")),
            ):
                t = get_text(dlg, k)
                if not t:
                    continue
                if must and not must.search(t):
                    errs.append(f"[{label}] {k} に必須語なし: {t}")
                if forbid and forbid.search(t):
                    errs.append(f"[{label}] {k} に禁止語: {t}")

            # AF 外:生/ゴム に抜かない
            for nid in b.POST_MN07_VARIANT_NODES:
                for suffix in ("外:生",):
                    key = f"{nid}:{suffix}"
                    for t in _as_list(dlg.get(key)):
                        if t and "抜かない" in t:
                            errs.append(f"[{label}] {key} に「抜かない」: {t[:50]}")

            errs.extend(b.validate_branch_consistency(cdata["name"], hpt, dlg))
    return errs


def main() -> int:
    print("=== VN データ生成 ===")
    b.main()
    chars = {
        "riko": b.load_character("riko", "佐藤莉子", "佐藤莉子"),
        "popura": b.load_character("popura", "種島ぽぷら", "種島ぽぷら"),
        "ai": b.load_character("ai", "水原愛衣", "水原愛衣"),
    }
    flows = b.FLOWS

    print("=== 静的キー検査 ===")
    static_errs = check_static_keys(chars)

    print("=== ルート列挙・網羅検査 ===")
    routes = enumerate_routes(chars, flows)
    print(f"ルート数: {len(routes)}")
    route_errs: list[str] = []
    for r in routes:
        route_errs.extend(check_route(r))

    # 重複除去（順序維持）
    seen = set()
    all_errs = []
    for e in static_errs + route_errs:
        if e not in seen:
            seen.add(e)
            all_errs.append(e)

    out_path = ROOT / "test_route_report.txt"
    out_path.write_text("\n".join(all_errs) if all_errs else "OK\n", encoding="utf-8")

    print(f"=== 結果: {len(all_errs)} 件 ===")
    for e in all_errs[:80]:
        print(e)
    if len(all_errs) > 80:
        print(f"... 他 {len(all_errs) - 80} 件")
    print(f"レポート: {out_path}")

    return 1 if all_errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
