import { GoogleGenAI } from "@google/genai";
import { ENGRAM_PROMPT } from "@/lib/engramPrompt";
import fs from "fs";
import path from "path";

// robust API key resolving
let apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
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
        if (key === "GEMINI_API_KEY") {
          apiKey = val;
        }
      });
    }
  } catch (e) {
    // ignore
  }
}

// Clean any surrounding quotes
if (apiKey.startsWith('"') && apiKey.endsWith('"')) {
  apiKey = apiKey.slice(1, -1);
}
if (apiKey.startsWith("'") && apiKey.endsWith("'")) {
  apiKey = apiKey.slice(1, -1);
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
});

export async function POST(req: Request) {
  const { message } = await req.json();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: `[SYSTEM]: ${ENGRAM_PROMPT}` }] },
      { role: "model", parts: [{ text: '{"reply": "Engram core initialized. Ready to operate.", "actions": [], "achievement": null}' }] },
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.9,
    }
  });

  let text = (response.text ?? "").trim();
  // Strip code blocks if present
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    return Response.json(JSON.parse(text));
  } catch {
    return Response.json({
      reply: text,
      actions: [],
      achievement: null
    });
  }
}