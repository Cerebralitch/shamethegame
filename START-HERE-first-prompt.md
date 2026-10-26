# First message to paste into Claude Code

I'm building a mobile web app called Shame: The Game. I'm not a developer, so please explain each step in plain language and ask before doing anything that costs money or can't be undone.

This folder holds everything for the build:
- `STG Prototype Scope and Dev Spec v0.1 2026-10-18.md` is the plan. Follow it. Screens S0–S5 only; anything on its "later" list is out of scope.
- `stg-cards-v1.1.json` is the approved deck (28 cards). The app reads card names and copy from this file; never retype them into code.
- `cards/` holds the 28 full-resolution card masters, named by card ID. The web-ready versions (cropped, WebP) are already in `frontend/img/cards/`; use those.
- `splash.png`, `welcome-bg.png` and `button-begin.png` are full-resolution masters; web-ready WebP versions are in `frontend/img/`.
- `stg-reading-instructions-v0.2.md` is the AI reading prompt. The server sends it with the four chosen cards' data and expects the JSON format it describes.
- `STG Welcome and Support Copy v0.2 2026-10-25.md` is the final text for the Welcome screen, About & Support page and the line under every reading.
- `STG Decisions Log.md` records decisions already made. Don't reopen them.

**`frontend/` is the design source of truth.** It is a working front end: `frontend/index.html` already has the splash, Welcome, spread builder, card info sheet, reading screen and About & Support, using the final optimized art in `frontend/img/` and the approved card copy. Open it in a browser to see exactly how the app should look and behave. Build the app from it: keep its layout, styling, art and copy, and add the server, the AI reading and the reading layout to it.

If a Claude Design "1a" handoff is also in this session, treat it as an older draft. Where it differs from `frontend/` (art, card names, screens, styling), `frontend/` wins.

Non-negotiables:
1. The Anthropic API key lives only on the server. The browser sends only four card IDs.
2. Nothing about readings or card choices is stored or logged.
3. Every reading is checked on the server (under 300 words, four sections, three actions, no banned words, only approved names) before it's shown.

Goal for this first session: get the app running so I can open it on my own phone, with real readings working. Start by opening `frontend/index.html`, then read these files and telling me your plan in a short list before you write any code.
