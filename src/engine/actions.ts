import { COMPANY_BY_ID, COMMISSION, MAX_DEBT_TO_NET_WORTH, MAX_SHORT_TO_NET_WORTH } from "./data";
import { Action, GameError, GameState } from "./types";

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export function longValue(s: GameState): number {
  let v = 0;
  for (const [id, n] of Object.entries(s.longs)) v += n * s.companies[id].price;
  return v;
}

export function shortValue(s: GameState): number {
  let v = 0;
  for (const [id, n] of Object.entries(s.shorts)) v += n * s.companies[id].price;
  return v;
}

export function netWorth(s: GameState): number {
  return round2(s.cash + longValue(s) - shortValue(s) - s.debt);
}

function requireShares(shares: number): void {
  if (!Number.isInteger(shares) || shares <= 0) throw new GameError("Shares must be a whole number above zero.");
}

function requireAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) throw new GameError("Amount must be above zero.");
}

function requireCompany(s: GameState, id: string): number {
  if (!COMPANY_BY_ID[id] || !s.companies[id]) throw new GameError(`Unknown company: ${id}.`);
  return s.companies[id].price;
}

/** Applies one action to `s` in place. Throws GameError if it is illegal. */
export function applyActionInPlace(s: GameState, a: Action): void {
  if (s.status !== "active") throw new GameError("This game is over.");

  switch (a.type) {
    case "buy": {
      requireShares(a.shares);
      const price = requireCompany(s, a.id);
      if ((s.shorts[a.id] ?? 0) > 0) throw new GameError("Cover your short before buying this company.");
      const cost = round2(a.shares * price * (1 + COMMISSION));
      if (cost > s.cash) throw new GameError(`Not enough cash: this costs $${cost.toFixed(2)}.`);
      s.cash = round2(s.cash - cost);
      s.longs[a.id] = (s.longs[a.id] ?? 0) + a.shares;
      return;
    }
    case "sell": {
      requireShares(a.shares);
      const price = requireCompany(s, a.id);
      const held = s.longs[a.id] ?? 0;
      if (a.shares > held) throw new GameError(`You hold only ${held} shares.`);
      s.cash = round2(s.cash + a.shares * price * (1 - COMMISSION));
      if (held === a.shares) delete s.longs[a.id];
      else s.longs[a.id] = held - a.shares;
      return;
    }
    case "short": {
      requireShares(a.shares);
      const price = requireCompany(s, a.id);
      if ((s.longs[a.id] ?? 0) > 0) throw new GameError("Sell your shares before shorting this company.");
      const value = a.shares * price;
      s.cash = round2(s.cash + value - value * COMMISSION);
      s.shorts[a.id] = (s.shorts[a.id] ?? 0) + a.shares;
      if (shortValue(s) > MAX_SHORT_TO_NET_WORTH * Math.max(netWorth(s), 0)) {
        // Roll back.
        s.cash = round2(s.cash - value + value * COMMISSION);
        s.shorts[a.id] -= a.shares;
        if (s.shorts[a.id] === 0) delete s.shorts[a.id];
        throw new GameError("Short limit reached: shorts cannot exceed your net worth.");
      }
      return;
    }
    case "cover": {
      requireShares(a.shares);
      const price = requireCompany(s, a.id);
      const owed = s.shorts[a.id] ?? 0;
      if (a.shares > owed) throw new GameError(`You are short only ${owed} shares.`);
      const cost = round2(a.shares * price * (1 + COMMISSION));
      if (cost > s.cash) throw new GameError(`Not enough cash: covering costs $${cost.toFixed(2)}.`);
      s.cash = round2(s.cash - cost);
      if (owed === a.shares) delete s.shorts[a.id];
      else s.shorts[a.id] = owed - a.shares;
      return;
    }
    case "borrow": {
      requireAmount(a.amount);
      const limit = MAX_DEBT_TO_NET_WORTH * Math.max(netWorth(s), 0);
      if (s.debt + a.amount > limit) {
        throw new GameError(`Loan limit reached: debt cannot exceed ${MAX_DEBT_TO_NET_WORTH}x net worth ($${limit.toFixed(2)}).`);
      }
      s.debt = round2(s.debt + a.amount);
      s.cash = round2(s.cash + a.amount);
      return;
    }
    case "repay": {
      requireAmount(a.amount);
      if (a.amount > s.debt) throw new GameError(`You owe only $${s.debt.toFixed(2)}.`);
      if (a.amount > s.cash) throw new GameError("Not enough cash to repay that much.");
      s.debt = round2(s.debt - a.amount);
      s.cash = round2(s.cash - a.amount);
      return;
    }
    default: {
      throw new GameError("Unknown action.");
    }
  }
}
