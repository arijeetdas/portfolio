import { GoogleGenAI } from "@google/genai";
import { ENGRAM_PROMPT } from "@/lib/engramPrompt";
import fs from "fs";
import path from "path";

function resolveEnvValue(key: string): string {
  const valueFromRuntime = process.env[key];
  if (valueFromRuntime && valueFromRuntime.trim()) {
    return valueFromRuntime.trim();
  }

  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return "";

    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;

      const currentKey = trimmed.slice(0, eqIdx).trim();
      let currentValue = trimmed.slice(eqIdx + 1).trim();

      if ((currentValue.startsWith('"') && currentValue.endsWith('"')) ||
          (currentValue.startsWith("'") && currentValue.endsWith("'"))) {
        currentValue = currentValue.slice(1, -1);
      }

      if (currentKey === key && currentValue) {
        return currentValue.trim();
      }
    }
  } catch {
    // Ignore missing or unreadable local .env file.
  }

  return "";
}

const apiKey = resolveEnvValue("GEMINI_API_KEY").replace(/^['"]|['"]$/g, "");

const ai = new GoogleGenAI({
  apiKey,
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