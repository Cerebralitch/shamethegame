// Builds the model request from stg-reading-instructions-v0.3.md and the four chosen cards.
import { readFileSync } from "node:fs";

const doc = readFileSync(new URL("../stg-reading-instructions-v0.3.md", import.meta.url), "utf8");
const promptsFile = JSON.parse(readFileSync(new URL("../shame_prompts.json", import.meta.url), "utf8"));

/**
 * The Shame Prompts the model may choose from for "A Question for You". SP-20 is held back until its
 * unlock rule is built. The model sees id, lens, depth and text only (never source notes).
 */
export const PROMPT_OPTIONS = promptsFile.prompts
  .filter((p) => p.id !== "SP-20")
  .map(({ id, lens, depth, prompt }) => ({ id, lens, depth, prompt }));

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

// Sent after the cards. The app replaces the instructions' "question to carry" with a question chosen,
// not written, by the model from shame_prompts.json; the player sees it only after tapping a button.
const PROMPT_CHOICE = `In this version of the app, do not write a question to carry. Instead, choose the one question below that best fits this reading and these cards, and return only its ID as prompt_id. The player will see it later, on its own screen. Choose; never rewrite.

${PROMPT_OPTIONS.map((p) => `${p.id} · ${p.lens} · depth ${p.depth} · ${p.prompt}`).join("\n")}`;

/** The user message: the four cards in reading order, then the question options. Nothing from the player except their choice of cards. */
export function userMessage(spread) {
  return `The player chose these four cards, in reading order:\n\n${spread.map(describe).join("\n\n")}\n\n${PROMPT_CHOICE}`;
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
      prompt_id: { type: "string", enum: PROMPT_OPTIONS.map((p) => p.id) },
    },
    required: ["title", "opening", "sections", "actions", "prompt_id"],
    additionalProperties: false,
  };
}
