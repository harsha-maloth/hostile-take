# Roadmap

## v1 build order
- [x] 1. Repo setup: Vite + TS shell, branding, GitHub Pages workflow, Supabase SQL + RLS
- [x] 2. Engine: seeded RNG, 20 companies, price model, economy cycle, news, tests (13 passing), balance sim
      Also done early from step 4: buy/sell/short/cover/borrow/repay rules in the engine (no UI yet)
- [x] 3. Core UI: tabs (Portfolio, Market, News), sparkline charts, "End quarter", local autosave/resume
      Also done early from step 4: basic buy/sell/short/cover queue on the company screen. Deals tab waits for tender offers.
- [ ] 4. Trading UI + deals: borrow/repay screen, tender offers, Deals tab, rival AI (buy/sell/short/cover UI already exists)
- [ ] 5. Supabase: login (email + guest), autosave, resume, guest-to-account upgrade
- [ ] 6. Leaderboard: Edge Function verification, scores table, top-100 screen
- [ ] 7. Polish: tutorial, difficulty levels, error handling, phone testing

## Later
v2 commodities, bonds, dividends. v3 LBOs, dirty tricks, ETFs, options, crypto.
v4 difficulty tuning, richer leaderboards.

## Known risks
- Balance: simulate many runs before adding features.
- Supabase free tier pauses inactive projects (keep local save).
- Step 1 was never test-built (engine typechecks and passes tests under tsx; full `npm run build` with vite/supabase still unrun)
- Original note: step 1 was never test-built (no network in the authoring sandbox): first
  `npm install && npm run build` may need small fixes.
