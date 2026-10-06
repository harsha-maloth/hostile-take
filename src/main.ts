import "./styles.css";
import {
  COMPANIES, COMPANY_BY_ID, INDUSTRY_LABEL, GameError, applyActionInPlace, netWorth, newGame, nextTurn, replay,
  type Action, type Difficulty, type GameState,
} from "./engine";

// A save is just the seed + action log: the engine replays it exactly.
interface Save { seed: number; difficulty: Difficulty; log: Action[][]; pending: Action[] }
const KEY = "hostile-take:save:v1";
const TABS = ["portfolio", "market", "news"] as const;
type Tab = (typeof TABS)[number];

const app = document.querySelector<HTMLDivElement>("#app")!;
let save: Save | null = null;
let state: GameState | null = null;
let tab: Tab = "portfolio";
let sel: string | null = null;
let msg = "";

const usd = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
const px = (n: number) => "$" + n.toFixed(2);
const pct = (n: number) => (n >= 0 ? "+" : "") + (n * 100).toFixed(1) + "%";
const cls = (n: number) => (n >= 0 ? "gain" : "loss");

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* storage full or blocked: play on */ }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as Save;
    state = replay(s.seed, s.difficulty, s.log);
    save = s;
  } catch { save = null; state = null; }
}

/** State as it will look after the queued trades (before the market moves). */
function draft(): GameState {
  const d = structuredClone(state!);
  for (const a of save!.pending) applyActionInPlace(d, a);
  return d;
}

function spark(values: number[]): string {
  const w = 300, h = 70;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * w},${h - 4 - ((v - lo) / span) * (h - 8)}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="History chart">
    <polyline points="${pts}" fill="none" stroke="var(--${up ? "gain" : "loss"})" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function change(id: string): number {
  const h = state!.companies[id].history;
  return h.length < 2 ? 0 : h[h.length - 1] / h[h.length - 2] - 1;
}

