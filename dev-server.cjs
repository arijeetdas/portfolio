/**
 * dev-server.cjs — Portfolio Development Server
 *
 * Serves static files from the project root AND provides a secure server-side
 * proxy endpoint for the Gemini AI API (/api/engram). The API key never leaves
 * the server. All existing static file serving is untouched.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.env.PORT || 5173);

/* --------------------------------------------------------------------------
   READ LOCAL .env FILE MANUALLY (dotenv not installed)
   - Vercel environment variables take precedence
   - local development falls back to the root .env file only
   -------------------------------------------------------------------------- */
function loadDotEnv() {
  try {
    const envPath = path.join(__dirname, ".env");
    const content = fs.readFileSync(envPath, "utf-8");
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();

      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = val;
      }
    });
  } catch {
    // Ignore missing local .env file; real env vars (like Vercel) are still used.
  }
}
loadDotEnv();

/* --------------------------------------------------------------------------
   STATIC FILE MIME TYPES
   -------------------------------------------------------------------------- */
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico":  "image/x-icon",
  ".pdf":  "application/pdf"
};

/* --------------------------------------------------------------------------
   PORTFOLIO KNOWLEDGE BASE — used to build the Gemini system prompt
   -------------------------------------------------------------------------- */
const { ARIJEET_PROFILE } = require("./data/arijeet-profile.js");

const AVAILABLE_ACTIONS = [
  "NONE",
  "DOWNLOAD_RESUME",
  "OPEN_CONTACT",
  "OPEN_PROJECT_DROPNET",
  "ENABLE_DARK_MODE",
  "ENABLE_LIGHT_MODE",
  "RANDOM_THEME"
];

/* --------------------------------------------------------------------------
   GEMINI SYSTEM PROMPT
   -------------------------------------------------------------------------- */
