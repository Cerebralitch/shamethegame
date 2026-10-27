// POST /api/reading: the browser sends only four card IDs; the server builds the prompt, calls Claude,
// checks the reading and returns it. Card choices and readings are never logged or stored.
import Anthropic from "@anthropic-ai/sdk";
import { takeReading } from "../lib/rate-limit.js";
import { createReading, resolveSpread, scrub } from "../lib/reading.js";

const NO_STORE = { "Cache-Control": "no-store" };
const fail = (status, error, headers = {}) => Response.json({ error }, { status, headers: { ...NO_STORE, ...headers } });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad-request");
  }
  const spread = resolveSpread(body?.cards);
  if (!spread) return fail(400, "bad-request");

  const wait = takeReading(request);
  if (wait) return fail(429, "rate-limited", { "Retry-After": String(wait) });

  try {
    const { reading, problems } = await createReading(spread);
    if (reading) return Response.json({ reading }, { headers: NO_STORE });
    // Only the check categories are logged, never the cards or the text.
    console.warn("reading rejected twice:", problems.join(","));
    return fail(502, "unavailable");
  } catch (e) {
    // The API's own message says which setting it objected to; card IDs and names are removed first.
    console.error("reading failed:", e instanceof Anthropic.APIError ? `API ${e.status} ${scrub(e.message)}` : e?.name || "error");
    return fail(502, "unavailable");
  }
}
