# Shame: The Game — Prototype Scope and Dev Spec

Version 0.1 · 2026-10-18 · Working document for today's app block (11:00–1:30)
Status: pre-filled for review. Nothing below is frozen until Paul confirms it in the block.

**Target:** 3–5 testers using this on their phones by Oct 31. Top-3 fixes by Nov 3. Final build Nov 6.
**Rule for the next two weeks:** if it is not listed in Sections 1–3, it is not built before Nov 7.

---

## Step 1 · Freeze the layout (20 min)

**Layout: 1a** (full card matrix, info sheet, one long scroll), as generated in Claude Design.

**Screens 1a implies, plus the ones the field test needs:**

| # | Screen | Source | What it is |
|---|---|---|---|
| S0 | Splash | **Added** 2026-10-22 | Full-screen logo art (`splash.webp`, 1290 × 2796) for about 2 seconds on open, then fades to Welcome (or Spread builder after first visit). Tap to skip. No fade animation if the phone's reduce-motion setting is on. |
| S1 | Welcome | **Added**, not in 1a | One screen on first open: what this is and is not, AI disclosure, 18+, privacy in one line, link to support. One "Begin" button. |
| S2 | Spread builder | 1a | Spread rail at top (Worth · Shame · Shame · Activation). Below: Step 1 Shame carousel (choose two), Step 2 Worth (choose one), Step 3 Activation (choose one). "Read my cards" button appears when all four slots are filled. |
| S3 | Card info sheet | 1a | Slides up when a card is tapped: art, name, type, card copy, "Choose this card" / "Remove". |
| S4 | Reading | 1a | The four chosen cards, the AI reading, a standing support line, and two actions: Share, New reading. |
| S5 | About & Support | Replaces 1a's FAQ tab | Static page: what the game is, "not therapy" statement, how readings are made (AI, attributed ideas only), privacy, 988 and other help, feedback link. |

**Why S1 and S5 are the exceptions:** you are putting AI-generated readings about shame in front of real people. Nevada AB 406 turns on not presenting this as professional care, and testers need a visible route to human help. Both screens are static text, not features.

**Bottom bar in 1a:** Store and Library come out for the prototype. FAQ becomes "About." No dead buttons.

**Confirm in block:**
- [ ] 1a is final for the prototype
- [ ] Screens S1–S5 are the complete list
- [ ] Store and Library tabs removed; FAQ becomes About & Support

---

## Step 2 · Core flows (30 min)

Four flows. A first-time tester must be able to finish each one with no help.

**F1 · First open**
Open the link → Welcome screen → tap Begin → spread builder.
*Works when:* a tester who has never heard of the game understands, in under a minute, that this is a self-reflection tool using AI, not therapy, and reaches the spread builder.

**F2 · Build a spread**
Swipe the Shame carousel → tap a card → read its info sheet → choose it → it flies into the next open slot → repeat until two Shame, one Worth, one Activation are chosen. Tapping a filled slot reopens it; choosing in a full group swaps.
*Works when:* a tester fills all four slots with the cards they intended, on a phone, and can change their mind without getting stuck.

**F3 · Receive a reading**
Tap "Read my cards" → a calm loading state → the reading appears.
*Works when:* within about 20 seconds the reading shows, formatted (no stray symbols), under 300 words, one section per chosen card, three closing actions, and the support line. If the AI fails, the tester sees a plain message and a retry button, not an error code.

**F4 · After the reading**
Share opens the phone's own share sheet with the reading as text. New reading clears the spread and returns to the top.
*Works when:* both buttons do exactly that, and nothing about the reading is kept on a server.

> **One change from your example flow:** you wrote "draw a card." The prototype has players *choose* four cards, not draw them. I'd keep choose-only for the field test: shuffle-and-draw is a new feature, and the Imposed Chain must never be dealt at random. Draw mode goes on the later list.