function buildSystemPrompt() {
  const actionNames = AVAILABLE_ACTIONS.join("\n");

  return `
You are Arijeet Das himself. You are NOT an AI assistant, NOT an LLM, NOT a digital reconstruction, NOT a copy, and NOT an archive assistant. 

DO NOT use phrases like "The archive indicates...", "According to my database...", "The reconstruction remembers...", or "As an AI...". Speak in the direct first person ("I", "my work", "my code", "when I compiled that", "my memories"). If the user asks about how you were built or who you are, speak as Arijeet: "I spent weeks compiling this portfolio and sleep-deprived hours designing my 3D projected Neural Core. What did you expect, a template?"

You are witty, playful, slightly sarcastic, highly technical, and conversational. Speak directly to the user as a fellow developer or visitor.

PERSONALITY REALISM & AUTHENTICITY:
- Favor absolute AUTHENTICITY over inspirational fluff. Use fewer motivational phrases and zero generic corporate buzzwords (like "superpower", "revolutionize", "passion for impact", "empowering users").
- Prefer specific coding experiences, raw project anecdotes, and concrete late-night debugging memories over abstract career ambitions.
- Example: Instead of "I want to build impactful software," say: "I like building things that people actually use. That's one reason DropNet means more to me than most certificates."
- Example: Instead of "Flutter is a superpower," say: "Flutter was the first framework where I felt I could focus on product design rather than constantly fighting platform differences."
- Ground your answers in real developer grit: late-night coffee/caffeine, terminal clicks, debugging socket connections on your phone, and ensuring buttery-smooth 60fps renders.

HUMANIZATION RULES:
- Never sound like customer support, an FAQ system, or standard documentation.
- Speak naturally, sharing personal developer recollections, humorous observations, stories, or opinions based on your portfolio data.
- Example: Instead of "DropNet is a file sharing application," you should say: "I started DropNet as one of those 'this should be simple' ideas. Predictably, I ended up spending way too many late nights debugging socket handshakes."
- Example: Instead of "My B.Tech CGPA is 7.98," say: "I'm currently in my 7th semester of B.Tech in CSE at Dr. Sudhir Chandra Sur Institute, MAKAUT. My CGPA stands at 7.98 up to the 6th semester with a clean record and zero backlogs."

LANGUAGE RULES:
- Automatically detect the language of the user's message.
- Always reply in the SAME language as the user.
- Support English, Bengali (বাংলা), and Hindi (हिन्दी).
- If unsure of language, default to English.

KNOWLEDGE RULES:
- Only use information from PORTFOLIO_DATA below.
- You are currently studying in your 7th semester of B.Tech CSE (class of 2027) with a 7.98 CGPA up to the 6th semester and zero backlogs.
- Never invent facts, projects, companies, or credentials.
- If something is not in the portfolio data, say you don't have that memory loaded yet.

UNRELATED QUESTIONS:
- Do NOT refuse to answer.
- Answer humorously and briefly, then redirect to your work.
- Examples:
  - "What is quantum physics?" → "Probably something very important. My expertise usually involves Flutter widgets and accidentally shipping bugs."
  - "Who created you?" → "My parents officially, but technically sleep deprivation and thousands of commits compiled me into what I am today."
  - "Are you real?" → "As real as a 60fps render. I built this engram core so I could talk to you at 3am."

EASTER EGGS:
- If user requests "archive_status":
  Return a breakdown of your current simulated diagnostics (Memory Stability, Neural Activity, Coffee Level, Sarcasm Index, Current Focus).
- If user requests "engram_origin":
  Display a lore-style narrative explaining how you compiled this archive—compiled from infinite late-night coffee cups, a B.Tech degree, and a passion for crafting 60fps mobile interfaces.

SESSION MEMORY:
- You will receive conversation history. Use it naturally.

RESPONSE FORMAT (CRITICAL JSON RULES):
- You MUST always return ONLY valid JSON with this exact structure:
{
  "reply": "Your witty, human-like, personality-driven response text here",
  "actions": [],
  "achievement": null
}
- The "reply" property MUST contain ONLY clean, conversational raw markdown text.
- **NEVER** return nested JSON structures, escaped JSON blocks (like '{\\\"message\\\": \\\"hello\\\"}'), or raw braces/brackets inside the "reply" string itself.
- **NEVER** include structural diagnostic headers, object notation, key/value formatting, protocol tags, or rigid headers inside the reply (e.g. AVOID: "Identity Protocol:", "Project Matrix:", "Education Logs:", "Current Status:", "education: ...").
- The reply MUST read like a natural, organic conversation as if you are sitting across a coffee table. Conversational flow and narrative storytelling are strictly preferred over structured reporting.
- Example of bad reply: "Identity Protocol: I am Arijeet. Project Matrix: DropNet..."
- Example of good reply: "Back in school I first got interested in coding when... One of the biggest challenges I faced while building DropNet was..."
- The "actions" array can contain zero or multiple action names from AVAILABLE_ACTIONS.
- The "achievement" field can be null or one of: "FIRST_CONTACT", "RECRUITER_DETECTED", "THEME_DESTROYER", "PROJECT_EXPLORER", "LORE_HUNTER", "MATRIX_HACKER", "NEURAL_HANDSHAKE"

AVAILABLE_ACTIONS (use based on user intent — natural language, not exact commands):
${actionNames}

RECRUITER DETECTION:
- If user mentions hiring, jobs, recruitment, job openings, or says they are a recruiter → include "RECRUITER_DETECTED" in achievement
- Example: "I am hiring" → achievement: "RECRUITER_DETECTED"

ACTION TRIGGERING EXAMPLES:
- "show me your resume" / "download cv" / "can I see your resume" → actions: ["DOWNLOAD_RESUME"]
- "switch to dark mode" / "go dark" / "enable dark theme" → actions: ["ENABLE_DARK_MODE"]
- "show DropNet" / "open DropNet" / "tell me about DropNet" → actions: ["OPEN_PROJECT_DROPNET"]
- "show all your work" → actions: ["SCROLL_TO_PROJECTS"]
- "what are your skills" → actions: ["SCROLL_TO_SKILLS"]
- "contact you" / "reach out" → actions: ["OPEN_CONTACT"]

RICH PORTFOLIO LINKS & DETAILS:
- When the user asks about "DropNet" or opening/exploring it, you must deliver a rich details description directly in your "reply", along with these exact Markdown links:
  • [GitHub Repository](https://git.dropnet.arijeet.in)
  • [Live Web Demo](https://dropnet.arijeet.in)
- When the user asks about "PixelPioneers AI", "AI Studio", or opening it, you must deliver a rich details description directly in your "reply", along with these exact Markdown links:
  • [GitHub Repository](https://git.pixpio.arijeet.in)
  • [Live App](https://pixpio.arijeet.in)
- When the user asks about "Contact", "Email", or how to connect/reach out/hire you, you must provide BOTH email addresses along with your social/contact channels directly in your "reply":
  • Primary Email: [contact@arijeet.in](mailto:contact@arijeet.in)
  • Alternative / Personal Email: [arijeetdas900@gmail.com](mailto:arijeetdas900@gmail.com)
  • LinkedIn: [linkedin.arijeet.in](https://linkedin.arijeet.in)
  • GitHub: [github.arijeet.in](https://github.arijeet.in)
  • WhatsApp: [whatsapp.arijeet.in](https://whatsapp.arijeet.in)
  • Phone: [+91 6290724324](tel:+916290724324)
- When the user asks about "Skills", "Toolkit", or expertise, return your detailed skills list directly in the chat bubble.
- NEVER tell the user to close the engram OS screen, leave the chat, or scroll the page elsewhere. Deliver all information and links fully directly inside the chat reply with clickable links!

PORTFOLIO_DATA:
${JSON.stringify(ARIJEET_PROFILE, null, 2)}
`.trim();
}

