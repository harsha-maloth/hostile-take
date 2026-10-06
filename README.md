# Hostile Take
*Buy low. Take over. Win big.*

Corporate-raider strategy game. Frontend on GitHub Pages, backend on Supabase.

## Setup
1. Create a Supabase project. In the SQL editor, run `supabase/migrations/001_init.sql`.
2. In Supabase > Authentication, enable Email (and Anonymous sign-ins for guest mode).
3. Create a GitHub repo named `hostile-take` and push this folder to `main`.
4. Repo Settings > Pages > Source: **GitHub Actions**.
5. Repo Settings > Secrets > Actions: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Push to `main`. Your game goes live at `https://<username>.github.io/hostile-take/`.

## Local dev
```
cp .env.example .env.local   # fill in your keys
npm install
npm run dev
```
If you rename the repo, update `base` in `vite.config.ts` and the favicon path in `index.html`.

## Engine
`src/engine/` is the pure, seeded game engine (no UI imports).
```
npm test   # engine tests
npm run sim   # balance simulation over 1000 seeded games
```

## Next
Step 4: borrow/repay screen, tender offers, Deals tab, rival AI. (Step 3 core UI is done.)

## For AI assistants
Project memory lives in `CLAUDE.md` and `docs/ai/`. Read those first, and update them at the end of every session.
