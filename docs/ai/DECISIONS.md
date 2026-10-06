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
