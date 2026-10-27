// Builds the model request from stg-reading-instructions-v0.2.md and the four chosen cards.
import { readFileSync } from "node:fs";

const doc = readFileSync(new URL("../stg-reading-instructions-v0.2.md", import.meta.url), "utf8");

// Everything under "## Instructions" is the system prompt. "For Paul" above it is never sent.
const start = doc.indexOf("\n## Instructions");
if (start < 0) throw new Error("Reading instructions: '## Instructions' heading not found");
export const SYSTEM = doc.slice(start).replace(/^\s*## Instructions\s*/, "").trim();

/**
 * Approved attributions, read from the instructions' table so the list is kept in one place.
 * Each entry is one row: "Geoffrey Cohen and David Sherman" is one entry with two surnames.
 */
export const APPROVED = [...SYSTEM.matchAll(/^\|\s*([^|]+?)\s*\|[^|\n]+\|\s*$/gm)]
  .map((m) => m[1].replace(/\*/g, "").trim())
  .filter((name) => name && !/^-+$/.test(name) && name !== "Person")
  .map((name) => ({ name, surnames: name.split(/\s+and\s+/).map((p) => p.trim().split(/\s+/).pop()) }));

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
    },
    required: ["title", "opening", "sections", "actions"],
    additionalProperties: false,
  };
}
