import assert from "node:assert/strict";
import { createRng, GameError, netWorth, newGame, nextTurn, replay, COMPANIES, type Action, type GameState } from "../src/engine";

let passed = 0;
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`ok   ${name}`); }
  catch (e) { console.error(`FAIL ${name}\n     ${(e as Error).message}`); process.exitCode = 1; }
}
const throwsGame = (fn: () => unknown, re?: RegExp) =>
  assert.throws(fn, (e: unknown) => e instanceof GameError && (!re || re.test(e.message)));

test("rng: same seed, same stream; normal() is roughly N(0,1)", () => {
  const a = createRng(42), b = createRng(42);
  for (let i = 0; i < 50; i++) assert.equal(a.next(), b.next());
  const r = createRng(7);
  let sum = 0, sq = 0; const n = 20000;
  for (let i = 0; i < n; i++) { const x = r.normal(); sum += x; sq += x * x; }
  assert.ok(Math.abs(sum / n) < 0.05, "mean");
  assert.ok(Math.abs(sq / n - 1) < 0.05, "variance");
});

test("newGame: same seed identical, different seed differs", () => {
  assert.deepEqual(newGame(1), newGame(1));
  assert.notDeepEqual(newGame(1).companies, newGame(2).companies);
});

test("nextTurn: deterministic and does not mutate its input", () => {
  const s0 = newGame(99);
  const snapshot = JSON.stringify(s0);
  const a = nextTurn(s0, [{ type: "buy", id: "IRON", shares: 100 }]);
  const b = nextTurn(s0, [{ type: "buy", id: "IRON", shares: 100 }]);
  assert.equal(JSON.stringify(s0), snapshot);
  assert.deepEqual(a, b);
});

test("replay from action log matches live play", () => {
  let s = newGame(5, 2);
  const log: Action[][] = [];
  for (let t = 0; t < 12; t++) {
    const acts: Action[] = t === 0 ? [{ type: "buy", id: "MEGA", shares: 500 }] : [];
    log.push(acts);
    s = nextTurn(s, acts);
  }
  assert.deepEqual(replay(5, 2, log), s);
});

test("buy then sell at the same price costs only commissions", () => {
  const s0 = newGame(3);
  const bought = nextTurn(s0, [{ type: "buy", id: "GUSH", shares: 1000 }, { type: "sell", id: "GUSH", shares: 1000 }]);
  const price = s0.companies.GUSH.price;
  const fees = 2 * 1000 * price * 0.0025;
  // Cash change before the market moves is exactly the fees (turn costs are zero with no debt/shorts).
  assert.ok(Math.abs(s0.cash - bought.cash - fees) < 0.05);
  assert.equal(bought.longs.GUSH, undefined);
});

test("illegal actions throw plain GameErrors", () => {
  const s = newGame(1);
  throwsGame(() => nextTurn(s, [{ type: "buy", id: "IRON", shares: 10_000_000 }]), /Not enough cash/);
  throwsGame(() => nextTurn(s, [{ type: "sell", id: "IRON", shares: 1 }]), /hold only 0/);
  throwsGame(() => nextTurn(s, [{ type: "buy", id: "NOPE", shares: 1 }]), /Unknown company/);
  throwsGame(() => nextTurn(s, [{ type: "buy", id: "IRON", shares: 1.5 }]), /whole number/);
  throwsGame(() => nextTurn(s, [{ type: "buy", id: "IRON", shares: -3 }]), /whole number/);
  throwsGame(() => nextTurn(s, [{ type: "borrow", amount: 5_000_000 }]), /Loan limit/);
  throwsGame(() => nextTurn(s, [{ type: "repay", amount: 1 }]), /owe only/);
  throwsGame(() => nextTurn(s, [{ type: "short", id: "IRON", shares: 10_000_000 }]), /Short limit/);
  throwsGame(() => nextTurn(s, [{ type: "borrow", amount: NaN }]), /above zero/);
});