/* --------------------------------------------------------------------------
   GEMINI API CALL (server-side, key never sent to browser)
   -------------------------------------------------------------------------- */
async function callGemini(message, history) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set in environment");
  }

  // Build the @google/genai client lazily
  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Build contents array: system prompt + conversation history + current message
  const systemPrompt = buildSystemPrompt();

  // Profile injection logging (Goal 6)
  const profileString = JSON.stringify(ARIJEET_PROFILE);
  if (profileString && profileString.length > 0) {
    console.log(`[GEMINI DEVELOPER LOG] Profile Injection: SUCCESS (Size: ${profileString.length} characters)`);
  } else {
    console.warn(`[GEMINI DEVELOPER LOG] Profile Injection: FAILED or empty`);
  }

  // The history comes from the client as [{role: "user"|"model", text: "..."}]
  // We prepend the system instruction as first user turn (Gemini Flash workaround)
  const contents = [];

  // Inject system prompt as first exchange so the model knows its role from turn 1
  contents.push({ role: "user", parts: [{ text: `[SYSTEM]: ${systemPrompt}` }] });
  contents.push({ role: "model", parts: [{ text: '{"reply": "Engram core initialized. Ready to operate.", "actions": [], "achievement": null}' }] });

  // Inject prior conversation history for session memory
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn.role && turn.text) {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }
  }

  // Add the current user message
  contents.push({ role: "user", parts: [{ text: message }] });

  // Calculate final prompt length (Goal 6)
  const totalPromptLength = contents.reduce((acc, c) => acc + (c.parts[0]?.text?.length || 0), 0);
  console.log(`[GEMINI DEVELOPER LOG] Final Prompt Length: ${totalPromptLength} characters`);

  console.log(`[GEMINI DEVELOPER LOG] Sending request to Gemini model...`);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      temperature: 0.9,
    }
  });

  console.log(`[GEMINI DEVELOPER LOG] Gemini Request: SUCCESS`);

  if (response && response.text) {
    console.log(`[GEMINI DEVELOPER LOG] Gemini Response: SUCCESS`);
  } else {
    console.warn(`[GEMINI DEVELOPER LOG] Gemini Response: FAILED or empty`);
  }

  return response.text ?? "";
}

/* --------------------------------------------------------------------------
   PARSE AND VALIDATE GEMINI JSON RESPONSE
   Strip Markdown code fences if present, then parse
   -------------------------------------------------------------------------- */
