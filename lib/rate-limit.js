// A simple per-visitor limit on readings, held in memory only.
// The visitor key is a salted hash of the IP address; the salt is random per server instance and never saved,
// so the counts can't be traced back to anyone and vanish when the instance stops.
// Nothing here is logged, and it never sees which cards were chosen.
import { createHash, randomBytes } from "node:crypto";

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;
const salt = randomBytes(16);
const hits = new Map(); // visitor key -> timestamps of recent readings

function visitorKey(request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(salt).update(ip).digest("base64url").slice(0, 16);
}

/** Records one reading request. Returns 0 if allowed, or the seconds to wait before the next one. */
export function takeReading(request, now = Date.now()) {
  const key = visitorKey(request);
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) prune(now);
  return 0;
}

function prune(now) {
  for (const [key, times] of hits) if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
}
