# Shame: The Game

A mobile web app: choose four cards (two Shame, one Worth, one Activation) and receive a short AI-written reading.
Start with `START-HERE-first-prompt.md` for the project brief and documents.

## How it is put together

| Path | What it is |
| --- | --- |
| `frontend/` | The app people see: `index.html`, card art in `img/`, fonts in `fonts/`. The design source of truth. |
| `api/cards.js` | Sends the browser the visible cards from `stg-cards-v1.1.json` (no engine notes). |
| `api/reading.js` | Receives four card IDs and returns a checked reading. Holds the only use of the API key. |
| `lib/` | Server code: deck loading, prompt building, reading checks, usage limit. |
| `test/` | Automated checks for the server code (`npm test`). |
| `stg-cards-v1.1.json` | The deck. Edit names, copy or `status` here; no code changes needed. |
| `stg-reading-instructions-v0.3.md` | The reading prompt. Everything under "## Instructions" is sent to the model. Its two tables of voices (research and perspective) are also the list the server checks names against. |

## Run it on your computer

Needs Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # then paste your Anthropic API key after ANTHROPIC_API_KEY=
npm run dev               # open http://localhost:3000
npm test                  # run the server checks
```

## Privacy rules the code follows

- The browser sends only four card IDs. The prompt is built on the server.
- Card choices and readings are never stored or logged. When a reading fails its checks, only the kind of problem is logged (for example `banned-word`).
- The usage limit (20 readings per visitor per hour) is kept in memory only, keyed by a salted hash of the visitor's address, and is never stored with card choices.
- Fonts are served with the app, so no third-party requests are made.