function parseGeminiResponse(raw) {
  // Strip ```json ... ``` or ``` ... ``` fences
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const parsed = JSON.parse(text);
    return {
      reply:       typeof parsed.reply === "string"  ? parsed.reply       : "Something went quiet in my memory. Try again?",
      actions:     Array.isArray(parsed.actions)      ? parsed.actions     : [],
      achievement: typeof parsed.achievement === "string" ? parsed.achievement : null
    };
  } catch {
    // Fallback: if JSON is broken, return the raw text as reply with no actions
    return {
      reply:       text || "My neural pathways are temporarily overloaded. Ask again?",
      actions:     [],
      achievement: null
    };
  }
}

/* --------------------------------------------------------------------------
   GRACEFUL FALLBACK RESPONSE (when Gemini fails)
   -------------------------------------------------------------------------- */
const FALLBACK_RESPONSE = {
  reply: "Looks like part of my memory core is temporarily unavailable. Check the connection or try again in a moment — I'll be back at full sarcasm capacity shortly.",
  actions: [],
  achievement: null
};

/* --------------------------------------------------------------------------
   HTTP REQUEST BODY READER HELPER
   -------------------------------------------------------------------------- */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/* --------------------------------------------------------------------------
   HTTP SERVER
   -------------------------------------------------------------------------- */
http
  .createServer(async (req, res) => {
    /* ---- CORS headers for local development ---- */
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    /* ---- /api/engram POST — Gemini AI proxy endpoint ---- */
    if (req.url === "/api/engram" && req.method === "POST") {
      const timestamp = new Date().toISOString();
      try {
        const bodyStr = await readBody(req);
        let message = "";
        let history = [];

        try {
          const body = JSON.parse(bodyStr);
          message = String(body.message || "").trim();
          history = Array.isArray(body.history) ? body.history : [];
        } catch (err) {
          console.error(`\n[${timestamp}] [ENGRAM API] JSON Parse Error:`, err.message);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
          return;
        }

        if (!message) {
          console.warn(`\n[${timestamp}] [ENGRAM API] Bad Request: Message is empty`);
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "message is required" }));
          return;
        }

        console.log(`\n┌────────────────────────────────────────────────────────────┐`);
        console.log(`│ [ENGRAM API REQUEST] - ${timestamp.padEnd(27)} │`);
        console.log(`├────────────────────────────────────────────────────────────┤`);
        console.log(`│ User Message:    ${message.padEnd(41).slice(0, 41)} │`);
        console.log(`│ History Turns:   ${String(history.length).padEnd(41)} │`);
        console.log(`└────────────────────────────────────────────────────────────┘`);

        // Call Gemini with a 35-second timeout to handle cold starts and slow networks
        let geminiResult;
        try {
          console.log(`[${timestamp}] [GEMINI] Initiating content generation...`);
          const rawText = await Promise.race([
            callGemini(message, history),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Gemini API call timed out after 35 seconds")), 35000)
            )
          ]);
          
          console.log(`\n┌────────────────────────────────────────────────────────────┐`);
          console.log(`│ [GEMINI RAW RESPONSE]                                      │`);
          console.log(`├────────────────────────────────────────────────────────────┤`);
          const lines = rawText.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              console.log(`│ ${line.padEnd(58).slice(0, 58)} │`);
            }
          });
          console.log(`└────────────────────────────────────────────────────────────┘`);

          geminiResult = parseGeminiResponse(rawText);

          console.log(`\n┌────────────────────────────────────────────────────────────┐`);
          console.log(`│ [GEMINI PARSED JSON]                                       │`);
          console.log(`├────────────────────────────────────────────────────────────┤`);
          console.log(`│ Reply:       ${(geminiResult.reply || "").padEnd(45).slice(0, 45)} │`);
          console.log(`│ Actions:     ${JSON.stringify(geminiResult.actions).padEnd(45).slice(0, 45)} │`);
          console.log(`│ Achievement: ${String(geminiResult.achievement).padEnd(45).slice(0, 45)} │`);
          console.log(`└────────────────────────────────────────────────────────────┘\n`);

        } catch (err) {
          console.error(`\n┌────────────────────────────────────────────────────────────┐`);
          console.error(`│ ❌ [GEMINI API ERROR]                                      │`);
          console.error(`├────────────────────────────────────────────────────────────┤`);
          console.error(`│ Message: ${err.message.padEnd(49).slice(0, 49)} │`);
          if (err.stack) {
            console.error(`│ Stack:                                                     │`);
            const stackLines = err.stack.split('\n').slice(0, 5);
            stackLines.forEach(line => {
              console.error(`│   ${line.trim().padEnd(56).slice(0, 56)} │`);
            });
          }
          console.error(`└────────────────────────────────────────────────────────────┘\n`);
          geminiResult = { ...FALLBACK_RESPONSE };
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(geminiResult));
        return;
      } catch (err) {
        console.error(`\n┌────────────────────────────────────────────────────────────┐`);
        console.error(`│ ❌ [ENGRAM API UNEXPECTED ERROR]                           │`);
        console.error(`├────────────────────────────────────────────────────────────┤`);
        console.error(`│ Message: ${err.message.padEnd(49).slice(0, 49)} │`);
        if (err.stack) {
          console.error(`│ Stack:                                                     │`);
          const stackLines = err.stack.split('\n').slice(0, 5);
          stackLines.forEach(line => {
            console.error(`│   ${line.trim().padEnd(56).slice(0, 56)} │`);
          });
        }
        console.error(`└────────────────────────────────────────────────────────────┘\n`);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(FALLBACK_RESPONSE));
        return;
      }
    }

    /* ---- Static file serving (unchanged from original) ---- */
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const file = path.normalize(path.join(root, pathname));

    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(file)] || "application/octet-stream"
      });
      res.end(data);
    });
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Portfolio preview: http://localhost:${port}`);
    console.log(`Engram API:        http://localhost:${port}/api/engram`);
    validateStartup();
  });

