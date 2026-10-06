export type Industry = "telecom" | "steel" | "energy" | "retail" | "software" | "pharma";
export type Phase = "boom" | "expansion" | "slowdown" | "recession";
export type Difficulty = 1 | 2 | 3 | 4;
export type GameStatus = "active" | "finished" | "bankrupt";

/** Fixed facts about a company. Never changes during a game. */
export interface CompanyDef {
  id: string;
  name: string;
  industry: Industry;
  /** Sensitivity to the economy (1 = average). */
  beta: number;
  /** Quarterly price noise (standard deviation, as a fraction). */
  vol: number;
  /** Fair price-to-earnings ratio in a normal economy. */
  pe: number;
  /** Starting earnings per share, per quarter. */
  eps: number;
  /** Shares outstanding (used by takeovers later). */
  shares: number;
}

export interface CompanyState {
  price: number;
  /** Earnings per share, per quarter. */
  eps: number;
  /** Closing price after each turn, starting with turn 0. */
  history: number[];
}

export interface NewsItem {
  headline: string;
  scope: "market" | "industry" | "company";
  /** Industry name or company id, when scope is not "market". */
  target?: string;
  /** Immediate log-return effect on price. */
  priceEffect: number;
  /** Permanent change to earnings growth this quarter. */
  epsEffect: number;
}

export interface GameState {
  seed: number;
  difficulty: Difficulty;
  /** Quarters played so far. */
  turn: number;
  maxTurns: number;
  status: GameStatus;
  economy: Phase;
  cash: number;
  debt: number;
  /** Long positions: company id -> shares. */
  longs: Record<string, number>;
  /** Short positions: company id -> shares owed. */
  shorts: Record<string, number>;
  companies: Record<string, CompanyState>;
  /** News that moved the market during the last turn. */
  news: NewsItem[];
  netWorthHistory: number[];
}

export type Action =
  | { type: "buy" | "sell" | "short" | "cover"; id: string; shares: number }
  | { type: "borrow" | "repay"; amount: number };

/** Thrown for any illegal action. The message is safe to show the player. */
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}
