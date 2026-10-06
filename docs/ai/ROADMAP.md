# Roadmap

## v1 build order
- [x] 1. Repo setup: Vite + TS shell, branding, GitHub Pages workflow, Supabase SQL + RLS
- [ ] 2. Engine: seeded RNG, companies, market/price model, economy cycle, news events, tests
- [ ] 3. Core UI: tabs (Portfolio, Market, News, Deals), chart, "End quarter"
- [ ] 4. Trading + deals: buy/sell/short/borrow/repay, tender offers, rival AI
- [ ] 5. Supabase: login (email + guest), autosave, resume, guest-to-account upgrade
- [ ] 6. Leaderboard: Edge Function verification, scores table, top-100 screen
- [ ] 7. Polish: tutorial, difficulty levels, error handling, phone testing

## Later
v2 commodities, bonds, dividends. v3 LBOs, dirty tricks, ETFs, options, crypto.
v4 difficulty tuning, richer leaderboards.

## Known risks
- Balance: simulate many runs before adding features.
- Supabase free tier pauses inactive projects (keep local save).
- Step 1 was never test-built (no network in the authoring sandbox): first
  `npm install && npm run build` may need small fixes.
