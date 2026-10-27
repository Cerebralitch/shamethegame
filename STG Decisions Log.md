# Shame: The Game — Decisions Log

One line per decision. Newest at the bottom. Once a decision is here, it is settled unless a new entry reverses it.

| Date | Decision | Reason |
|---|---|---|
| 2026-10-09 | Launch as a web app, not a native iOS/Android app | Faster, cheaper field testing |
| 2026-10-10 | Build with Claude Code only; retire the ChatGPT setup | One AI, one set of instructions |
| 2026-10-11 | Drop Jeffrey Kaufmann, Norma Purcell, Shameena Razack, Simon Moss from the expert list | Could not be verified as shame researchers |
| 2026-10-11 | Readings use attributed ideas only; no direct quotes | AI can fabricate quotes |
| 2026-10-11 | Racial Shame Quicksand uses Option A copy | Removes the burden from the person harmed |
| 2026-10-11 | Fresh claude.ai Project: "Shame: The Game v2" | Keep one current copy of each document |
| 2026-10-11 | Build the v2 deck for the web app | Field test digitally before printing; let feedback shape the physical deck |
| 2026-10-11 | Card IDs are permanent; names and copy can change | Art files, copy and app stay matched through renames |
| 2026-10-11 | shame-07 is named "The Divergent Mask" (supersedes "The Divergent Mind") | Matches the card's masking theme |
| 2026-10-11 | shame-10 is named "The Shipwreck Captain" | Paul's decision |
| 2026-10-11 | Keep "The Cracked Vessel" and "The Shadow of Financial Shame" (singular) | Names as printed on new art |
| 2026-10-11 | Shame card art received for all 12 cards | Art files saved by card ID |
| 2026-10-11 | Cracked Vessel art revised (art/shame-06.png replaced) | Seated figure no longer idealized; contrast with the standard behind him now carries the card |
| 2026-10-18 | Prototype layout is 1a | Paul's choice; closest to comps |
| 2026-10-18 | Prototype adds a Welcome screen and an About & Support page (Paul designing Monday Oct 19) | AI disclosure, not-therapy statement, route to human help |
| 2026-10-18 | Store and Library removed from the prototype | Neither works yet; no dead buttons |
| 2026-10-18 | Players choose cards; no shuffle-and-draw in the prototype | Draw is a new feature; Imposed Chain must never be dealt at random |
| 2026-10-18 | No free-text input in the prototype | Avoids crisis detection and stored sensitive data |
| 2026-10-18 | Readings returned as structured data, laid out by the app | Fixes raw markdown in readings |
| 2026-10-18 | Readings and card choices not stored or logged; feedback by outside form | Sensitive data, health-data laws, tester trust; testers may paste readings into the form voluntarily |
| 2026-10-22 | Splash screen (art/splash.png, 1290x2796) shows on open, then fades to a plainer Welcome screen with live text | Keeps the logo art intact; text stays readable |
| 2026-10-22 | Welcome assets received: welcome-bg.png (1290x2796), button-begin.png (1125x360, transparent); app adds a dark panel behind text and dims the button until the checkbox is ticked | Button stays a real, movable control; text stays readable |
| 2026-10-25 | App launches with the v1 deck: v1 card names and art, corrected copy (stg-cards-v1.1.json). Supersedes "Build the v2 deck for the web app" (2026-10-11) for the Oct 31 test and Nov 8 retreat | App matches the physical deck at the retreat; removes art from the critical path |
| 2026-10-25 | The seven v2-only Shame cards become the planned expansion (kept in stg-cards-v2.0.json) | Retreat feedback shapes them before printing |
| 2026-10-25 | v1 card files come with white backgrounds, like physical cards | Titles stay legible on the app's dark screens |
| 2026-10-25 | Public wording says "self-reflection grounded in research on shame"; never "clinical" | Protects the not-therapy position under Nevada AB 406 |
| 2026-10-25 | v1 Shame card files received (12); printed names confirmed: "The Mountain of Self-Doubt" (hyphen), "The Shadow of Financial Shame" (singular) | Names in the app match the printed cards |
| 2026-10-25 | v1 Worth card files received (8) | Art saved by card ID |
| 2026-10-25 | v1 Activation card files received (8) without the cream card background; preview composites them onto matching card stock as a stand-in until re-exported | Black titles are invisible on the app's dark screens without it |
| 2026-10-25 | Activation cards on cream card stock approved as is; no re-export | Paul's decision |
| 2026-10-25 | Shame Octopus re-exported; edge flaw fixed | Clean edges on dark screens |
| 2026-10-25 | Card copy v1.1 approved: all 28 cards, including the seven new Shame rewrites | Deck text frozen for the Oct 31 test |
| 2026-10-25 | Welcome AI disclosure reworded: "Made by a person, written with AI" (Welcome copy v0.2) | Credits Paul's authorship while keeping the AI disclosure clear |
| 2026-10-26 | The working preview (handoff/frontend/) is the design source of truth for Claude Code; the Claude Design 1a handoff is an older draft | 1a lacks the final art and screens; two conflicting sources were confusing the build |
| 2026-10-27 | "A Question for You" (Shame Prompts, shame_prompts.json v1.1) pulled forward into the Nov 6 build: one prompt per sitting, after a reading and on a new Reflect link | Paul's build brief; gives readings a reflective next step |
| 2026-10-27 | Shame Prompts are answered on paper: no text boxes. Taps only (SP-13's options, SP-08's card choice). Keeps "No free-text input in the prototype" (2026-10-18) intact | Avoids crisis detection and stored sensitive writing |
| 2026-10-27 | Nothing a player chooses in Shame Prompts is saved; the device remembers only the last prompt's ID and depth (for the no-two-deep-prompts-in-a-row rule). About's privacy line updated to say so (counsel to review) | Privacy on shared phones; About must stay accurate |
| 2026-10-27 | No counting of prompt opens or completions; learn whether testers use the button through the feedback form | Keeps "no analytics" (2026-10-18) |
| 2026-10-27 | SP-08 offers the player's two chosen Shame cards (and "Another card") as its answer choices | Players choose cards; there is no single drawn card |
| 2026-10-27 | SP-20 held back until its unlock rule is built; source notes are not shown to players and not fed to AI readings | Brief's out-of-scope list; source notes name people outside the approved list and use the word "therapy" |

## Parking lot

Ideas for later. Nothing here goes into the deck until it moves into the table above.

- Replace one or more Worth cards that feel opaque (Paul, 2026-10-11; which ones TBD)
- Separate framing for majority-group racial reckoning (knowledge base gap; currently routed to shame-10)
- "Shame Prompts" button: static designed cards with reflection questions (e.g. "Where do you feel shame in your body?") (Paul, 2026-10-18; planned revision, after Nov 7 unless pulled forward)
