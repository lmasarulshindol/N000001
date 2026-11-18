"""竿の根が股間から離れた場面を、乱数シードで4枚ずつ出す。"""
from __future__ import annotations

import json
import random

import gen_02_viewer as g

NAMES = (
    "04_fellatio_cum",
)
COUNT = 4


def main() -> None:
    by_name = {job["name"]: job for job in g.JOBS}
    rng = random.SystemRandom()
    chosen = []
    for name in NAMES:
        base = by_name[name]
        for _ in range(COUNT):
            job = dict(base)
            job["seed"] = rng.randrange(1, 2**31 - 1)
            chosen.append(job)
    g.JOBS = chosen
    (g.OUT / "_oral_seed_batch.json").write_text(
        json.dumps([{"name": j["name"], "seed": j["seed"]} for j in chosen], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    g.main()
    print("batch complete", flush=True)


if __name__ == "__main__":
    main()
