/**
 * dev-server.cjs — local development server.
 *
 *   /                 static portfolio (same files Vercel serves)
 *   POST /api/engram  Gemini proxy (same code as the Vercel function in api/engram.js)
 *   /admin            Knowledge Studio — edit content, files and AI knowledge (localhost only)
 *
 * The Gemini key is read from the environment or the local .env file and never
 * reaches the browser.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 5173);

/* ---------------------------------------------------------------- .env */
function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    let content;
    try { content = fs.readFileSync(path.join(root, name), "utf-8"); } catch { continue; }
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}
loadDotEnv();

const { buildKnowledge } = require("./scripts/build-knowledge.cjs");
const { handleEngramRequest, resolveModels, resolveApiKey } = require("./lib/engram-core.cjs");
// The Knowledge Studio lives in admin/, which is local-only (git-ignored).
// A fresh clone without it still runs; /admin just isn't available.
let handleAdmin = async () => false;
try {
  ({ handleAdmin } = require("./admin/server.cjs"));
} catch (err) {
  if (err.code !== "MODULE_NOT_FOUND") throw err;
}

/* ------------------------------------------------------------ static */
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2"
};

/** Paths the static server must never expose (secrets, tooling, sources). */
const BLOCKED = [/(^|\/)\./, /^\/node_modules\//, /^\/content\//, /^\/scripts\//, /^\/lib\//, /^\/api\//, /\.cjs$/, /^\/package(-lock)?\.json$/];

function serveStatic(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname); } catch { pathname = ""; }
  const file = path.normalize(path.join(root, pathname));

  if (!pathname || !file.startsWith(root + path.sep) || BLOCKED.some((re) => re.test(pathname.replace(/\\/g, "/")))) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      // data/ changes whenever the Studio saves; never let the browser cache it.
      "Cache-Control": pathname.startsWith("/data/") ? "no-store" : "no-cache"
    });
    res.end(data);
  });
}

function readJsonBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > limit) { reject(new Error("Body too large")); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

/* ------------------------------------------------------------ server */
http
  .createServer(async (req, res) => {
    if (await handleAdmin(req, res)) return;

    if (req.url.split("?")[0] === "/api/engram") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" });
        res.end();
        return;
      }
      if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json", Allow: "POST" });
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      const started = Date.now();
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message, code: "BAD_REQUEST" }));
        return;
      }
      const result = await handleEngramRequest(body, {
        freshKnowledge: true,
        log: (line) => console.log(`[engram] ${line}`)
      });
      console.log(`[engram] ${result.status} in ${Date.now() - started}ms${result.body.model ? ` via ${result.body.model}` : ""} — "${String(body.message || "").slice(0, 60)}"`);
      res.writeHead(result.status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
      res.end(JSON.stringify(result.body));
      return;
    }

    serveStatic(req, res);
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Portfolio preview:  http://localhost:${port}`);
    if (fs.existsSync(path.join(root, "admin", "server.cjs"))) console.log(`Knowledge Studio:   http://localhost:${port}/admin   (this computer only)`);
    console.log(`Engram API:         http://localhost:${port}/api/engram`);

    const build = buildKnowledge();
    if (build.ok) console.log(`✅ Knowledge built: ${build.stats.categories} categories, ${build.stats.notes} notes, ${build.stats.documents} documents`);
    else console.error("❌ Knowledge build failed:\n  - " + build.errors.join("\n  - "));

    if (resolveApiKey()) console.log(`✅ GEMINI_API_KEY present · models: ${resolveModels().join(" → ")}`);
    else console.warn("⚠️  GEMINI_API_KEY missing — chat will use the local fallback. Add it to .env");
  });
