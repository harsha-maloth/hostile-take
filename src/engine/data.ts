import type { CompanyDef, Difficulty, Industry, Phase } from "./types";

export const INDUSTRIES: readonly Industry[] = [
  "telecom",
  "steel",
  "energy",
  "retail",
  "software",
  "pharma",
];

export const INDUSTRY_LABEL: Record<Industry, string> = {
  telecom: "telecom",
  steel: "steel",
  energy: "energy",
  retail: "retail",
  software: "software",
  pharma: "pharmaceutical",
};

// All names and numbers are original and fictional.
export const COMPANIES: readonly CompanyDef[] = [
  { id: "MEGA", name: "Megahertz Telecom", industry: "telecom", beta: 0.7, vol: 0.07, pe: 14, eps: 0.9, shares: 900_000 },
  { id: "DIAL", name: "Dialtone Global", industry: "telecom", beta: 0.8, vol: 0.08, pe: 13, eps: 0.6, shares: 600_000 },
  { id: "ROAM", name: "Roamer Wireless", industry: "telecom", beta: 1.0, vol: 0.11, pe: 16, eps: 0.4, shares: 400_000 },

  { id: "IRON", name: "Ironclad Steel", industry: "steel", beta: 1.4, vol: 0.12, pe: 9, eps: 1.2, shares: 800_000 },
  { id: "FORG", name: "Forge & Anvil", industry: "steel", beta: 1.3, vol: 0.13, pe: 10, eps: 0.8, shares: 500_000 },
  { id: "RUST", name: "Rustbelt Metals", industry: "steel", beta: 1.6, vol: 0.16, pe: 8, eps: 0.5, shares: 700_000 },
  { id: "GIRD", name: "Girder Group", industry: "steel", beta: 1.2, vol: 0.1, pe: 11, eps: 0.7, shares: 450_000 },

  { id: "GUSH", name: "Gusher Oil", industry: "energy", beta: 1.3, vol: 0.15, pe: 10, eps: 1.5, shares: 1_000_000 },
  { id: "WATT", name: "Wattson Power", industry: "energy", beta: 0.6, vol: 0.07, pe: 15, eps: 0.8, shares: 650_000 },
  { id: "SLIK", name: "Slick Petroleum", industry: "energy", beta: 1.5, vol: 0.18, pe: 9, eps: 0.6, shares: 550_000 },

  { id: "CART", name: "Cartwheel Stores", industry: "retail", beta: 1.1, vol: 0.1, pe: 14, eps: 0.7, shares: 750_000 },
  { id: "IMPL", name: "Impulse Buy Corp", industry: "retail", beta: 1.4, vol: 0.14, pe: 17, eps: 0.5, shares: 350_000 },
  { id: "SHLF", name: "Shelf Life Grocers", industry: "retail", beta: 0.5, vol: 0.06, pe: 15, eps: 0.9, shares: 850_000 },

  { id: "CLOD", name: "Cloudy Logic", industry: "software", beta: 1.3, vol: 0.15, pe: 24, eps: 0.5, shares: 600_000 },
  { id: "BUGF", name: "Bugfix Systems", industry: "software", beta: 1.1, vol: 0.12, pe: 20, eps: 0.6, shares: 500_000 },
  { id: "OVER", name: "Overflow Labs", industry: "software", beta: 1.6, vol: 0.2, pe: 28, eps: 0.3, shares: 300_000 },
  { id: "KERN", name: "Kernel Panic Inc", industry: "software", beta: 1.2, vol: 0.14, pe: 22, eps: 0.4, shares: 400_000 },

  { id: "PLAC", name: "Placebo Pharma", industry: "pharma", beta: 0.6, vol: 0.09, pe: 18, eps: 1.0, shares: 700_000 },
  { id: "REMY", name: "Remedy Rx", industry: "pharma", beta: 0.5, vol: 0.08, pe: 17, eps: 0.8, shares: 600_000 },
  { id: "BOLU", name: "Bolus Biotech", industry: "pharma", beta: 1.0, vol: 0.22, pe: 26, eps: 0.2, shares: 250_000 },
];

export const COMPANY_BY_ID: Record<string, CompanyDef> = Object.fromEntries(
  COMPANIES.map((c) => [c.id, c]),
);

export interface PhaseParams {
  /** Mean quarterly earnings growth for a beta-1 company. */
  growth: number;
  /** Multiplier on fair P/E. */
  peMult: number;
  /** Quarterly interest rate on loans. */
  rate: number;
}

export const ECONOMY: Record<Phase, PhaseParams> = {
  boom: { growth: 0.04, peMult: 1.12, rate: 0.02 },
  expansion: { growth: 0.02, peMult: 1.0, rate: 0.015 },
  slowdown: { growth: -0.01, peMult: 0.9, rate: 0.0125 },
  recession: { growth: -0.05, peMult: 0.75, rate: 0.008 },
};

/** Probability of moving from one phase to the next each quarter. */
export const TRANSITIONS: Record<Phase, readonly (readonly [Phase, number])[]> = {
  expansion: [["expansion", 0.65], ["boom", 0.25], ["slowdown", 0.1]],
  boom: [["boom", 0.5], ["slowdown", 0.45], ["recession", 0.05]],
  slowdown: [["slowdown", 0.45], ["recession", 0.3], ["expansion", 0.25]],
  recession: [["recession", 0.45], ["expansion", 0.55]],
};

export const PHASES: readonly Phase[] = ["boom", "expansion", "slowdown", "recession"];

export interface DifficultyParams {
  startCash: number;
  /** Added to the loan rate each quarter. */
  rateSpread: number;
}

export const DIFFICULTY: Record<Difficulty, DifficultyParams> = {
  1: { startCash: 1_000_000, rateSpread: 0 },
  2: { startCash: 750_000, rateSpread: 0.002 },
  3: { startCash: 500_000, rateSpread: 0.004 },
  4: { startCash: 250_000, rateSpread: 0.006 },
};

// Tunable rules.
export const DEFAULT_MAX_TURNS = 40; // ten years
export const BASE_GROWTH = 0.012; // secular quarterly earnings growth
export const REVERSION = 0.3; // share of the price gap closed each quarter
export const COMMISSION = 0.0025; // fee on every trade
export const SHORT_FEE = 0.005; // quarterly fee on short value
export const MAX_DEBT_TO_NET_WORTH = 2; // borrowing cap
export const MAX_SHORT_TO_NET_WORTH = 1; // short exposure cap
export const MIN_PRICE = 0.5;
