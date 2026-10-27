// Server checks run on every reading before it is shown (Dev Spec 3.5).
// checkReading returns a list of problem categories; an empty list means the reading may be shown.
// Categories never include reading text, so they are safe to count in logs.
import { APPROVED } from "./prompt.js";

const MAX_WORDS = 350; // whole reading, title included, must be under this
const MAX_ACTION_WORDS = 25;
const MAX_VOICES = 3; // named voices per reading
const MAX_RESEARCH_VOICES = 1; // of which at most one from the research group

// Words and claims the reading must never contain (Dev Spec 3.5 and the instructions' "Never say" list).
const BANNED = [
  /\btherap\w*/i,
  /\bcounsel(?:or|lor|ing|ling)s?\b/i,
  /\btreatments?\b/i,
  /\bdiagnos\w*/i,
  /\bdisorders?\b/i,
  /\bcur(?:e|es|ed|ing)\b/i,
  /\bheal(?:s|ed|ing|er|ers)?\b/i,
  /\bshame-free\b/i,
  /\b(?:research|studies|science|evidence)\s+(?:shows?|proves?|suggests?|finds?|found)\b/i,
  /\bstudies\s+have\b/i,
  /\d\s*%|\bpercent\b/i,
  /\bsuicid\w*/i,
  /\bself-harm\w*/i,
];

// People earlier instructions or the decisions log excluded by name. (Carl Jung is approved from v0.3.)
const EXCLUDED = /\b(?:Bradshaw|van der Kolk|Levine|Kaufmann|Purcell|Razack|Simon Moss|Freud)\b/;

const QUOTES = /["“”„«»]/;
const MARKUP = /[#*_`>\[\]{}|]|^\s*[-•]\s|\p{Extended_Pictographic}/mu;

// An attribution: a capitalised name followed by a verb of saying, or "according to Name".
const VERBS = "idea|ideas|suggest|suggests|suggested|wrote|writes|write|argue|argues|argued|call|calls|called|describe|describes|described|found|finds|note|notes|noted|observe|observes|observed|believe|believes|believed|teach|teaches|taught|propose|proposes|proposed|show|shows|showed|point|points|pointed|put|puts|offer|offers|offered|explain|explains|explained|reminds|reminded|says|said";
// [^\S\n] is a space that is not a line break, so a name never runs from one field into the next.
const NAME = "\\p{Lu}[\\p{L}'’.-]+(?:[^\\S\\n]+(?:van|von|de|der|du|la|le)?[^\\S\\n]*\\p{Lu}[\\p{L}'’.-]+)*";
const ATTRIBUTION = new RegExp(`(${NAME})(?:['’]s)?[^\\S\\n]+(?:${VERBS})\\b|[Aa]ccording to[^\\S\\n]+(${NAME})`, "gu");
const NOT_NAMES = new Set(
  "The This That These Those It Its You Your Yours Each Every Some Perhaps Maybe Here There When What Who Where How Why Shame Worth Activation Card Cards Together One Both His Her Their A An If And But Or So Yet Now Today Tomorrow Sometimes Often Many Most Few Such Being Naming Notice Noticing Ask Asking I We Our They He She Reading Spread Moments Moment".split(" "),
);

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const isText = (s) => typeof s === "string" && s.trim().length > 0;

/**
 * @param {unknown} r the parsed model output
 * @param {object[]} spread the four chosen cards (with engine notes), in reading order
 * @returns {string[]} problem categories
 */
export function checkReading(r, spread) {
  if (!r || typeof r !== "object") return ["shape"];
  const problems = new Set();

  const sections = Array.isArray(r.sections) ? r.sections : [];
  const actions = Array.isArray(r.actions) ? r.actions : [];
  if (!isText(r.title) || !isText(r.opening)) problems.add("shape");
  if (sections.length !== spread.length || sections.some((s, i) => !s || s.card_id !== spread[i].id || !isText(s.text))) {
    problems.add("sections");
  }
  if (actions.length !== 3 || actions.some((a) => !isText(a))) problems.add("actions");
  if (problems.size) return [...problems];

  if (actions.some((a) => words(a) >= MAX_ACTION_WORDS)) problems.add("action-length");
  // prompt_id is an ID, not reading text, so it is not checked here (lib/reading.js validates it).
  const fields = [r.title, r.opening, ...sections.map((s) => s.text), ...actions];
  if (fields.reduce((n, f) => n + words(f), 0) >= MAX_WORDS) problems.add("length");

  const all = fields.join("\n");
  if (QUOTES.test(all)) problems.add("quotes");
  if (MARKUP.test(all)) problems.add("markup");
  if (BANNED.some((re) => re.test(all))) problems.add("banned-word");

  // The chosen cards' own "avoid" phrases, unless the phrase is part of a chosen card's name
  // (The Shame Storm avoids "lighthouse", but The Lighthouse of Triumph may be in the same spread).
  const names = spread.map((c) => c.name.toLowerCase()).join(" | ");
  const lower = all.toLowerCase();
  for (const card of spread) {
    for (const raw of card.engine.avoid) {
      const phrase = raw.replace(/\s*\([^)]*\)\s*/g, " ").trim().toLowerCase();
      if (phrase && !names.includes(phrase) && new RegExp(`\\b${escape(phrase)}\\b`).test(lower)) problems.add("avoid-phrase");
    }
  }

  if (EXCLUDED.test(all)) problems.add("name");
  const surnames = new Set(APPROVED.flatMap((p) => p.surnames));
  const approvedWords = new Set(APPROVED.flatMap((p) => p.words));
  const cardWords = new Set(spread.flatMap((c) => c.name.split(/\s+/).map((w) => w.replace(/['’]s$/, ""))));
  for (const m of all.matchAll(ATTRIBUTION)) {
    const parts = (m[1] || m[2]).split(/\s+/).map((w) => w.replace(/['’]s$/, ""));
    if (surnames.has(parts[parts.length - 1])) continue;
    if (parts.every((w) => NOT_NAMES.has(w) || cardWords.has(w) || approvedWords.has(w) || /^(?:van|von|de|der|du|la|le)$/.test(w))) continue;
    problems.add("name");
  }
  const cited = APPROVED.filter((p) => p.surnames.some((s) => new RegExp(`(?<![\\p{L}])${escape(s)}(?![\\p{L}])`, "u").test(all)));
  if (cited.length > MAX_VOICES || cited.filter((p) => p.group === "research").length > MAX_RESEARCH_VOICES) {
    problems.add("attributions");
  }

  return [...problems];
}

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
