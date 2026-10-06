import { applyActionInPlace, netWorth, round2 } from "./actions";
import {
  BASE_GROWTH, COMPANIES, DEFAULT_MAX_TURNS, DIFFICULTY, ECONOMY, INDUSTRIES,
  MIN_PRICE, REVERSION, SHORT_FEE, TRANSITIONS,
} from "./data";
import { drawNews } from "./news";
import { rngForTurn, type Rng } from "./rng";
import { GameError, type Action, type CompanyState, type Difficulty, type GameState, type Industry } from "./types";
import { shortValue } from "./actions";

const MIN_EPS_FRACTION = 0.1; // eps never falls below 10% of its starting value

export function newGame(seed: number, difficulty: Difficulty = 1, maxTurns = DEFAULT_MAX_TURNS): GameState {
  // Turn -1 is reserved for setup, so it never clashes with a played turn.
  const rng = rngForTurn(seed, -1);
  const companies: Record<string, CompanyState> = {};
  for (const c of COMPANIES) {
    const eps = round2(c.eps * Math.exp(0.1 * rng.normal()) * 100) / 100;
    const price = Math.max(MIN_PRICE, round2(eps * 4 * c.pe));
    companies[c.id] = { price, eps, history: [price] };
  }
  const s: GameState = {
    seed, difficulty, turn: 0, maxTurns, status: "active", economy: "expansion",
    cash: DIFFICULTY[difficulty].startCash, debt: 0, longs: {}, shorts: {},
    companies, news: [], netWorthHistory: [],
  };
  s.netWorthHistory.push(netWorth(s));
  return s;
}

function nextPhase(rng: Rng, from: GameState["economy"]): GameState["economy"] {
  return rng.weighted(TRANSITIONS[from], ([, p]) => p)[0];
}

/**
 * Pure and deterministic: same state + actions + rng always gives the same result.
 * Applies the player's actions, then advances the market by one quarter.
 * Throws GameError if any action is illegal.
 */
export function nextTurn(
  state: GameState,
  actions: readonly Action[],
  rng: Rng = rngForTurn(state.seed, state.turn),
): GameState {
  if (state.status !== "active") throw new GameError("This game is over.");
  const s = structuredClone(state);
  for (const a of actions) applyActionInPlace(s, a);

  // Costs for the quarter that just ended.
  const rate = ECONOMY[s.economy].rate + DIFFICULTY[s.difficulty].rateSpread;
  s.cash = round2(s.cash - s.debt * rate - shortValue(s) * SHORT_FEE);
  if (s.cash < 0) {
    s.debt = round2(s.debt - s.cash); // shortfall rolls into the loan
    s.cash = 0;
  }

  // Economy, then industry shocks, then news. Draw order must never change.
  s.economy = nextPhase(rng, s.economy);
  const econ = ECONOMY[s.economy];
  const industryShock = {} as Record<Industry, number>;
  for (const ind of INDUSTRIES) industryShock[ind] = 0.02 * rng.normal();
  s.news = drawNews(rng);

  for (const c of COMPANIES) {
    let priceFx = 0;
    let epsFx = 0;
    for (const n of s.news) {
      const hit = n.scope === "market" || (n.scope === "industry" && n.target === c.industry) || (n.scope === "company" && n.target === c.id);
      if (hit) {
        priceFx += n.priceEffect;
        epsFx += n.epsEffect;
      }
    }
    const cs = s.companies[c.id];
    const growth = BASE_GROWTH + econ.growth * c.beta + industryShock[c.industry] + 0.5 * c.vol * rng.normal() + epsFx;
    cs.eps = round2(Math.max(c.eps * MIN_EPS_FRACTION, cs.eps * (1 + Math.min(0.5, Math.max(-0.5, growth)))) * 100) / 100;
    const fair = cs.eps * 4 * c.pe * econ.peMult;
    const logReturn = REVERSION * Math.log(fair / cs.price) + c.vol * rng.normal() + priceFx;
    cs.price = Math.max(MIN_PRICE, round2(cs.price * Math.exp(logReturn)));
    cs.history.push(cs.price);
  }

  s.turn += 1;
  const nw = netWorth(s);
  s.netWorthHistory.push(nw);
  if (nw <= 0) s.status = "bankrupt";
  else if (s.turn >= s.maxTurns) s.status = "finished";
  return s;
}

/** Replays a full game from the seed and a per-turn action log. Used by the verifier. */
export function replay(seed: number, difficulty: Difficulty, log: readonly (readonly Action[])[], maxTurns = DEFAULT_MAX_TURNS): GameState {
  let s = newGame(seed, difficulty, maxTurns);
  for (const actions of log) s = nextTurn(s, actions);
  return s;
}