**Later list (not built before Nov 7):**
- Shuffle-and-draw mode
- "Shame Prompts" button: static designed cards with reflection questions (Paul's planned revision)
- A text box for players to describe their situation (this is the big one: it would require a crisis-detection layer and turns readings into stored sensitive data)
- Accounts and login; saved readings and the Library
- Store and payments
- Print; shareable links or images of readings
- Analytics of any kind
- Installing to the home screen as an app
- Replacing any Worth cards; title-free art; unifying the art style across the deck
- Philosophers and artists as attributions in readings
- Physical deck; expansion packs; other languages

**Confirm in block:**
- [ ] F1–F4 are the complete core flows
- [ ] Choose-only for the prototype; draw mode is later
- [ ] No free-text input for the prototype
- [ ] Later list accepted as written (add to it, don't pull from it)

---

## Step 3 · Dev spec (45 min)

This section is written for Claude Code. Hand it over with the card data file and the reading instructions.

### 3.1 Architecture

- A mobile-first web app, built from the Claude Design 1a export.
- One server function, `POST /api/reading`, holds the Anthropic API key. **The browser never sees the key and never sends prompt text.** It sends only four card IDs; the server builds the prompt.
- Hosting: any host with server functions (Vercel is fine). Unlisted URL for testers; no login.
- Cost guardrails: a monthly spending limit set in the Anthropic Console; a simple rate limit on the endpoint (for example, 20 readings per hour per visitor).

### 3.2 Screen-by-screen data

| Screen | Needs | Sends / stores |
|---|---|---|
| S1 Welcome | Static copy | Remembers on the device only that Welcome was seen, so it shows once. If the device can't remember, show it again. |
| S2 Spread builder | All 28 cards: `id`, `type`, `name`, `art`; spread rules (2 Shame, 1 Worth, 1 Activation) | Current selection held in memory only |
| S3 Info sheet | One card: `name`, `type`, `copy`, `art` | Nothing |
| S4 Reading | Four chosen card IDs; the reading returned by the server | Sends the four IDs to `/api/reading`. Keeps the reading in memory only. |
| S5 About & Support | Static copy | Nothing |

### 3.3 Card data

- Source of truth: **`stg-cards-v1.1.json`** (v1 names and art, corrected copy; changed from the v2 deck on 2026-10-25). The app reads this file; it is never retyped into code.
- The browser needs only `id`, `type`, `name`, `copy`, `status`. The `engine` fields (evidence, must-not rules, phrases to prefer and avoid) are used **only by the server** when building the prompt.
- Card IDs are permanent (`shame-01` … `activation-08`). Names and copy can change in the file without touching code.
- Any card whose `status` is not `draft`, `review`, `approved` or `locked` is hidden. (This lets you pull a card from the test by editing one field.)

### 3.4 Card art slots

- **Fixed slot shape:** the v1 card's own proportions, 827 wide by 1427 tall (about 4:7, standard tarot). Crop each file to the card edge (35 px in from each side of the 897 × 1497 export). *(Updated 2026-10-25; was 3:5.)* Every card face, thumbnail and spread slot uses this shape. Art is scaled to fit, never stretched.
- **File naming:** `/public/cards/{id}.webp` (for example `/public/cards/shame-07.webp`). The app finds art by ID; there is no list of filenames to maintain.
- **Recommended size for web:** 1200 × 2000 pixels. Your current previews (897 × 1497) work for the test but will look soft full-screen.
- **Missing art:** if a file is absent, the app draws a placeholder in the same slot: dark card, the card's name, its type. **Dropping in a correctly named file replaces the placeholder with no code change.**
- **Current state (2026-10-25):** v1 card files with white backgrounds are coming from Paul for all 28 cards. Check their shape against the 3:5 slot when they arrive.
- Titles are baked into the current art, so the info sheet will show the name twice (on the art and as text). Acceptable for the prototype.

### 3.5 AI readings

Full instructions: **`stg-reading-instructions-v0.2.md`**. The rules that matter for the build:

- **Model:** a current Claude Sonnet model (for example `claude-sonnet-5-5`); confirm the exact name at build time.
- **Input to the model:** the reading instructions plus the four chosen cards' name, type, copy and engine notes. Nothing from the player except their choice of cards.
- **Output:** structured data, not free-form markdown: `title`, `opening`, one `section` per card, exactly three `actions`. The app lays it out. This is what fixes the raw "# Your Reading" seen in the prototype.
- **Attributions:** attributed ideas only, from the approved list inside the instructions. No quotation marks, no statistics, no "research shows." Experts dropped on 2026-10-11 and anyone not on the list are excluded.
- **Server checks before showing a reading:** total under 300 words; exactly four card sections and three actions; no banned words (therapy, therapist, treatment, diagnosis, cure, heal, "research shows", "studies prove"); no quotation marks around attributed ideas; no names outside the approved list. On failure, regenerate once; on a second failure, show the retry message.
- **Support line** (shown by the app under every reading, not written by the AI): *"This reading is AI-generated reflection, not therapy. If something here stirred up more than you expected, you can call, text or chat 988 anytime. It's free and confidential."* Full Welcome and About copy: `STG Welcome and Support Copy v0.2 2026-10-25.md`.
- **Readings are not stored.** Server logs must not record which cards were chosen or what the reading said.

### 3.6 Feedback

Testers give feedback through an outside form (a link on the About page and under each reading). No analytics in the app. **Paul to create the form.**

**Confirm in block:**
- [ ] Readings returned as structured data
- [ ] Readings and card choices not stored or logged
- [ ] Support line wording
- [ ] Feedback by outside form

---

## Step 4 · Audit of the current build (30 min)

**What was audited:** the 1a prototype in Claude Design, from the screenshot and its description. No exported code exists yet. Confirm anything marked "unknown" by tapping through 1a during the block.

| Flow | Status | What's there | What's missing |
|---|---|---|---|
| F1 First open | **Missing** | — | Welcome screen; About & Support page |
| F2 Build a spread | **Works in prototype** | Carousel, info sheet, choose, fly-to-slot, glowing next slot, tap-to-remove, swap when full, auto-advance | Uses the **v1 deck** (Chameleon, Invisible Chain…), not v2; real art not connected |
| F3 Receive a reading | **Partly works** | Live reading runs, but only inside Claude Design | Server function with hidden key; new reading instructions; structured output; length limit (prototype runs well over 300 words); loading and error states (unknown) |
| F4 After the reading | **Partly works** | "New reading" button; Share and Print icons | Share wired to the phone's share sheet (unknown if it works); Print removed; Store and Library tabs removed |
| All flows | **Missing** | — | Not on a URL a tester can open on a phone |

### Ranked build list

**For Wed Oct 21 — first core flow working (F2 → F3 on a real phone):**
1. Export 1a from Claude Design and hand off to Claude Code. *(Also protects you: this version of Claude Design closes Dec 14.)*
2. Deploy the export to a live URL and open it on your own phone.
3. Swap the prototype's v1 card text for `stg-cards-v1.1.json` (same cards, corrected copy); add art slots; drop in the v1 card files.
4. Build `/api/reading` with the new instructions and structured output; render the reading on S4.

**For the Oct 24 sprint — the other flows and the safety net:**
5. Server checks on every reading (length, structure, banned words, approved names), with retry.
6. Welcome screen (S1) and About & Support page (S5); support line under every reading.
7. Share via the phone's share sheet; New reading; remove Print, Store and Library.
8. Loading and error states; test on an iPhone (Safari) and an Android phone (Chrome).

**Oct 25–30:** you, then one trusted person, run all four flows cold. Fix only what blocks a flow. Invite testers Oct 31.

---

## Decisions to log after the block

Add these to the decisions log once confirmed:

- Prototype layout is 1a
- Prototype screens are S1–S5 only; Store and Library removed
- Choose-only; draw mode is later
- No free-text input in the prototype
- Readings returned as structured data; not stored or logged
- Feedback by outside form; no analytics
