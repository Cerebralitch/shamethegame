import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkReading } from "../lib/check.js";
import { publicCards } from "../lib/deck.js";
import { takeReading } from "../lib/rate-limit.js";
import { createReading, resolveSpread } from "../lib/reading.js";

const spread = resolveSpread(["worth-08", "shame-13", "shame-16", "activation-06"]);

const good = () => ({
  title: "Light Through Changing Weather",
  opening: "These cards share a thread of noticing what is hard to see in the moment. Perhaps the work here is to mark the way through, not to calm every sea.",
  sections: [
    { card_id: "worth-08", text: "The Lighthouse of Triumph may invite you to keep a small marker of something you have already come through, a reminder you can hold when the water gets rough." },
    { card_id: "shame-13", text: "The Chameleon of Emotions suggests shame can take the color of whatever is nearby. You might ask what might be underneath the feeling that is easiest to see." },
    { card_id: "shame-16", text: "The Shame Storm can arrive suddenly. Some people find that recognizing a storm while it is happening makes it a little easier to wait for it to pass." },
    { card_id: "activation-06", text: "The Broken Trust points to a moment when someone let you down. Kristin Neff describes self-compassion as kindness toward yourself when struggle comes." },
  ],
  actions: [
    "Write two lines about a hard stretch you have already come through.",
    "Next time a strong feeling arrives, pause and ask what color it has taken on.",
    "Notice one person whose response to you this week felt steady and safe.",
  ],
  carry: "Which feeling of yours arrives in disguise most often, and what would it say without the costume?",
});

const mutate = (fn) => { const r = good(); fn(r); return checkReading(r, spread); };

test("a well-formed reading passes", () => {
  assert.deepEqual(checkReading(good(), spread), []);
});

test("structure: four sections in reading order and exactly three actions", () => {
  assert.ok(mutate((r) => r.sections.pop()).includes("sections"));
  assert.ok(mutate((r) => r.sections.reverse()).includes("sections"));
  assert.ok(mutate((r) => r.actions.push("A fourth action.")).includes("actions"));
  assert.ok(mutate((r) => { r.title = " "; }).includes("shape"));
  assert.ok(mutate((r) => { delete r.carry; }).includes("shape"));
  assert.deepEqual(checkReading(null, spread), ["shape"]);
});

test("length: whole reading under 350 words, actions and the carry question under 25 words", () => {
  const total = (r) => [r.title, r.opening, ...r.sections.map((s) => s.text), ...r.actions, r.carry].join(" ").split(/\s+/).length;
  const pad = (r, n) => { r.opening += " word".repeat(n - total(r)); };
  assert.deepEqual(mutate((r) => pad(r, 349)), []);
  assert.ok(mutate((r) => pad(r, 350)).includes("length"));
  assert.ok(mutate((r) => { r.carry = "Why ".repeat(25).trim() + "?"; }).includes("carry-length"));
  assert.ok(mutate((r) => { r.carry = "Think about who taught you that."; }).includes("carry-question"));
  assert.ok(mutate((r) => { r.carry = "What did “enough” mean in your house?"; }).includes("quotes"));
  assert.ok(mutate((r) => { r.actions[0] = "word ".repeat(25); }).includes("action-length"));
});

test("banned words, statistics, quotation marks and markup are rejected", () => {
  for (const bad of ["This is a kind of therapy.", "Healing takes time.", "Research shows this works.", "About 40% of people feel this.", "A counselor might help."]) {
    assert.ok(mutate((r) => { r.opening = bad; }).includes("banned-word"), bad);
  }
  assert.ok(mutate((r) => { r.opening = "As someone said, “be kind.”"; }).includes("quotes"));
  assert.ok(mutate((r) => { r.title = "# Your Reading"; }).includes("markup"));
  assert.ok(mutate((r) => { r.actions[0] = "- Try this."; }).includes("markup"));
  // Words that merely contain a banned stem are fine.
  assert.deepEqual(mutate((r) => { r.opening = "A healthy and secure sense of curiosity can help."; }), []);
});

