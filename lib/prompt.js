// Builds the model request from stg-reading-instructions-v0.3.md and the four chosen cards.
import { readFileSync } from "node:fs";

const doc = readFileSync(new URL("../stg-reading-instructions-v0.3.md", import.meta.url), "utf8");

// Everything under "## Instructions" is the system prompt. "For Paul and Claude Code" above it is never sent.
const start = doc.indexOf("\n## Instructions");
if (start < 0) throw new Error("Reading instructions: '## Instructions' heading not found");
export const SYSTEM = doc.slice(start).replace(/^\s*## Instructions\s*/, "").trim();

/** The rows of the markdown table under the line that starts with `heading`: [person, idea] pairs. */
function tableAfter(heading) {
  const at = SYSTEM.indexOf("\n" + heading);
  if (at < 0) throw new Error(`Reading instructions: '${heading}' not found`);
  const rows = [];
  for (const line of SYSTEM.slice(at).split("\n").slice(1)) {
    if (!line.startsWith("|")) { if (rows.length) break; continue; }
    const [person, idea] = line.split("|").slice(1, 3).map((s) => s.trim());
    if (person && person !== "Person" && !/^-+$/.test(person)) rows.push([person, idea]);
  }
  return rows;
}

/**
 * Approved voices, read from the instructions' two tables so the list is kept in one place.
 * Each entry is one row: "Geoffrey Cohen and David Sherman" is one entry with two surnames.
 * `words` are the capitalised words of the row (names, and titles such as The Waste Land),
 * which the name check accepts.
 */
export const APPROVED = [
  ...tableAfter("**Research voices**").map((row) => [...row, "research"]),
  ...tableAfter("**Perspective voices**").map((row) => [...row, "perspective"]),
].map(([name, idea, group]) => ({
  name,
  group,
  surnames: name.split(/\s+and\s+/).map((p) => p.trim().split(/\s+/).pop()),
  words: `${name} ${idea}`.match(/\b[A-Z][\p{L}'’-]+/gu) || [],
}));

const LABEL = { worth: "Worth card", shame: "Shame card", activation: "Activation card" };

function describe(card) {
  const e = card.engine;
  return [
    `${LABEL[card.type]} · card_id: ${card.id}`,
    `Name: ${card.name}`,
    `Sensitivity: ${card.sensitivity}`,
    `Copy: ${card.copy}`,
    `Engine notes:`,
    `- Evidence: ${e.evidence}`,
    `- Must not: ${e.must_not.join("; ")}`,
    `- Prefer: ${e.prefer.join("; ")}`,
    `- Avoid: ${e.avoid.join("; ")}`,
  ].join("\n");
}

/** The user message: the four cards in reading order. Nothing from the player except their choice. */
export function userMessage(spread) {
  return `The player chose these four cards, in reading order:\n\n${spread.map(describe).join("\n\n")}`;
}

/** JSON shape the model must return. Counts and lengths are checked separately in lib/check.js. */
export function readingSchema(spread) {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      opening: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            card_id: { type: "string", enum: spread.map((c) => c.id) },
            text: { type: "string" },
          },
          required: ["card_id", "text"],
          additionalProperties: false,
        },
      },
      actions: { type: "array", items: { type: "string" } },
      carry: { type: "string" },
    },
    required: ["title", "opening", "sections", "actions", "carry"],
    additionalProperties: false,
  };
}
