// Rules for "A Question for You", read from shame_prompts.json (served by /api/prompts).
// Pure functions, shared by the page and the tests. Nothing here stores anything.
//
// "Session" in the JSON's prompts_per_session means one sitting: each time the button is tapped,
// the player gets one prompt (plus a closing prompt where required), never a chain of questions.
// "Used this visit" is held in memory and forgotten when the page closes.

/** Prompts held back for now. SP-20 waits for its unlock rule (out of scope until after the retreat). */
export const HELD_BACK = new Set(["SP-20"]);

const pickOne = (list, rand) => list[Math.floor(rand() * list.length)];

/**
 * Prompts that may be offered now.
 * @param {object} data shame_prompts.json (as served)
 * @param {{id: string, depth: number} | null} last the last prompt this device saw
 * @param {Set<string>} usedThisVisit prompt IDs already offered since the page opened
 */
export function eligible(data, last, usedThisVisit = new Set()) {
  const noDeep = data.session_rules.no_consecutive_depth_3 && last?.depth === 3;
  return data.prompts.filter(
    (p) => !HELD_BACK.has(p.id) && !usedThisVisit.has(p.id) && p.id !== last?.id && !(noDeep && p.depth === 3),
  );
}

/**
 * Chooses the one prompt for this sitting.
 * @param {"reading" | "tab"} entry where the button was tapped
 * @param {object} ctx
 * @param {string[]} ctx.shameCards the Shame card IDs chosen this visit, in order (empty if none)
 * @param {{id: string, depth: number} | null} ctx.last
 * @param {Set<string>} ctx.usedThisVisit
 * @param {() => number} [ctx.rand]
 */
export function pickPrompt(data, entry, { shameCards = [], last = null, usedThisVisit = new Set(), rand = Math.random }) {
  const pool = eligible(data, last, usedThisVisit);
  const cardPrompt = pool.find((p) => p.game_link === "card_reference");
  const depthOne = pool.filter((p) => p.depth === 1 && p.game_link !== "card_reference");

  // A card-based prompt needs cards from this visit to point at.
  if (cardPrompt && shameCards.length) return cardPrompt;
  if (entry === "reading") return pickOne(depthOne, rand) ?? pickOne(pool, rand) ?? null;

  // Reflect tab: stay with the lens the player last worked in; random depth 1 only with no history.
  if (last) {
    const lens = data.prompts.find((p) => p.id === last.id)?.lens;
    const sameLens = pool.filter((p) => p.lens === lens && p.game_link !== "card_reference");
    if (sameLens.length) return pickOne(sameLens, rand);
  }
  return pickOne(depthOne, rand) ?? null;
}

/**
 * The closing prompt to finish a sitting, or null if none is needed.
 * A prompt that names a required follow-up (SP-20 -> SP-21) always gets that one.
 * After a depth-3 prompt the closing is kept light: SP-18 (itself depth 2) is skipped.
 */
export function closingFor(data, prompt, rand = Math.random) {
  const all = [...data.prompts, ...data.grounding];
  if (prompt.requires_followup_id) return all.find((p) => p.id === prompt.requires_followup_id) ?? null;
  if (!data.session_rules.closing_required_at_depth.includes(prompt.depth)) return null;
  const choices = data.session_rules.closing_prompt_ids
    .filter((id) => id !== prompt.id)
    .map((id) => all.find((p) => p.id === id))
    .filter((p) => p && !(prompt.depth === 3 && p.depth === 2));
  return pickOne(choices, rand) ?? null;
}
