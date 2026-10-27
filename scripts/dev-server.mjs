// Local preview: serves frontend/ and the /api functions the same way Vercel does.
// Run with `npm run dev`. Set ANTHROPIC_API_KEY in your shell (or .env) for real readings.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

try { process.loadEnvFile?.(".env"); } catch { /* no .env file */ }

const ROOT = fileURLToPath(new URL("../frontend/", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".woff2": "font/woff2", ".css": "text/css", ".js": "text/javascript", ".txt": "text/plain" };
const API = { "/api/cards": () => import("../api/cards.js"), "/api/reading": () => import("../api/reading.js") };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (API[url.pathname]) {
      const handler = (await API[url.pathname]())[req.method];
      if (!handler) return send(res, new Response(null, { status: 405 }));
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks);
      return send(res, await handler(new Request(url, { method: req.method, headers: req.headers, body })));
    }
    let path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!path.startsWith(ROOT)) return send(res, new Response(null, { status: 403 }));
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, "index.html");
    const data = await readFile(path).catch(() => null);
    if (!data) return send(res, new Response("Not found", { status: 404 }));
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" }).end(data);
  } catch (e) {
    console.error(e);
    send(res, new Response("Server error", { status: 500 }));
  }
}).listen(PORT, () => console.log(`Shame: The Game running at http://localhost:${PORT}`));

async function send(res, response) {
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}