test("each chosen card's avoid phrases are rejected, unless the phrase is a chosen card's name", () => {
  assert.ok(mutate((r) => { r.sections[2].text = "When the storm comes, just breathe and wait it out."; }).includes("avoid-phrase"));
  // The Shame Storm avoids "lighthouse", but The Lighthouse of Triumph is in this spread, so its name is allowed.
  assert.deepEqual(checkReading(good(), spread), []);
});

test("only approved voices: up to three, at most one research voice", () => {
  assert.ok(mutate((r) => { r.opening = "John Bradshaw wrote about toxic shame."; }).includes("name"));
  assert.ok(mutate((r) => { r.opening = "Carl Rogers suggests acceptance comes first."; }).includes("name"));
  assert.ok(mutate((r) => { r.opening = "According to Alain de Botton, status matters."; }).includes("name"));
  assert.deepEqual(mutate((r) => { r.opening = "June Tangney's idea is that shame focuses on the whole self."; r.sections[3].text = "Someone let you down."; }), []);
  // Two research voices (Neff is already in the reading) is one too many.
  assert.ok(mutate((r) => { r.opening = "June Tangney's work distinguishes shame from guilt."; }).includes("attributions"));
  // One research voice plus two perspective voices is allowed; a third perspective voice makes four.
  assert.deepEqual(mutate((r) => { r.opening = "Søren Kierkegaard wrote about despair, and Epictetus noted our judgments."; }), []);
  assert.ok(mutate((r) => { r.opening = "Kierkegaard wrote about despair, Epictetus about judgment, and Rumi about guests."; }).includes("attributions"));
  // Carl Jung is approved from v0.3; a listed work may be named.
  assert.deepEqual(mutate((r) => { r.sections[1].text = "Carl Jung described the shadow, the parts we disown."; r.sections[3].text = "Someone let you down."; }), []);
  assert.deepEqual(mutate((r) => { r.opening = "The Waste Land offers an image of gathering fragments."; }), []);
  // Card names followed by a verb are not people.
  assert.deepEqual(mutate((r) => { r.sections[0].text = "The Lighthouse of Triumph suggests a small marker you can hold."; }), []);
});

test("resolveSpread accepts only a valid spread in reading order", () => {
  assert.ok(spread);
  assert.equal(resolveSpread(["shame-13", "worth-08", "shame-16", "activation-06"]), null);
  assert.equal(resolveSpread(["worth-08", "shame-13", "shame-13", "activation-06"]), null);
  assert.equal(resolveSpread(["worth-08", "shame-13", "shame-99", "activation-06"]), null);
  assert.equal(resolveSpread("worth-08"), null);
});

test("createReading regenerates once, then gives up", async () => {
  let calls = 0;
  const bad = { ...good(), opening: "Healing is near." };
  const flaky = async () => (++calls === 1 ? bad : good());
  assert.ok((await createReading(spread, flaky)).reading);
  assert.equal(calls, 2);

  calls = 0;
  const alwaysBad = async () => { calls++; return bad; };
  assert.deepEqual(await createReading(spread, alwaysBad), { problems: ["banned-word"] });
  assert.equal(calls, 2);
});

test("the browser's deck has no engine notes", () => {
  assert.equal(publicCards.length, 28);
  assert.ok(publicCards.every((c) => !("engine" in c)));
});

test("rate limit: 20 readings per hour per visitor", () => {
  const req = (ip) => new Request("http://x/api/reading", { headers: { "x-forwarded-for": ip } });
  const t = 1_000_000;
  for (let i = 0; i < 20; i++) assert.equal(takeReading(req("203.0.113.9"), t + i), 0);
  assert.ok(takeReading(req("203.0.113.9"), t + 100) > 0);
  assert.equal(takeReading(req("198.51.100.4"), t + 100), 0);
  assert.equal(takeReading(req("203.0.113.9"), t + 60 * 60 * 1000 + 1), 0);
});

