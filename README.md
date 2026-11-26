# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/ty-kepo/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/ty-kepo/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A Node 22 program (`main.ts`, standard library only, no network) that builds a token launch radar: it reads a sealed DefiLlama snapshot of 758 protocols, ranks the 40 pre-token protocols on the watchlist plus 160 early ones below the floor by an implied value derived from category comparables, and writes a static web dashboard (board, per-protocol detail views, filters) with a farm plan for each protocol.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../kit/input/snapshot.json
```

It writes `board.json` (200 rows), the dashboard data, `dashboard/`, `screenshots/` and `dossier.json` to `out/` (in the grader's container it writes to `/output` and reads `/input/snapshot.json`). Running it twice produces byte-identical output.

## Model

Each protocol's implied value is its TVL times a category multiple (the median market-cap/TVL ratio of that category's live-token protocols, shrunk toward the global median), adjusted for its 7-day TVL change and its age. The dashboard shows the full comparables table and the formula.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
