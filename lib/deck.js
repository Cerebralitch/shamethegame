// The deck is read from stg-cards-v1.1.json. Names and copy are never retyped into code.
import { readFileSync } from "node:fs";

const deck = JSON.parse(readFileSync(new URL("../stg-cards-v1.1.json", import.meta.url), "utf8"));

// A card is shown only while its status is one of these. Set any other status to pull a card from the test.
const VISIBLE = new Set(["draft", "review", "approved", "locked"]);
const TYPE_ORDER = ["shame", "worth", "activation"];

export const SPREAD = deck.spread; // { worth: 1, shame: 2, activation: 1 }

/** The four places of a spread, in reading order: Worth, Shame, Shame, Activation. */
export const SLOT_TYPES = ["worth", "shame", "shame", "activation"];

export const cards = deck.cards
  .filter((c) => VISIBLE.has(c.status))
  .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.order - b.order);

export const byId = Object.fromEntries(cards.map((c) => [c.id, c]));

/** What the browser is allowed to see: no engine notes. */
export const publicCards = cards.map(({ id, type, name, copy, status }) => ({ id, type, name, copy, status }));
