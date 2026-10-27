import { test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../api/prompts.js";
import { closingFor, eligible, pickPrompt } from "../frontend/js/prompt-rules.js";

const data = await GET().json();
const byId = Object.fromEntries([...data.prompts, ...data.grounding].map((p) => [p.id, p]));
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

test("the browser gets prompts without source notes, origin or language rules", () => {
  assert.equal(data.prompts.length, 21);
  assert.ok(data.prompts.every((p) => !("source_note" in p) && !("origin" in p)));
  assert.ok(!("language_rules" in data.session_rules));
  assert.equal(data.button_label, "A Question for You");
});

test("SP-20 is never offered until its unlock rule is built", () => {
  assert.ok(!eligible(data, null).some((p) => p.id === "SP-20"));
  for (let i = 0; i < 50; i++) {
    for (const entry of ["reading", "tab"]) assert.notEqual(pickPrompt(data, entry, { rand: Math.random })?.id, "SP-20");
  }
});

test("after a reading: SP-08 first, then a depth-1 prompt once SP-08 was used this visit", () => {
  const shameCards = ["shame-13", "shame-14"];
  assert.equal(pickPrompt(data, "reading", { shameCards }).id, "SP-08");
  const used = new Set(["SP-08"]);
  for (let i = 0; i < 30; i++) {
    const p = pickPrompt(data, "reading", { shameCards, usedThisVisit: used, rand: Math.random });
    assert.equal(p.depth, 1);
    assert.notEqual(p.id, "SP-08");
  }
});

test("Reflect tab: SP-08 if there was a reading this visit, else the last lens, else random depth 1", () => {
  assert.equal(pickPrompt(data, "tab", { shameCards: ["shame-13", "shame-14"] }).id, "SP-08");
  const last = { id: "SP-13", depth: 1 }; // Defensive lens
  for (let i = 0; i < 30; i++) {
    const p = pickPrompt(data, "tab", { last, rand: Math.random });
    assert.equal(p.lens, "Defensive");
    assert.notEqual(p.id, "SP-13");
  }
  for (let i = 0; i < 30; i++) {
    const p = pickPrompt(data, "tab", { rand: Math.random });
    assert.equal(p.depth, 1);
    assert.notEqual(p.id, "SP-08"); // no cards to point at
  }
});

test("never two depth-3 prompts back to back across sessions", () => {
  const last = { id: "SP-10", depth: 3 }; // Disclosure lens: SP-10 is its only prompt
  assert.ok(eligible(data, last).every((p) => p.depth !== 3));
  // SP-17 (Origin, depth 3) after a depth-3 prompt: the Origin lens falls back to SP-12 (depth 2).
  for (let i = 0; i < 30; i++) {
    const p = pickPrompt(data, "tab", { last: { id: "SP-17", depth: 3 }, rand: Math.random });
    assert.notEqual(p.depth, 3);
  }
});

test("closings: required at depth 2 and 3, never the prompt itself, kept light after depth 3", () => {
  assert.equal(closingFor(data, byId["SP-01"]), null); // depth 1
  for (let i = 0; i < 30; i++) {
    assert.ok(["SP-18", "SP-21", "GROUND-01"].includes(closingFor(data, byId["SP-02"], Math.random).id));
    assert.notEqual(closingFor(data, byId["SP-18"], Math.random).id, "SP-18");
    assert.ok(["SP-21", "GROUND-01"].includes(closingFor(data, byId["SP-10"], Math.random).id));
  }
  // SP-20 always leads to SP-21 (for when it is unlocked).
  assert.equal(closingFor(data, { id: "SP-20", depth: 3, requires_followup_id: "SP-21" }).id, "SP-21");
});

test("selection is deterministic for a given random source", () => {
  const a = pickPrompt(data, "tab", { rand: seq(0.1) }).id;
  assert.equal(pickPrompt(data, "tab", { rand: seq(0.1) }).id, a);
});
