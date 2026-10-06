// Balance check: many seeded games under simple strategies. Run: npm run sim
import { newGame, nextTurn, netWorth, COMPANIES, type GameState } from "../src/engine";

const N = 1000;
const pct = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * p)];

function equalWeight(s: GameState, leverage: number): GameState {
  let g = s;
  if (leverage > 0) g = nextTurn(g, [{ type: "borrow", amount: Math.floor(g.cash * leverage) }]);
  const per = g.cash / COMPANIES.length;
  return nextTurn(g, COMPANIES.map((c) => ({ type: "buy" as const, id: c.id, shares: Math.floor(per / (g.companies[c.id].price * 1.0025)) })).filter((a) => a.shares > 0));
}

function run(label: string, setup: ((s: GameState) => GameState) | null) {
  const finals: number[] = []; let bust = 0; const phases: Record<string, number> = {};
  for (let seed = 1; seed <= N; seed++) {
    let s = newGame(seed, 1);
    const start = netWorth(s);
    s = setup ? setup(s) : nextTurn(s, []);
    while (s.status === "active") { s = nextTurn(s, []); phases[s.economy] = (phases[s.economy] ?? 0) + 1; }
    if (s.status === "bankrupt") bust++;
    finals.push(netWorth(s) / start);
  }
  const mean = finals.reduce((a, b) => a + b, 0) / N;
  const annual = Math.pow(pct(finals, 0.5), 1 / 10) - 1;
  console.log(`${label.padEnd(18)} median x${pct(finals, 0.5).toFixed(2)}  p10 x${pct(finals, 0.1).toFixed(2)}  p90 x${pct(finals, 0.9).toFixed(2)}  mean x${mean.toFixed(2)}  ~${(annual * 100).toFixed(1)}%/yr  bankrupt ${(bust / N * 100).toFixed(1)}%`);
  return phases;
}

run("hold cash", null);
const ph = run("equal-weight", (s) => equalWeight(s, 0));
run("1x leveraged", (s) => equalWeight(s, 1));
run("2x leveraged", (s) => equalWeight(s, 2));
const tot = Object.values(ph).reduce((a, b) => a + b, 0);
console.log("phase share:", Object.entries(ph).map(([k, v]) => `${k} ${(v / tot * 100).toFixed(0)}%`).join(", "));