test("a 400 on the fallback request is retried once without fallbacks, then fallbacks stay off", async () => {
  const { generate } = await import("../lib/reading.js");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const calls = [];
  const ok = { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(good()) }] };
  const fake = {
    beta: { messages: { create: async (p) => { calls.push(["beta", p]);
      throw new Anthropic.BadRequestError(400, { type: "error", error: { type: "invalid_request_error", message: "fallbacks: not allowed" } }, "fallbacks: not allowed", new Headers()); } } },
    messages: { create: async (p) => { calls.push(["plain", p]); return ok; } },
  };
  assert.deepEqual(await generate(spread, [], fake), good());
  assert.deepEqual(calls.map((c) => c[0]), ["beta", "plain"]);
  const plain = calls[1][1];
  assert.equal(plain.model, "claude-sonnet-5-5");
  assert.ok(!("fallbacks" in plain) && !("betas" in plain));
  assert.equal(plain.output_config.format.type, "json_schema");
  // Later calls on this instance skip the rejected beta request.
  await generate(spread, [], fake);
  assert.deepEqual(calls.map((c) => c[0]), ["beta", "plain", "plain"]);
});

test("other API errors are not swallowed, and refusals return null", async () => {
  const { generate } = await import("../lib/reading.js");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const err = new Anthropic.AuthenticationError(401, { type: "error", error: { type: "authentication_error", message: "bad key" } }, "bad key", new Headers());
  await assert.rejects(generate(spread, [], { beta: { messages: { create: async () => { throw err; } } }, messages: { create: async () => { throw err; } } }), Anthropic.AuthenticationError);
  const refusal = { stop_reason: "refusal", content: [] };
  assert.equal(await generate(spread, [], { beta: { messages: { create: async () => refusal } }, messages: { create: async () => refusal } }), null);
});

test("logged API errors never contain card IDs or names", async () => {
  const { scrub } = await import("../lib/reading.js");
  const out = scrub("output_config.format.schema: enum [worth-08, shame-13] invalid near The Shame Storm");
  assert.ok(!/worth-08|shame-13|Shame Storm/.test(out), out);
});

test("the voice example in the reading instructions passes every check", () => {
  const doc = readFileSync(new URL("../stg-reading-instructions-v0.3.md", import.meta.url), "utf8");
  const json = doc.slice(doc.indexOf("### An example of the voice")).match(/```json\n([\s\S]*?)```/)[1];
  const example = JSON.parse(json);
  const exampleSpread = resolveSpread(example.sections.map((s) => s.card_id));
  assert.ok(exampleSpread);
  assert.deepEqual(checkReading(example, exampleSpread), []);
});

test("the retry tells the model which rules the first draft broke, without the draft", async () => {
  const seen = [];
  const gen = async (sp, problems) => { seen.push(problems); return seen.length === 1 ? { ...good(), opening: "word ".repeat(400) } : good(); };
  assert.ok((await createReading(spread, gen)).reading);
  assert.deepEqual(seen, [[], ["length"]]);

  const { retryNote } = await import("../lib/reading.js");
  assert.equal(retryNote([]), "");
  const note = retryNote(["length", "attributions"]);
  assert.match(note, /under 350 words/);
  assert.match(note, /at most one from the research list/);
});

test("the retry note reaches the model in the user message", async () => {
  const { generate } = await import("../lib/reading.js");
  let sent;
  const ok = { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(good()) }] };
  const fake = { beta: { messages: { create: async (p) => { sent = p; return ok; } } }, messages: { create: async (p) => { sent = p; return ok; } } };
  await generate(spread, ["attributions"], fake);
  assert.match(sent.messages[0].content, /The Lighthouse of Triumph[\s\S]*rejected by the app's automatic checks[\s\S]*research list/);
});
