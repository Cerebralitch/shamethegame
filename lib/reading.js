// Turns four card IDs into a checked reading.
import Anthropic from "@anthropic-ai/sdk";
import { byId, SLOT_TYPES } from "./deck.js";
import { checkReading } from "./check.js";
import { PROMPT_OPTIONS, SYSTEM, readingSchema, userMessage } from "./prompt.js";

const MODEL = "claude-sonnet-5-5";

/** Resolves the browser's four IDs to cards, or returns null if they aren't a valid spread. */
export function resolveSpread(ids) {
  if (!Array.isArray(ids) || ids.length !== SLOT_TYPES.length || new Set(ids).size !== ids.length) return null;
  const spread = ids.map((id, i) => (typeof id === "string" && byId[id]?.type === SLOT_TYPES[i] ? byId[id] : null));
  return spread.every(Boolean) ? spread : null;
}

let defaultClient;
// Server-side fallback is a beta feature. If the API rejects a request that uses it, it is switched off
// for the life of this server instance and the request is sent again as a plain request.
let useFallbacks = true;

// What to tell the model when its previous draft failed a check. Only the rule is sent back, never the draft.
const FIXES = {
  length: "It was too long. The whole reading, title through question, must be under 350 words; aim for about 280.",
  attributions:
    "It named too many people. Name at most three voices in total, and at most one from the research list. The engine notes cite researchers as background for you; you do not need to name them. A reading with no names is fine.",
  name: "It named a person, or a book, poem or film, that is not on the approved list. Name only the listed voices and works.",
  quotes: "It used quotation marks. Use none at all, not even for shame's own voice or a single word; paraphrase instead.",
  markup: "It used formatting symbols, bullets or emoji. Every field must be plain sentences.",
  "banned-word": "It used a word or claim from the Never say list, a statistic, or a phrase like research shows.",
  "avoid-phrase": "It used a phrase that one of the cards' engine notes says to avoid.",
  "action-length": "An action was too long. Each action must be one sentence under 25 words.",
  sections: "The sections were wrong. Write exactly one section per card, in the order given, using each card's exact card_id.",
  actions: "There must be exactly three actions.",
  shape: "A field was missing or empty. Fill in title, opening, sections, actions and prompt_id.",
  unusable: "The response could not be used. Return only the JSON described in the instructions.",
};

/** The retry note for the given problem categories, or "" for a first attempt. */
export function retryNote(problems) {
  const fixes = problems.map((p) => FIXES[p]).filter(Boolean);
  if (!fixes.length) return "";
  return `\n\nA previous draft for this spread was rejected by the app's automatic checks. Write a fresh reading that fixes this:\n${fixes.map((f) => `- ${f}`).join("\n")}`;
}

/**
 * One model call. Returns the parsed reading, or null if the model declined or returned unusable output.
 * `problems` are the check categories a previous draft failed; the model is told which rules to fix.
 */
export async function generate(spread, problems = [], client = (defaultClient ??= new Anthropic({ timeout: 40_000, maxRetries: 1 }))) {
  const params = {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: readingSchema(spread) } },
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage(spread) + retryNote(problems) }],
  };
  let res;
  if (useFallbacks) {
    try {
      // If a safety check declines the request, the API re-runs it on Anthropic's recommended fallback model.
      res = await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
    } catch (e) {
      if (!(e instanceof Anthropic.BadRequestError)) throw e;
      console.warn("fallbacks rejected, continuing without:", scrub(e.message));
      useFallbacks = false;
    }
  }
  res ??= await client.messages.create(params);
  if (res.stop_reason !== "end_turn") return null;
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Removes card IDs and names from an API error message so it can be logged without revealing card choices. */
export function scrub(message) {
  let m = String(message || "").slice(0, 300).replace(/\b(?:shame|worth|activation)-\d+\b/gi, "[card]");
  for (const c of Object.values(byId)) m = m.split(c.name).join("[card]");
  return m;
}

/**
 * Generates a reading and checks it; on failure regenerates once (Dev Spec 3.5),
 * telling the model which rules the first draft broke.
 * Returns { reading } or { problems } — problem categories only, never reading text.
 */
export async function createReading(spread, gen = generate) {
  let problems = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await gen(spread, problems);
    problems = r ? checkReading(r, spread) : ["unusable"];
    if (!problems.length) {
      return {
        reading: {
          title: r.title.trim(),
          opening: r.opening.trim(),
          sections: r.sections.map((s) => ({ card_id: s.card_id, text: s.text.trim() })),
          actions: r.actions.map((a) => a.trim()),
          // The question the model chose, if it is a real, offerable prompt; otherwise the app falls back to SP-08.
          prompt_id: PROMPT_OPTIONS.some((p) => p.id === r.prompt_id) ? r.prompt_id : null,
        },
      };
    }
  }
  return { problems };
}
