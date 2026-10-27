// GET /api/cards: the visible deck for the browser (id, type, name, copy, status). Engine notes stay on the server.
import { publicCards, SPREAD } from "../lib/deck.js";

export function GET() {
  return Response.json(
    { spread: SPREAD, cards: publicCards },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
