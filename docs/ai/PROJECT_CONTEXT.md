# Project context: Hostile Take

*Buy low. Take over. Win big.*

## What it is
A web strategy game where you play a corporate raider: trade stocks, borrow, and
take over fictional companies against computer-controlled rivals. Turn-based,
one turn = one quarter. Phone-first UI.

## Origin and originality rule (important)
- Inspired by the general mechanics of *Wall Street Raider* (a commercial
  shareware game by Ronin Software). Owner uploaded its demo installer for study.
- **Do NOT copy** its code, text, news headlines, names, numbers or branding.
  Only general mechanics (stocks, loans, takeovers, random news) are borrowed.
  All companies, headlines and rules here are original and fictional.
- Owner also uploaded an Android "Bit Life Simulator" APK. It contained no game,
  only an ad wrapper that asks for phone/email (looks like a scam app). Do not
  reuse anything from it. A life-sim idea was discussed and dropped in favour of
  this game.

## Stack
- Frontend: Vite + TypeScript, static site on **GitHub Pages** (repo `hostile-take`,
  base path `/hostile-take/`, hash routing, no server-side routing).
- Backend: **Supabase** (Auth, Postgres, one Edge Function for score validation).
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`.
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` as repo secrets. The anon
  key is public-safe ONLY because Row Level Security is on for every table.

## Live locations
- GitHub repo: https://github.com/harsha-maloth/hostile-take (public). Owner username: `harsha-maloth`.
- Game URL once deployed: https://harsha-maloth.github.io/hostile-take/
- Status (Session 1): repo created but EMPTY until the first push is done.

## Architecture rules
- Game engine is a pure, deterministic function:
  `nextTurn(state, actions, rng) -> newState`, using a seeded RNG, no UI imports.
  Lives in `src/engine/` (shared with the Edge Function for verification).
- Autosave to Supabase each turn; also save locally (free tier projects can pause).
- Leaderboard anti-cheat: client sends seed + action log; the Edge Function
  re-runs the engine and writes the verified score. Clients can never write `scores`.

## Branding
- Name: **Hostile Take**. Backups: Boardroom Raid, Leveraged, Paper Empire,
  Controlling Interest. (Owner should still check name/domain availability.)
- Tone: dry, witty, slightly ruthless business satire. Humor lives in the news feed.
  Fictional companies with industry puns (e.g. Megahertz Telecom, Ironclad Steel).
- Colors: bg `#0B1220`, card `#141C2E`, line `#243049`, gain `#22C55E`,
  loss `#EF4444`, gold accent `#F5B83D`, text `#E6EAF2`, muted `#8B97AE`.
- Fonts: Space Grotesk (headings/UI), IBM Plex Mono (numbers, tabular).
- UI copy: short verbs ("End quarter", "Make an offer"). Errors are plain and
  specific, never vague or apologetic. Sentence case.

## Scope of v1
~20 fictional companies, 6 industries, quarterly turns, economy cycle, news events,
actions: buy, sell, short, cover, borrow, repay, tender offer; 2-3 rival AIs;
net-worth ranking and bankruptcy; login (email + guest); autosave; leaderboard.

## Out of scope for v1
Commodities, bonds, options, crypto, LBOs, dirty tricks, multiplayer.

## Owner preferences
- Uses the Claude mobile app: wants short answers, answer first, plan before code.
- Wants decisions made for them where sensible, and progress logged here.