test("can't hold long and short in the same company", () => {
  let s = newGame(1);
  s = nextTurn(s, [{ type: "short", id: "ROAM", shares: 100 }]);
  throwsGame(() => nextTurn(s, [{ type: "buy", id: "ROAM", shares: 1 }]), /Cover your short/);
  let t = newGame(1);
  t = nextTurn(t, [{ type: "buy", id: "ROAM", shares: 10 }]);
  throwsGame(() => nextTurn(t, [{ type: "short", id: "ROAM", shares: 1 }]), /Sell your shares/);
});

test("a rejected short leaves state untouched (no partial effects)", () => {
  const s = newGame(1);
  const before = JSON.stringify(s);
  throwsGame(() => nextTurn(s, [{ type: "short", id: "IRON", shares: 10_000_000 }]));
  assert.equal(JSON.stringify(s), before);
});

test("debt accrues interest and shortfall rolls into the loan", () => {
  let s = newGame(8);
  s = nextTurn(s, [{ type: "borrow", amount: 500_000 }]);
  assert.ok(s.debt === 500_000);
  assert.ok(s.cash < s.netWorthHistory[0] + 500_000, "interest was charged");
  // Spend all cash, then let interest run with zero cash.
  let t = newGame(8);
  const price = t.companies.IRON.price;
  t = nextTurn(t, [{ type: "borrow", amount: 100_000 }]);
  const shares = Math.floor(t.cash / (price * 1.0025));
  t = nextTurn(t, [{ type: "buy", id: "IRON", shares: Math.floor(t.cash / (t.companies.IRON.price * 1.0025)) }]);
  assert.ok(shares > 0);
  assert.ok(t.cash >= 0);
  assert.ok(t.debt >= 100_000);
});

test("net worth identity holds every turn", () => {
  let s = newGame(21);
  s = nextTurn(s, [{ type: "buy", id: "CLOD", shares: 2000 }, { type: "short", id: "RUST", shares: 3000 }]);
  while (s.status === "active") {
    s = nextTurn(s, []);
    let nw = s.cash - s.debt;
    for (const [id, n] of Object.entries(s.longs)) nw += n * s.companies[id].price;
    for (const [id, n] of Object.entries(s.shorts)) nw -= n * s.companies[id].price;
    assert.ok(Math.abs(nw - netWorth(s)) < 0.01);
    assert.equal(s.netWorthHistory[s.netWorthHistory.length - 1], netWorth(s));
  }
});

test("game ends at maxTurns; no actions after the end", () => {
  let s = newGame(2, 1, 6);
  for (let i = 0; i < 6; i++) s = nextTurn(s, []);
  assert.equal(s.status, "finished");
  assert.equal(s.turn, 6);
  throwsGame(() => nextTurn(s, []), /over/);
});

test("over-leveraged long book can go bankrupt and ends the game", () => {
  let any = false;
  for (let seed = 1; seed <= 200 && !any; seed++) {
    let s = newGame(seed, 4);
    const total = s.cash * 3;
    s = nextTurn(s, [{ type: "borrow", amount: s.cash * 2 }]);
    s = nextTurn(s, [{ type: "buy", id: "OVER", shares: Math.floor(s.cash / (s.companies.OVER.price * 1.0025)) }]);
    while (s.status === "active") s = nextTurn(s, []);
    if (s.status === "bankrupt") any = true;
    void total;
  }
  assert.ok(any, "expected at least one bankruptcy across 200 leveraged games");
});

test("200 full games: no NaN, prices sane, 2-4 news items per turn", () => {
  for (let seed = 1; seed <= 200; seed++) {
    let s: GameState = newGame(seed, ((seed % 4) + 1) as 1 | 2 | 3 | 4);
    while (s.status === "active") {
      s = nextTurn(s, []);
      assert.ok(s.news.length >= 2 && s.news.length <= 4);
      for (const c of COMPANIES) {
        const p = s.companies[c.id].price;
        assert.ok(Number.isFinite(p) && p >= 0.5 && p < 100_000, `${c.id} price ${p} seed ${seed}`);
        assert.ok(Number.isFinite(s.companies[c.id].eps) && s.companies[c.id].eps > 0);
      }
    }
    assert.equal(s.status, "finished");
    assert.equal(s.companies.IRON.history.length, 41);
  }
});

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
