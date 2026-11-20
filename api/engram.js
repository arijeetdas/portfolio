/**
 * Vercel Serverless Function — POST /api/engram
 *
 * Vercel only deploys server code that lives in the root `api/` folder for a
 * non-Next.js project. The old `app/api/engram/route.ts` was a Next.js App Router
 * file, so on the live site this endpoint returned 404 and the chat always fell
 * back to local mode.
 *
 * Requires the GEMINI_API_KEY environment variable in Vercel project settings.
 * Optional: GEMINI_MODEL (comma-separated list to override the model chain).
 */

const { handleEngramRequest } = require("../lib/engram-core.cjs");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: "Invalid JSON body", code: "BAD_REQUEST" });
      return;
    }
  }

  const result = await handleEngramRequest(body || {}, {
    log: (line) => console.log(`[engram] ${line}`)
  });
  res.status(result.status).json(result.body);
};
