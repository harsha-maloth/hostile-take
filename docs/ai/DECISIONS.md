# Decisions (newest at the bottom)

| # | Decision | Why |
|---|----------|-----|
| 1 | Build an original web game inspired by corporate-raider sims, not a copy | Reference game is commercial; mechanics are free to borrow, assets/text/code are not |
| 2 | Dropped the life-sim idea | Uploaded APK had no game content (ad/data-collection wrapper) |
| 3 | GitHub Pages frontend + Supabase backend | Owner's choice; free, simple, no server to run |
| 4 | Engine runs in the browser, deterministic + seeded | Instant gameplay; lets the server re-run it to verify scores |
| 5 | Scores written only by an Edge Function (service role) | Prevents fake leaderboard entries |
| 6 | Name "Hostile Take", dark navy + gold terminal look | Owner approved branding |
| 7 | Hash routing + Vite `base: /hostile-take/` | GitHub Pages has no SPA fallback |
| 8 | AI memory kept in `docs/ai/` + `CLAUDE.md` | Owner does not want to repeat context every session |
| 9 | Git workflow documented for Termux using `gh` CLI (`docs/ai/TERMUX_GIT.md`) | Owner pushes from an Android phone; web login avoids typing tokens |
| 10 | Per-turn RNG = hash(seed, turn); no shared RNG state | Any turn replays alone; verifier needs only seed + action log |
| 11 | Illegal actions throw `GameError`; `nextTurn(state, actions)` applies actions then advances the quarter | Deterministic replay: a bad log fails verification |
| 12 | Price = reversion toward fair value (EPS x P/E x economy) + noise + news | Earnings matter for takeovers later; economy cycle visibly moves prices |
| 13 | Rules: 0.25% commission, debt cap 2x net worth, short cap 1x net worth, 0.5%/qtr short fee, loan rate by economy phase; no long+short in one company | Keeps leverage risky but not infinite; sim shows 2x leverage goes bust ~18% of runs |
| 14 | Tests live in `tests/` (run with tsx), outside `tsc` include | Avoids needing @types/node in the app build |
| 15 | Workflow uses `npm install` + `npm test` until a lockfile is committed | No lockfile existed, so `npm ci` would fail |
| 16 | UI is vanilla TypeScript with innerHTML + one click handler (no framework) | Tiny bundle, phone-first, nothing extra to install or learn |
| 17 | Local save = seed + difficulty + action log + queued trades; resume replays it with `replay()` | Same data the leaderboard verifier needs; saves stay tiny and cannot drift from the engine |
| 18 | Trades are queued and validated against a draft state, then applied at End quarter | Player sees errors instantly and can undo; matches `nextTurn(state, actions)` |