function head(d: GameState): string {
  const q = (d.turn % 4) + 1, y = Math.floor(d.turn / 4) + 1;
  return `<header class="top">
    <div><h1 class="sm">Hostile <span>Take</span></h1><p class="status">Year ${y}, quarter ${q} of ${d.maxTurns / 4} years · ${d.economy}</p></div>
    <div class="nw"><span class="status">Net worth</span><b class="num">${usd(netWorth(d))}</b></div></header>
    <nav class="tabs">${TABS.map((t) => `<button class="tab ${t === tab ? "on" : ""}" data-a="tab" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</nav>`;
}

function label(a: Action): string {
  if ("amount" in a) return `${a.type} ${usd(a.amount)}`;
  return `${a.type} ${a.shares.toLocaleString()} ${a.id}`;
}

function portfolio(d: GameState): string {
  const pos = (m: Record<string, number>, kind: string) =>
    Object.entries(m).map(([id, n]) => `<button class="row-item" data-a="pick" data-v="${id}">
      <span>${COMPANY_BY_ID[id].name}<small class="status">${kind} ${n.toLocaleString()} shares</small></span>
      <span class="num">${usd(n * d.companies[id].price)}</span></button>`).join("");
  const held = pos(d.longs, "Long") + pos(d.shorts, "Short");
  const queued = save!.pending.map((a, i) => `<div class="row-item"><span>${label(a)}</span><button class="ghost sm" data-a="undo" data-v="${i}">Undo</button></div>`).join("");
  return `<section class="card"><h2>Net worth over time</h2>${spark(d.netWorthHistory)}</section>
    <section class="card"><div class="row-item"><span>Cash</span><span class="num">${usd(d.cash)}</span></div>
      <div class="row-item"><span>Debt</span><span class="num ${d.debt ? "loss" : ""}">${usd(d.debt)}</span></div></section>
    <section class="card"><h2>Positions</h2>${held || `<p class="status">No positions yet. Open the Market tab to buy or short.</p>`}</section>
    ${queued ? `<section class="card"><h2>Queued trades</h2>${queued}<p class="status">They execute when you end the quarter.</p></section>` : ""}`;
}

function market(d: GameState): string {
  if (sel) {
    const c = COMPANY_BY_ID[sel], cs = d.companies[sel];
    return `<button class="ghost sm" data-a="back">Back to market</button>
      <section class="card"><h2>${c.name}</h2><p class="status">${INDUSTRY_LABEL[c.industry]} · ${sel}</p>
        <p class="num big">${px(cs.price)} <span class="${cls(change(sel))}">${pct(change(sel))}</span></p>
        ${spark(cs.history)}
        <p class="status">Earnings per share ${px(cs.eps)} per quarter · long ${(d.longs[sel] ?? 0).toLocaleString()} · short ${(d.shorts[sel] ?? 0).toLocaleString()}</p>
        <label class="status" for="qty">Shares</label>
        <input id="qty" class="num" type="number" inputmode="numeric" min="1" value="100" />
        <div class="row">${(["buy", "sell", "short", "cover"] as const).map((t) => `<button class="${t === "buy" ? "" : "ghost"}" data-a="trade" data-v="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
      </section>`;
  }
  return `<section class="card">${COMPANIES.map((c) => `<button class="row-item" data-a="pick" data-v="${c.id}">
    <span>${c.name}<small class="status">${INDUSTRY_LABEL[c.industry]}</small></span>
    <span class="num">${px(d.companies[c.id].price)} <span class="${cls(change(c.id))}">${pct(change(c.id))}</span></span></button>`).join("")}</section>`;
}

function news(d: GameState): string {
  if (!d.news.length) return `<section class="card"><p class="status">No news yet. End the quarter to see what happens.</p></section>`;
  return `<section class="card"><h2>Last quarter</h2>${d.news.map((n) => `<p class="story"><b class="${cls(n.priceEffect)}">${n.priceEffect === 0 ? "•" : n.priceEffect > 0 ? "▲" : "▼"}</b> ${n.headline}</p>`).join("")}</section>`;
}

function render() {
  if (!state || !save) {
    app.innerHTML = `<h1>Hostile <span>Take</span></h1><p class="tag">Buy low. Take over. Win big.</p>
      <section class="card"><h2>Start a new game</h2>
        <label class="status" for="diff">Difficulty</label>
        <select id="diff"><option value="1">Easy: $1,000,000</option><option value="2">Medium: $750,000</option><option value="3">Hard: $500,000</option><option value="4">Brutal: $250,000</option></select>
        <div class="row"><button data-a="new">New game</button>${localStorage.getItem(KEY) ? `<button class="ghost" data-a="resume">Resume</button>` : ""}</div></section>`;
    return;
  }
  let d: GameState;
  try { d = draft(); } catch { save.pending = []; d = state; }
  const over = state.status !== "active";
  const body = tab === "portfolio" ? portfolio(d) : tab === "market" ? market(d) : news(state);
  const end = over
    ? `<section class="card"><h2>${state.status === "bankrupt" ? "Bankrupt" : "Game over"}</h2><p class="num big">${usd(netWorth(state))}</p><button data-a="quit">New game</button></section>`
    : "";
  app.innerHTML = `${head(d)}${msg ? `<p class="err" role="alert">${msg}</p>` : ""}<main>${body}${end}</main>
    ${over ? "" : `<div class="bar"><button data-a="end">End quarter</button></div>`}`;
}

app.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-a]");
  if (!el) return;
  const v = el.dataset.v ?? "";
  msg = "";
  switch (el.dataset.a) {
    case "new": {
      const difficulty = Number(document.querySelector<HTMLSelectElement>("#diff")!.value) as Difficulty;
      const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0; // UI only: the engine never uses Math.random
      save = { seed, difficulty, log: [], pending: [] };
      state = newGame(seed, difficulty);
      tab = "portfolio"; sel = null; persist(); break;
    }
    case "resume": load(); break;
    case "quit": localStorage.removeItem(KEY); save = null; state = null; break;
    case "tab": tab = v as Tab; sel = null; break;
    case "pick": tab = "market"; sel = v; break;
    case "back": sel = null; break;
    case "undo": save!.pending.splice(Number(v), 1); persist(); break;
    case "trade": {
      const shares = Number(document.querySelector<HTMLInputElement>("#qty")!.value);
      const a = { type: v, id: sel!, shares } as Action;
      try { const t = draft(); applyActionInPlace(t, a); save!.pending.push(a); persist(); }
      catch (err) { msg = err instanceof GameError ? err.message : "Something went wrong with that trade."; }
      break;
    }
    case "end": {
      try {
        state = nextTurn(state!, save!.pending);
        save!.log.push(save!.pending); save!.pending = [];
        tab = "news"; sel = null; persist();
      } catch (err) { msg = err instanceof GameError ? err.message : "Could not end the quarter."; }
      break;
    }
  }
  render();
  window.scrollTo(0, 0);
});

load();
render();
