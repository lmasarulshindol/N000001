"""視聴者企画9シーンを Danbooru タグ版で乱数4枚ずつ。"""
from __future__ import annotations

import json
import random

import gen_02_viewer as g

COUNT = 4


def main() -> None:
    rng = random.SystemRandom()
    chosen = []
    for base in g.JOBS:
        for _ in range(COUNT):
            job = dict(base)
            job["seed"] = rng.randrange(1, 2**31 - 1)
            chosen.append(job)
    g.JOBS = chosen
    (g.OUT / "_viewer_seed_batch.json").write_text(
        json.dumps([{"name": j["name"], "seed": j["seed"]} for j in chosen], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    g.main()
    print("batch complete", flush=True)


if __name__ == "__main__":
    main()