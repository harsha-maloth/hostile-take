import type { Rng } from "./rng";
import type { CompanyDef, Industry, NewsItem } from "./types";
import { COMPANIES, INDUSTRIES, INDUSTRY_LABEL } from "./data";

interface Template {
  scope: NewsItem["scope"];
  weight: number;
  priceEffect: number;
  epsEffect: number;
  headline: (who: string) => string;
}

// Original, fictional headlines. Humor lives here.
const TEMPLATES: readonly Template[] = [
  // Market-wide
  { scope: "market", weight: 3, priceEffect: 0.0, epsEffect: 0.0, headline: () => "Central bank holds rates; markets act surprised anyway" },
  { scope: "market", weight: 2, priceEffect: 0.04, epsEffect: 0.005, headline: () => "Consumer confidence jumps after survey of 40 optimists" },
  { scope: "market", weight: 2, priceEffect: -0.05, epsEffect: -0.005, headline: () => "Analysts warn of a correction, as they do every quarter" },
  { scope: "market", weight: 1, priceEffect: -0.1, epsEffect: -0.01, headline: () => "Credit scare: banks suddenly remember what risk is" },
  { scope: "market", weight: 1, priceEffect: 0.08, epsEffect: 0.01, headline: () => "Stimulus package passes, mostly by accident" },
  // Industry
  { scope: "industry", weight: 3, priceEffect: -0.05, epsEffect: -0.01, headline: (w) => `Regulators open inquiry into ${w} pricing` },
  { scope: "industry", weight: 3, priceEffect: 0.05, epsEffect: 0.01, headline: (w) => `${cap(w)} sector rides a wave of unexplained enthusiasm` },
  { scope: "industry", weight: 2, priceEffect: -0.07, epsEffect: -0.02, headline: (w) => `Supply chain trouble hits ${w} makers` },
  { scope: "industry", weight: 2, priceEffect: 0.06, epsEffect: 0.015, headline: (w) => `New trade deal opens markets for ${w} firms` },
  // Company
  { scope: "company", weight: 3, priceEffect: 0.06, epsEffect: 0.01, headline: (w) => `${w} announces buyback; analysts call it financial engineering with confidence` },
  { scope: "company", weight: 3, priceEffect: -0.1, epsEffect: -0.03, headline: (w) => `${w} finds accounting error; restatement expected` },
  { scope: "company", weight: 2, priceEffect: 0.12, epsEffect: 0.04, headline: (w) => `${w} lands a big contract, details withheld for drama` },
  { scope: "company", weight: 2, priceEffect: -0.14, epsEffect: -0.04, headline: (w) => `${w} CEO resigns to spend more time with an investigation` },
  { scope: "company", weight: 2, priceEffect: 0.08, epsEffect: 0.02, headline: (w) => `${w} beats forecasts; forecasts were low on purpose` },
  { scope: "company", weight: 1, priceEffect: -0.2, epsEffect: -0.06, headline: (w) => `${w} recalls its flagship product, and its credibility` },
];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Draws 2 to 4 news items for the quarter. Draw order is fixed for replay. */
export function drawNews(rng: Rng): NewsItem[] {
  const count = rng.int(2, 4);
  const items: NewsItem[] = [];
  for (let i = 0; i < count; i++) {
    const t = rng.weighted(TEMPLATES, (x) => x.weight);
    if (t.scope === "market") {
      items.push({ headline: t.headline(""), scope: "market", priceEffect: t.priceEffect, epsEffect: t.epsEffect });
    } else if (t.scope === "industry") {
      const ind: Industry = rng.pick(INDUSTRIES);
      items.push({
        headline: t.headline(INDUSTRY_LABEL[ind]),
        scope: "industry",
        target: ind,
        priceEffect: t.priceEffect,
        epsEffect: t.epsEffect,
      });
    } else {
      const c: CompanyDef = rng.pick(COMPANIES);
      items.push({
        headline: t.headline(c.name),
        scope: "company",
        target: c.id,
        priceEffect: t.priceEffect,
        epsEffect: t.epsEffect,
      });
    }
  }
  return items;
}
