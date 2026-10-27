// GET /api/prompts: the Shame Prompts from shame_prompts.json for the browser.
// Source notes and the language rules are for editors, not players, so they are left out.
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../shame_prompts.json", import.meta.url), "utf8"));

const { language_rules, ...session_rules } = data.session_rules;
const body = {
  version: data.version,
  button_label: data.button_label,
  session_rules,
  grounding: data.grounding,
  prompts: data.prompts.map(({ source_note, origin, ...p }) => p),
};

export function GET() {
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
}
