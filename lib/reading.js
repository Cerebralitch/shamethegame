// Turns four card IDs into a checked reading.
import Anthropic from "@anthropic-ai/sdk";
import { byId, SLOT_TYPES } from "./deck.js";
import { checkReading } from "./check.js";
import { SYSTEM, readingSchema, userMessage } from "./prompt.js";

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

/** One model call. Returns the parsed reading, or null if the model declined or returned unusable output. */
export async function generate(spread, client = (defaultClient ??= new Anthropic({ timeout: 40_000, maxRetries: 1 }))) {
  const params = {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: readingSchema(spread) } },
    system: SYSTEM,
    messages: [{ role: "user", content: userMessage(spread) }],
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
 * Generates a reading and checks it; on failure regenerates once (Dev Spec 3.5).
 * Returns { reading } or { problems } — problem categories only, never reading text.
 */
export async function createReading(spread, gen = generate) {
  let problems = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await gen(spread);
    problems = r ? checkReading(r, spread) : ["unusable"];
    if (!problems.length) {
      return {
        reading: {
          title: r.title.trim(),
          opening: r.opening.trim(),
          sections: r.sections.map((s) => ({ card_id: s.card_id, text: s.text.trim() })),
          actions: r.actions.map((a) => a.trim()),
        },
      };
    }
  }
  return { problems };
}