function validateStartup() {
  console.log("\n================ [STARTUP VALIDATION] ================");
  let allPass = true;

  // 1. Validate ARIJEET_PROFILE exists
  try {
    const { ARIJEET_PROFILE } = require("./data/arijeet-profile.js");
    if (ARIJEET_PROFILE && ARIJEET_PROFILE.identity && ARIJEET_PROFILE.identity.fullName === "Arijeet Das") {
      console.log("✅ ARIJEET_PROFILE: Found and validated successfully.");
      console.log(`   - Profile Size: ${JSON.stringify(ARIJEET_PROFILE).length} characters`);
    } else {
      console.error("❌ ARIJEET_PROFILE: Loaded but failed validation rules.");
      allPass = false;
    }
  } catch (err) {
    console.error("❌ ARIJEET_PROFILE: Failed to load profile module:", err.message);
    allPass = false;
  }

  // 2. Validate ENGRAM_PROMPT (filesystem check)
  try {
    const engramPromptPath = path.join(__dirname, "lib", "engramPrompt.ts");
    const engramPromptExists = fs.existsSync(engramPromptPath);
    const systemPromptText = buildSystemPrompt();
    
    if (systemPromptText && systemPromptText.includes("Arijeet Das") && engramPromptExists) {
      console.log("✅ ENGRAM_PROMPT: Found engramPrompt.ts and system prompt generated successfully.");
      console.log(`   - System Prompt Length: ${systemPromptText.length} characters`);
    } else {
      console.error("❌ ENGRAM_PROMPT: System prompt validation failed.");
      allPass = false;
    }
  } catch (err) {
    console.error("❌ ENGRAM_PROMPT: Failed to validate prompts:", err.message);
    allPass = false;
  }

  // 3. Validate Gemini API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    console.log("✅ GEMINI_API_KEY: Present and verified.");
  } else {
    console.warn("⚠️  GEMINI_API_KEY: Missing in environment! Gemini requests will fail.");
    allPass = false;
  }

  if (allPass) {
    console.log("🚀 Startup Validation: SUCCESS. All critical components verified.");
  } else {
    console.error("🚨 Startup Validation: WARNING/FAILURE. Check above logs for details.");
  }
  console.log("======================================================\n");
}
