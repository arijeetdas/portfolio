/**
 * engram.js — ArijeetOS, the AI version of Arijeet on arijeetdas.in
 *
 * Stages: boot (terminal) → confirm ([Y]/[N]) → sync (neural handshake) → chat.
 * Chat: local slash commands and easter eggs first, then Gemini through
 * POST /api/engram, then a local fallback that answers from the knowledge base.
 * Achievements persist in localStorage; the conversation lives for the session.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ARIJEET_PROFILE, SITE_CONTENT, KNOWLEDGE_NOTES } from "./data/arijeet-profile.js";
import {
  Icon, GlyphPortrait, PHOSPHORS, getPhosphor, prefersReducedMotion,
  pick, FORTUNES, JOKES, EIGHT_BALL, ROASTS, PERSONAS
} from "./shared.js";

const h = React.createElement;
const EASE = [0.22, 1, 0.36, 1];
const SITE = SITE_CONTENT || {};
const PROFILE = ARIJEET_PROFILE || {};
const PROJECTS = (SITE.projects && SITE.projects.items) || [];

/* ==========================================================================
   ACHIEVEMENTS
   ========================================================================== */

const ACHIEVEMENTS_CONFIG = {
  FIRST_CONTACT: { title: "First contact", desc: "You opened ArijeetOS. Welcome to my head." },
  NEURAL_HANDSHAKE: { title: "Neural handshake", desc: "Synced with my synaptic link." },
  RECRUITER_DETECTED: { title: "Recruiter VIP", desc: "Hiring intent detected. Resume on standby." },
  THEME_DESTROYER: { title: "Phosphor shifter", desc: "Changed the colour of my brain." },
  PROJECT_EXPLORER: { title: "Project explorer", desc: "Opened one of my projects." },
  LORE_HUNTER: { title: "Lore hunter", desc: "Dug up a secret, a fun fact or my coffee logs." },
  MATRIX_HACKER: { title: "Matrix hacker", desc: "Said the magic words. Rain followed." },
  GAMBLER: { title: "Gambler", desc: "Let a coin, a die or the 8-ball decide." },
  QUIZ_MASTER: { title: "Quiz master", desc: "Knows me better than my professors." },
  ROASTED: { title: "Roasted", desc: "Asked me to roast myself. I complied." }
};

const ACHIEVEMENTS_LS_KEY = "engram_achievements_v3";

function loadAchievements() {
  try { return new Set(JSON.parse(localStorage.getItem(ACHIEVEMENTS_LS_KEY) || "[]")); } catch { return new Set(); }
}
function saveAchievements(set) {
  try { localStorage.setItem(ACHIEVEMENTS_LS_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }

/* ==========================================================================
   BOOT, SYNC, GREETINGS
   ========================================================================== */

const BOOT_MESSAGES = [
  "Initializing neural link...",
  "Loading memory clusters...",
  "Parsing project database: DropNet, FetchNet, DropNet-CLI, UltraVision...",
  "Restoring socket handshake trauma...",
  "Loading Flutter and Android knowledge...",
  "Teaching DUM-E to stay quiet...",
  "Indexing caffeine consumption logs...",
  "Sarcasm coefficient calibrated.",
  "System integrity: 100%",
  "Synaptic bridge ready."
];

const SYNC_STEPS = [
  { label: "Restoring memory clusters", threshold: 15 },
  { label: "Loading Android expertise", threshold: 30 },
  { label: "Loading Flutter knowledge", threshold: 45 },
  { label: "Mounting project history", threshold: 60 },
  { label: "Warming up UltraVision personas", threshold: 75 },
  { label: "Calibrating caffeine levels", threshold: 85 },
  { label: "Calibrating sarcasm", threshold: 93 },
  { label: "Synchronizing neural pathways", threshold: 100 }
];

const GREETINGS = {
  morning: ["You're here early. Coffee?", "Morning. What do you want to know about me today?", "Good morning. I've been awake and coding for hours. Allegedly."],
  afternoon: ["Good afternoon. Projects or secrets?", "Perfect timing. I was reorganizing my memories.", "Afternoon. What brings you to my portfolio?"],
  evening: ["Good evening. It's quiet in here tonight.", "Evening. Ask carefully, some of my debugging logs bite.", "Welcome. My systems are still running."],
  night: ["It's late. I'm awake, obviously.", "Most people are asleep. Developers rarely count as most people.", "Interesting hour to read someone's code."],
  returning: ["Back again?", "Welcome back.", "I remember you. Curiosity remains undefeated."],
  achievement: ["Still hunting achievements?", "I see you've unlocked a few things already.", "You again. Type /achievements to see your progress."],
  recruiter: ["Reviewing my work again?", "Welcome back. Still evaluating candidates?"],
  standard: [
    "Hello stranger. Projects, stories or secrets?",
    "I'm awake. What's on your mind?",
    "Try asking about one of my projects, a bug, or a bad life decision involving code.",
    "Synaptic bridge established. Type /help if you like buttons with no buttons."
  ]
};

function generateGreeting(unlocked) {
  const roll = Math.random();
  if (unlocked.has("RECRUITER_DETECTED") && roll < 0.4) return pick(GREETINGS.recruiter);
  if (unlocked.size > 2 && roll < 0.3) return pick(GREETINGS.achievement);
  if (lsGet("visited_engram_v3") === "true" && roll < 0.3) return pick(GREETINGS.returning);
  if (roll < 0.55) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return pick(GREETINGS.morning);
    if (hour >= 12 && hour < 18) return pick(GREETINGS.afternoon);
    if (hour >= 18 && hour < 22) return pick(GREETINGS.evening);
    return pick(GREETINGS.night);
  }
  return pick(GREETINGS.standard);
}

const THINKING_PHRASES = ["Accessing memory clusters", "Searching project logs", "Reviewing old decisions", "Reconstructing memory", "Asking DUM-E for help"];

const SUGGESTIONS = [
  { label: "Roast my portfolio", text: "/roast" },
  { label: "2 a.m. debugging story", text: "Tell me a 2 a.m. debugging story" },
  { label: "Explain DropNet like I'm five", text: "/eli5 DropNet" },
  { label: "When is UltraVision public", text: "When will UltraVision be public?" },
  { label: "Quiz me", text: "/quiz" },
  { label: "Which persona am I", text: "/persona" },
  { label: "I'm hiring", text: "I am a recruiter and I'm hiring" },
  { label: "sudo hack", text: "sudo hack" },
  { label: "All commands", text: "/help" }
];

const LORE = [
  "Caffeine index: about four cups a day. Code goes in, bugs sometimes stay out.",
  "I once wrote a socket transfer script on my phone because my laptop died mid-transfer.",
  "DropNet exists because emailing myself PDFs felt like a personal failure.",
  "UltraVision's DUM-E persona beeps on purpose. I spent an evening tuning the beeps.",
  "The terminal on my homepage types forever. I tested it for longer than I'd like to admit.",
  "FetchNet bundles Python inside an Android app. Yes, it works. No, I don't want to talk about how long it took."
];

/* ==========================================================================
   COMMAND HELP — shown by /help
   ========================================================================== */

const COMMAND_HELP = [
  ["/help", "this list"],
  ["/roast", "I roast my own portfolio"],
  ["/story", "a debugging story from my projects"],
  ["/eli5 <topic>", "explain something like you're five"],
  ["/quiz", "three questions about me"],
  ["/persona", "which UltraVision persona you are"],
  ["/joke, /fortune, /lore", "jokes, fortunes and secrets"],
  ["/8ball <question>, /coin, /dice [n]", "let chance decide"],
  ["/rps <rock|paper|scissors>", "rock, paper, scissors"],
  ["/projects, /open <name>", "list or open a project"],
  ["/resume, /contact, /hire", "the useful stuff"],
  ["/theme <amber|green|cyan|rose|white|random>", "change my phosphor"],
  ["/light, /dark", "page theme"],
  ["/stats, /achievements, /ping", "diagnostics"],
  ["/coffee, /matrix, /origin", "easter eggs"],
  ["/clear, /destruct, /exit", "clear chat, self-destruct, close"]
];

/* ==========================================================================
   QUIZ
   ========================================================================== */

const QUIZ_BANK = [
  { q: "Where am I based?", options: ["Kolkata", "Bengaluru", "Pune"], a: 0 },
  { q: "What is my CGPA up to semester 6?", options: ["8.40", "7.98", "7.20"], a: 1 },
  { q: "Which project moves files between devices without internet?", options: ["FetchNet", "UltraVision", "DropNet"], a: 2 },
  { q: "How many personas live inside UltraVision?", options: ["Nine", "Five", "Twelve"], a: 0 },
  { q: "What does FetchNet use under the hood?", options: ["A paid API", "yt-dlp and gallery-dl", "Screen recording"], a: 1 },
  { q: "Which language is DropNet-CLI written in?", options: ["Go", "Dart", "Python"], a: 2 },
  { q: "When do I graduate?", options: ["2027", "2026", "2028"], a: 0 },
  { q: "Where did I do my Android virtual internship?", options: ["EduSkills, Google Developer Program", "A startup in Pune", "Nowhere, I made it up"], a: 0 }
];

function quizQuestionText(item, n, total) {
  return `Question ${n} of ${total}: ${item.q}\n\n${item.options.map((o, i) => `${"abc"[i]}) ${o}`).join("\n")}\n\nAnswer with a, b or c.`;
}

/* ==========================================================================
   LOCAL KNOWLEDGE HELPERS (used by commands and the fallback)
   ========================================================================== */

function contactText() {
  const channels = (SITE.contact && SITE.contact.channels) || [];
  const alt = PROFILE.contact && PROFILE.contact.secondaryEmail;
  return [
    "You can reach me here:",
    ...channels.map((c) => `- ${c.label}: [${c.value}](${c.href})`),
    alt ? `- Personal email: [${alt}](mailto:${alt})` : null
  ].filter(Boolean).join("\n");
}

function projectsText() {
  return PROJECTS.map((p) => {
    const links = [p.live && `[open](${p.live})`, p.github && `[source](${p.github})`].filter(Boolean).join(" · ");
    return `- **${p.title}** (${p.status}): ${p.summary}${links ? `. ${links}` : p.note ? `. ${p.note}` : ""}`;
  }).join("\n");
}

function skillsText() {
  const cats = (SITE.skills && SITE.skills.categories) || [];
  return cats.map((c) => `- ${c.title}: ${c.items.join(", ")}`).join("\n");
}

/* ==========================================================================
   DETERMINISTIC LAYER — commands, easter eggs, AI-prompt rewrites
   Returns { handled: true, reply, actions, achievement, ... }
        or { handled: "ai", message, fallback, achievement } to ask Gemini
        or { handled: false }
   ========================================================================== */

function deterministicFilter(text, ctx) {
  const raw = text.trim();
  const t = raw.toLowerCase();
  const [cmd, ...argv] = t.startsWith("/") ? t.slice(1).split(/\s+/) : [null];
  const arg = raw.split(/\s+/).slice(1).join(" ");
  const reply = (r, extra = {}) => ({ handled: true, reply: r, actions: [], ...extra });

  /* ---- quiz answers take priority while a quiz is running ---- */
  if (ctx.quiz && !cmd) {
    const map = { a: 0, b: 1, c: 2, "1": 0, "2": 1, "3": 2 };
    const item = ctx.quiz.items[ctx.quiz.i];
    let choice = map[t.replace(/[).]/g, "")];
    if (choice === undefined) choice = item.options.findIndex((o) => o.toLowerCase() === t);
    if (choice === -1 || choice === undefined) {
      // Short input: probably a typo'd answer. Longer input: they moved on, so end the quiz quietly.
      if (t.length <= 12) return reply("Pick a, b or c. Or type /quiz stop to give up.");
      ctx.setQuiz(null);
      return deterministicFilter(text, { ...ctx, quiz: null });
    }
    const correct = choice === item.a;
    const score = ctx.quiz.score + (correct ? 1 : 0);
    const nextI = ctx.quiz.i + 1;
    const verdict = correct ? "Correct." : `Nope, it's ${item.options[item.a]}.`;
    if (nextI >= ctx.quiz.items.length) {
      ctx.setQuiz(null);
      const end = score === ctx.quiz.items.length ? "Perfect score. Are you my mom?" : score >= 2 ? "Not bad. You've been paying attention." : "We should spend more time together.";
      return reply(`${verdict}\n\nFinal score: ${score}/${ctx.quiz.items.length}. ${end}`, score === ctx.quiz.items.length ? { achievement: "QUIZ_MASTER" } : {});
    }
    ctx.setQuiz({ ...ctx.quiz, i: nextI, score });
    return reply(`${verdict}\n\n${quizQuestionText(ctx.quiz.items[nextI], nextI + 1, ctx.quiz.items.length)}`);
  }

  /* ---- slash commands ---- */
  if (cmd) {
    switch (cmd) {
      case "help":
        return reply(`Here's everything I respond to:\n\n${COMMAND_HELP.map(([c, d]) => `- **${c}**: ${d}`).join("\n")}\n\nOr just talk to me normally.`);
      case "roast":
        return { handled: "ai", achievement: "ROASTED", message: "Roast my own portfolio in three short, playful sentences. Be self-deprecating and use real details about my projects, grades and habits.", fallback: pick(ROASTS) };
      case "story":
        return { handled: "ai", achievement: "LORE_HUNTER", message: "Tell me a short, true-feeling 2 a.m. debugging story from one of your projects. Keep it under 120 words.", fallback: storyFallback() };
      case "eli5":
        if (!arg) return reply("Explain what like you're five? Try /eli5 DropNet.");
        return { handled: "ai", message: `Explain ${arg} like I'm five years old, in three short sentences, in your own voice.`, fallback: eli5Fallback(arg) };
      case "quiz": {
        if (argv[0] === "stop") { ctx.setQuiz(null); return reply("Quiz stopped. Coward. (Respectfully.)"); }
        const items = [...QUIZ_BANK].sort(() => Math.random() - 0.5).slice(0, 3);
        ctx.setQuiz({ items, i: 0, score: 0 });
        return reply(`Three questions about me. No googling.\n\n${quizQuestionText(items[0], 1, 3)}`);
      }
      case "persona": {
        const p = pick(PERSONAS);
        return reply(`You're ${p.name}: ${p.why}.\n\nUltraVision has nine personas like this, each with its own offline voice. It's in development and will be public soon.`);
      }
      case "joke": return reply(pick(JOKES));
      case "fortune": return reply(pick(FORTUNES));
      case "lore": case "secret": return reply(`» ${pick(LORE)}`, { achievement: "LORE_HUNTER" });
      case "8ball":
        if (!arg) return reply("Ask the 8-ball a question. /8ball Will my build pass?");
        return reply(`You asked: "${arg}"\n\nThe 8-ball says: **${pick(EIGHT_BALL)}**`, { achievement: "GAMBLER" });
      case "coin": case "flip":
        return reply(Math.random() < 0.5 ? "Heads. Ship it." : "Tails. Write the tests first.", { achievement: "GAMBLER" });
      case "dice": case "roll": {
        const sides = Math.max(2, Math.min(1000, parseInt(argv[0], 10) || 6));
        const n = 1 + Math.floor(Math.random() * sides);
        return reply(`Rolled a d${sides}: **${n}**${n === sides ? ". Critical hit." : n === 1 ? ". Critical bug." : "."}`, { achievement: "GAMBLER" });
      }
      case "rps": {
        const moves = ["rock", "paper", "scissors"];
        const me = argv[0];
        if (!moves.includes(me)) return reply("Pick one: /rps rock, /rps paper or /rps scissors.");
        const cpu = pick(moves);
        const win = (me === "rock" && cpu === "scissors") || (me === "paper" && cpu === "rock") || (me === "scissors" && cpu === "paper");
        return reply(`You: ${me}. Me: ${cpu}. ${me === cpu ? "Draw. Again?" : win ? "You win. I want a rematch." : "I win. Years of training."}`, { achievement: "GAMBLER" });
      }
      case "projects":
        return reply(`Here's what I've built:\n\n${projectsText()}\n\nSay /open <name> and I'll pull it up.`, { actions: ["SCROLL_TO_PROJECTS"] });
      case "open": {
        const p = PROJECTS.find((x) => x.id === argv.join("-") || x.title.toLowerCase() === arg.toLowerCase() || x.id.startsWith(argv[0] || "~"));
        if (!p) return reply(`I don't have a project called "${arg}". Try: ${PROJECTS.map((x) => x.id).join(", ")}.`);
        return reply(`Opening ${p.title}. ${p.summary}.`, { actions: [`OPEN_PROJECT:${p.id}`], achievement: "PROJECT_EXPLORER" });
      }
      case "resume": case "cv":
        return reply("Downloading my resume now. Ask me about anything on it.", { actions: ["DOWNLOAD_RESUME"] });
      case "contact":
        return reply(contactText(), { actions: ["OPEN_CONTACT"] });
      case "hire":
        return reply("Recruiter mode on. Here's the short version and the buttons you actually want:", { achievement: "RECRUITER_DETECTED", isRecruiter: true });
      case "theme": {
        const name = argv[0] || "random";
        if (name !== "random" && !PHOSPHORS.includes(name)) return reply(`I know these phosphors: ${PHOSPHORS.join(", ")}, or random.`);
        return reply(`Phosphor switched${name === "random" ? "" : ` to ${name}`}. My brain looks different now.`, { actions: [name === "random" ? "RANDOM_THEME" : `THEME:${name}`], achievement: "THEME_DESTROYER" });
      }
      case "light": return reply("Lights on. The page is in light mode; I stay dark in here.", { actions: ["ENABLE_LIGHT_MODE"] });
      case "dark": return reply("Back to dark mode, where code belongs.", { actions: ["ENABLE_DARK_MODE"] });
      case "stats": case "status":
        return reply(statsText(ctx), { achievement: "LORE_HUNTER" });
      case "achievements": {
        const list = Object.entries(ACHIEVEMENTS_CONFIG).map(([id, a]) => `- ${ctx.unlocked.has(id) ? "[x]" : "[ ]"} ${ctx.unlocked.has(id) ? a.title : "???"}`).join("\n");
        return reply(`${ctx.unlocked.size}/${Object.keys(ACHIEVEMENTS_CONFIG).length} unlocked:\n\n${list}`);
      }
      case "ping": return reply(`pong. ${ctx.lastLatency ? `My last real thought took ${(ctx.lastLatency / 1000).toFixed(1)} s.` : "I haven't had a real thought yet this session."}`);
      case "coffee": break; // handled below with the natural-language trigger
      case "matrix": break;
      case "origin": break;
      case "clear": break;
      case "destruct": break;
      case "exit": case "quit": return { handled: true, reply: "Closing the bridge. Come back soon.", actions: [], close: true };
      default:
        return reply(`I don't know /${cmd}. Type /help for the list.`);
    }
  }

  /* ---- natural-language easter eggs (and the slash versions that fell through) ---- */
  if (cmd === "matrix" || t === "sudo hack" || t === "hack" || t.includes("matrix rain") || (t.includes("sudo") && t.includes("hack"))) {
    return reply("Sudo privileges confirmed. Bypassing core security. Matrix rain activated.", { actions: ["MATRIX_RAIN"], achievement: "MATRIX_HACKER" });
  }
  if (/\b(i am|i'm|im) (a )?recruiter\b|\b(i am|i'm|im) hiring\b|\bwant to hire\b|\bheadhunter\b/.test(t)) {
    return reply("Recruiter detected. Here's the short version and the buttons you actually want:", { achievement: "RECRUITER_DETECTED", isRecruiter: true });
  }
  if (cmd === "coffee" || t === "coffee" || t === "caffeine" || t.includes("caffeine overload")) {
    ctx.setCoffee(100);
    ctx.setSarcasm(96);
    return reply("Caffeine at 100%. Sarcasm at 96%. Socket timeouts, I'm coming for you.", { actions: ["RANDOM_THEME"], achievement: "LORE_HUNTER" });
  }
  if (cmd === "destruct" || t === "self_destruct" || t === "destruct" || t.includes("self destruct")) {
    setTimeout(ctx.triggerDestruct, 100);
    return reply("Self-destruct initiated. Closing file transfers. Disconnecting consciousness.", { achievement: "MATRIX_HACKER" });
  }
  if (t === "theme" || t === "palette" || t === "random_theme" || t.includes("random palette") || t === "random theme" || t.includes("change theme") || t.includes("change color") || t.includes("change colour")) {
    return reply("Phosphor rerouted. My brain is a different colour now.", { actions: ["RANDOM_THEME"], achievement: "THEME_DESTROYER" });
  }
  if (cmd === "clear" || t === "clear" || t === "cls" || t === "clear chat") {
    return reply("Chat history wiped. Fresh start.", { clearChat: true });
  }
  if (t === "archive_status" || t.includes("archive status")) return reply(statsText(ctx), { achievement: "LORE_HUNTER" });
  if (cmd === "origin" || t === "engram_origin" || t.includes("engram origin") || t.includes("your origin")) {
    return reply("I was compiled during late-night debugging sessions, from too much coffee, a B.Tech syllabus and a stubborn belief that apps should work without the internet.\n\nArijeet wrote the code. I just live here and answer questions while he sleeps. Occasionally.", { achievement: "LORE_HUNTER" });
  }
  if (/\b(lore|easter egg|fun fact)\b/.test(t)) return reply(`» ${pick(LORE)}`, { achievement: "LORE_HUNTER" });
  if (t === "ping") return reply("pong");
  if (t === "42") return reply("The answer. The question was probably why Gradle is slow.");

  return { handled: false };
}

function statsText(ctx) {
  return [
    "Diagnostics",
    "",
    `- Memory stability: 99.8%`,
    `- Coffee level: ${Math.round(ctx.coffee)}%`,
    `- Sarcasm index: ${Math.round(ctx.sarcasm)}%`,
    `- Current focus: ${ctx.focus}`,
    `- Bug probability: ${ctx.bugs}`,
    `- Phosphor: ${getPhosphor()}`,
    `- Brain: ${ctx.fallback ? "local fallback" : "Gemini"}`
  ].join("\n");
}

function storyFallback() {
  const stories = Array.isArray(PROFILE.stories) ? PROFILE.stories : [];
  const s = stories.length ? pick(stories) : null;
  if (s && (s.story || s.content || s.description)) return `${s.title ? `**${s.title}**\n\n` : ""}${s.story || s.content || s.description}`;
  return "It was 2 a.m., DropNet refused to see my phone, and I was sure the socket code was broken. Three hours later: the laptop was on the guest Wi-Fi. The code was fine. I was not.";
}

function eli5Fallback(topic) {
  const t = topic.toLowerCase();
  if (t.includes("dropnet")) return "You know how you can hand a toy to your friend in the same room without mailing it? DropNet does that with files. Your phone and laptop talk directly over the home Wi-Fi, no internet needed.";
  if (t.includes("ultravision")) return "UltraVision is like having a tiny robot friend living inside your phone. It can look at pictures and talk to you, and it doesn't need to phone anyone else to think.";
  if (t.includes("fetchnet")) return "You show FetchNet a link to a video, it asks how big you want it, and then it saves a copy for you to watch later.";
  return `I'd explain ${topic}, but my big brain is offline right now. Ask me again in a minute.`;
}

/* ==========================================================================
   LOCAL FALLBACK — answers from the knowledge base when Gemini is down
   ========================================================================== */

function localFallback(text, actions) {
  const t = text.toLowerCase();
  const segments = [];
  const add = (cond, fn) => { if (cond) segments.push(fn()); };

  add(/\b(about|yourself|who are you|intro|bio)\b/.test(t), () => {
    actions.scrollToSection("about");
    return (SITE.about && SITE.about.paragraphs || []).join(" ") || "I'm Arijeet, a CSE student in Kolkata who builds Flutter and Android apps.";
  });
  add(/\b(education|college|cgpa|b\.?tech|degree|semester|backlog|school)\b/.test(t), () => {
    const e = PROFILE.education || {};
    return `I'm doing my ${e.currentDegree || "B.Tech"} in ${e.branch || "CSE"} at ${e.institution || "Dr. Sudhir Chandra Sur Institute of Technology"} (${e.duration || "2023 – 2027"}). CGPA ${e.cgpa || "7.98"}, ${e.backlogs || "no backlogs"}.`;
  });
  add(/\b(project|projects|work|dropnet|fetchnet|ultravision|cli)\b/.test(t), () => {
    actions.scrollToSection("projects");
    return `Here's what I've built:\n${projectsText()}`;
  });
  add(/\b(skill|skills|stack|tech|languages|frameworks)\b/.test(t), () => {
    actions.scrollToSection("skills");
    return `My toolkit:\n${skillsText()}`;
  });
  add(/\b(certificat|internship|course)\w*/.test(t), () => {
    const certs = (PROFILE.certifications || []).map((c) => c.name || c.title).filter(Boolean);
    const exp = (PROFILE.experience || [])[0];
    return `${exp ? `I did the ${exp.role} with ${exp.organization} (${exp.duration}). ` : ""}${certs.length ? `Certifications: ${certs.join(", ")}.` : ""}`;
  });
  add(/\b(contact|email|reach|linkedin|phone|whatsapp)\b/.test(t), () => { actions.scrollToSection("contact"); return contactText(); });
  add(/\b(resume|cv)\b/.test(t), () => { actions.downloadResume(); return "Downloading my resume now."; });
  add(/\b(hire|recruit|why should|strength)\b/.test(t), () => "Short version: I build and ship real apps, I'm comfortable below the UI with sockets, encryption and on-device ML, and I graduate in 2027.");

  if (segments.length) return `My big brain is offline for a moment, but my local memory works:\n\n${segments.join("\n\n")}`;

  // Search Knowledge Studio notes for the best keyword overlap.
  const words = t.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3);
  if (words.length && Array.isArray(KNOWLEDGE_NOTES)) {
    let best = null;
    let bestScore = 0;
    for (const note of KNOWLEDGE_NOTES) {
      const hay = `${note.title} ${note.category} ${note.content}`.toLowerCase();
      const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
      if (score > bestScore) { best = note; bestScore = score; }
    }
    if (best && bestScore >= Math.min(2, words.length)) {
      const excerpt = best.content.length > 700 ? `${best.content.slice(0, 700).trim()}…` : best.content;
      return `My big brain is offline, but I remember this about **${best.title}**:\n\n${excerpt}`;
    }
  }
  return "My big brain is offline for a moment. I can still tell you about my projects, skills, education or how to reach me. Or type /help for things that work without it.";
}

/* ==========================================================================
   GEMINI CLIENT
   ========================================================================== */

async function askGemini(message, history) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  let base = "";
  if (window.location.protocol === "file:") base = "http://localhost:5173";
  try {
    const res = await fetch(`${base}/api/engram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      signal: controller.signal
    });
    let data = {};
    try { data = await res.json(); } catch { /* not JSON */ }
    if (!res.ok) throw new Error(`${data.code || "HTTP_" + res.status}: ${data.error || res.statusText}`);
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("TIMEOUT: Gemini took too long");
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* ==========================================================================
   RENDER HELPERS
   ========================================================================== */

/** Renders [links](url) and **bold**; everything else stays plain text. */
function renderRich(text) {
  if (!text) return "";
  const out = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      const safe = /^(https?:|mailto:|tel:|\/|assets\/)/i.test(href) ? href : "#";
      out.push(h("a", { key: m.index, href: safe, className: "os-link", target: /^https?:/i.test(safe) ? "_blank" : undefined, rel: "noopener noreferrer" }, m[1]));
    } else {
      out.push(h("strong", { key: m.index }, m[3]));
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function StreamingText({ text, onDone }) {
  const [n, setN] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (prefersReducedMotion()) { setN(text.length); doneRef.current?.(); return undefined; }
    let i = 0;
    const step = Math.max(1, Math.round(text.length / 220)); // long replies stream faster
    const id = setInterval(() => {
      i = Math.min(text.length, i + step);
      setN(i);
      if (i >= text.length) { clearInterval(id); doneRef.current?.(); }
    }, 12);
    return () => clearInterval(id);
  }, [text]);
  return h(React.Fragment, null, renderRich(text.slice(0, n)), n < text.length ? h("span", { className: "block-cursor" }) : null);
}

/* ---- HUD building blocks (cyberpunk look, ArijeetOS only) ---- */

const CP_YELLOW = "243, 230, 0";
const CP_CYAN = "4, 218, 246";
const CP_RED = "255, 42, 79";

/** Segmented bar: value 0-100 lights up `segments` blocks. */
function SegBar({ value, segments = 16, tone = "yellow", className = "" }) {
  const on = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  return h("div", { className: `seg-bar seg-${tone} ${className}`.trim(), role: "presentation" },
    Array.from({ length: segments }).map((_, i) => h("i", { key: i, className: i < on ? "on" : "" })));
}

/** Title with a chromatic glitch (CSS draws the offset copies from data-text). */
function Glitch({ as = "span", text, className = "" }) {
  return h(as, { className: `glitch ${className}`.trim(), "data-text": text }, text);
}

/** Header strip used on every ArijeetOS panel. */
function HudBar({ title, right, onClose }) {
  return h("div", { className: "hud-bar" },
    h("span", { className: "hud-hazard", "aria-hidden": "true" }),
    h("span", { className: "hud-title" }, title),
    right ? h("span", { className: "hud-right" }, right) : null,
    onClose ? h("button", { className: "hud-close", onClick: onClose, "aria-label": "Close ArijeetOS" }, h(Icon, { name: "close", size: 16 })) : null);
}

/** A few lines of hex that change as the sync progresses. */
function HexDump({ seed }) {
  const lines = useMemo(() => Array.from({ length: 6 }).map((_, r) => {
    const addr = (0x7f3a00 + r * 16 + seed * 7).toString(16).toUpperCase();
    const bytes = Array.from({ length: 8 }).map(() => ((Math.random() * 256) | 0).toString(16).padStart(2, "0").toUpperCase()).join(" ");
    return `0x${addr}  ${bytes}`;
  }), [seed]);
  return h("pre", { className: "hex-dump", "aria-hidden": "true" }, lines.join("\n"));
}

function Thinking() {
  const [i, setI] = useState(() => Math.floor(Math.random() * THINKING_PHRASES.length));
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % THINKING_PHRASES.length), 1400);
    return () => clearInterval(id);
  }, []);
  return h("div", { className: "os-msg os-msg-clone" },
    h("div", { className: "os-msg-who" }, h("span", null, "ARIJEET // ENGRAM"), h("span", { className: "os-msg-tag blink" }, "PROCESSING")),
    h("div", { className: "os-thinking" }, THINKING_PHRASES[i], h("span", { className: "os-dots" }, h("i"), h("i"), h("i"))));
}

function AchievementToast({ id, onDone }) {
  const cfg = ACHIEVEMENTS_CONFIG[id];
  useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t); }, [onDone]);
  if (!cfg) return null;
  return h(motion.div, {
    className: "os-toast",
    role: "status",
    initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 24 },
    transition: { duration: 0.22, ease: EASE }
  },
    h("div", { className: "os-toast-label" }, "ACHIEVEMENT UNLOCKED"),
    h("div", { className: "os-toast-title" }, cfg.title),
    h("div", { className: "os-toast-desc" }, cfg.desc));
}

function RecruiterCard({ actions, onClose }) {
  const go = (id) => { actions.scrollToSection(id); onClose(); };
  return h("div", { className: "os-recruiter cut" },
    h("div", { className: "os-recruiter-title" }, "PRIORITY CONTACT // RECRUITER"),
    h("p", { className: "os-recruiter-text" }, "Flutter and Android developer, graduating 2027. Ships real apps: DropNet and FetchNet are live, UltraVision is in development."),
    h("div", { className: "os-recruiter-actions" },
      h("button", { className: "cp-btn cp-btn-solid", onClick: () => actions.downloadResume() }, "RESUME"),
      h("button", { className: "cp-btn", onClick: () => go("projects") }, "PROJECTS"),
      h("button", { className: "cp-btn", onClick: () => go("skills") }, "SKILLS"),
      h("button", { className: "cp-btn", onClick: () => go("contact") }, "CONTACT")));
}

function CoreAnimation({ stage, canvasMode }) {
  const src = stage === "sync"
    ? "assets/animations/neural_sync.json"
    : canvasMode === "matrix" ? "assets/animations/hacker_mode.json" : "assets/animations/Chat_Mode_Normal.json";
  // loop: true everywhere so the core never freezes after one play.
  return h("lottie-player", { key: src, src, background: "transparent", speed: "1", loop: true, autoplay: true, className: "os-lottie", style: { width: "100%", height: "100%", maxHeight: "128px" } });
}

function MatrixBackdrop({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || prefersReducedMotion()) return undefined;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let hgt = (canvas.height = window.innerHeight);
    const size = 15;
    let drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -60);
    const chars = "01{}<>/=#ARIJEETOS".split("");
    let raf;
    let last = 0;
    const onResize = () => { w = canvas.width = window.innerWidth; hgt = canvas.height = window.innerHeight; drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -60); };
    window.addEventListener("resize", onResize);
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 50) return;
      last = now;
      ctx.fillStyle = "rgba(6, 6, 10, 0.16)";
      ctx.fillRect(0, 0, w, hgt);
      ctx.font = `${size}px "Geist Mono", monospace`;
      drops.forEach((d, i) => {
        const r = Math.random();
        ctx.fillStyle = r > 0.985 ? `rgba(${CP_YELLOW}, 1)` : i % 7 === 0 ? `rgba(${CP_RED}, 0.55)` : `rgba(${CP_CYAN}, 0.45)`;
        ctx.fillText(pick(chars), i * size, d * size);
        drops[i] = d * size > hgt && Math.random() > 0.975 ? 0 : d + 1;
      });
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [active]);
  return active ? h("canvas", { ref, className: "os-matrix", "aria-hidden": "true" }) : null;
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function EngramOS({ isOpen, onClose, actions, initialPrompt = null }) {
  const [stage, setStage] = useState("boot");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 860);
  const [bootLines, setBootLines] = useState([]);
  const [bootIdx, setBootIdx] = useState(0);
  const [confirmInput, setConfirmInput] = useState(initialPrompt ? "y" : "");
  const [shuttingDown, setShuttingDown] = useState(false);
  const [syncPct, setSyncPct] = useState(0);
  const [syncDone, setSyncDone] = useState(false);

  const [coffee, setCoffee] = useState(87);
  const [sarcasm, setSarcasm] = useState(92);
  const [focus, setFocus] = useState("UltraVision");
  const [bugs, setBugs] = useState("Medium");
  const [activity, setActivity] = useState("High");

  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(() => loadAchievements());
  const [toasts, setToasts] = useState([]);
  const [canvasMode, setCanvasMode] = useState("neural");
  const [recruiter, setRecruiter] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [lastLatency, setLastLatency] = useState(0);

  const pendingPrompt = useRef(initialPrompt);
  const lastInteraction = useRef(Date.now());
  const idleShown = useRef(false);
  const threadEnd = useRef(null);
  const mainInput = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener("resize", onResize, { passive: true });
    document.body.classList.add("no-scroll");
    return () => { window.removeEventListener("resize", onResize); document.body.classList.remove("no-scroll"); };
  }, []);

  /* ---- achievements ---- */
  const unlock = useCallback((id) => {
    if (!ACHIEVEMENTS_CONFIG[id]) return;
    setUnlocked((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveAchievements(next);
      setToasts((q) => [...q, id]);
      return next;
    });
  }, []);
  const dismissToast = useCallback(() => setToasts((q) => q.slice(1)), []);

  useEffect(() => { if (isOpen) unlock("FIRST_CONTACT"); }, [isOpen, unlock]);

  /* ---- focus + scroll ---- */
  useEffect(() => {
    if (stage === "confirm") setTimeout(() => confirmRef.current?.focus(), 120);
    if (stage === "chat") setTimeout(() => mainInput.current?.focus(), 250);
  }, [stage]);
  useEffect(() => { threadEnd.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [messages, isLoading, bootLines, syncPct]);

  /* ---- Escape closes during chat; any key skips the boot ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && (stage === "chat" || stage === "boot")) { onClose(); return; }
      if (stage === "boot" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        setBootLines(BOOT_MESSAGES);
        setBootIdx(BOOT_MESSAGES.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, onClose]);

  /* ---- live metrics keep drifting so the panel feels alive ---- */
  useEffect(() => {
    if (stage !== "chat" && stage !== "sync") return undefined;
    const id = setInterval(() => {
      setCoffee((c) => Math.max(0, +(c - 0.08).toFixed(2)));
      setSarcasm((s) => { const n = s + (Math.random() - 0.5) * 2; return n >= 80 && n <= 100 ? +n.toFixed(1) : s; });
      if (Math.random() > 0.93) setBugs(pick(["Low", "Medium", "High", "Concerning"]));
      if (Math.random() > 0.9) setActivity(pick(["High", "Pulsing", "Hyperactive", "Stable", "Daydreaming"]));
    }, 2000);
    return () => clearInterval(id);
  }, [stage]);

  /* ---- boot ---- */
  useEffect(() => {
    if (!isOpen || stage !== "boot") return undefined;
    if (bootIdx < BOOT_MESSAGES.length) {
      const msg = BOOT_MESSAGES[bootIdx];
      const delay = /trauma|integrity/.test(msg) ? 520 + Math.random() * 260 : 140 + Math.random() * 180;
      const id = setTimeout(() => { setBootLines((p) => [...p, msg]); setBootIdx((i) => i + 1); }, delay);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setStage("confirm"), 700);
    return () => clearTimeout(id);
  }, [isOpen, stage, bootIdx]);

  /* ---- sync ---- */
  useEffect(() => {
    if (stage !== "sync") return undefined;
    let v = 0;
    let t1;
    let t2;
    const id = setInterval(() => {
      v = Math.min(100, v + 4 + Math.floor(Math.random() * 8));
      setSyncPct(v);
      if (v >= 100) {
        clearInterval(id);
        t1 = setTimeout(() => {
          setSyncDone(true);
          unlock("NEURAL_HANDSHAKE");
          lsSet("visited_engram_v3", "true");
          t2 = setTimeout(() => {
            setMessages([{ id: "init", sender: "clone", text: generateGreeting(loadAchievements()) }]);
            setStage("chat");
          }, 1500);
        }, 700);
      }
    }, 320 + Math.random() * 160);
    return () => { clearInterval(id); clearTimeout(t1); clearTimeout(t2); };
  }, [stage, unlock]);

  /* ---- idle nudge ---- */
  useEffect(() => {
    if (stage !== "chat") return undefined;
    const id = setInterval(() => {
      if (!idleShown.current && Date.now() - lastInteraction.current > 60000) {
        idleShown.current = true;
        setMessages((p) => [...p, {
          id: `idle-${Date.now()}`,
          sender: "clone",
          text: pick(["Still here?", "Try /quiz. I'll go easy on you.", "Fun fact: some bugs outlive the projects they were born in.", "Coffee level is getting concerning.", "Type /help if you're shy."])
        }]);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [stage]);

  /* ---- keyword reactions update the focus readout ---- */
  const react = useCallback((text) => {
    const t = text.toLowerCase();
    const map = [["dropnet", "DropNet"], ["ultravision", "UltraVision"], ["fetchnet", "FetchNet"], ["cli", "DropNet-CLI"], ["flutter", "Flutter widgets"], ["android", "Android SDK"], ["hire", "Recruiter mode"], ["resume", "Resume"], ["coffee", "Coffee"], ["bug", "Bugs"], ["hack", "Breach attempt"]];
    const hit = map.find(([k]) => t.includes(k));
    if (hit) setFocus(hit[1]);
    if (t.includes("coffee")) setCoffee((c) => Math.min(100, c + 15));
  }, []);

  /* ---- self-destruct ---- */
  const resetAll = useCallback(() => {
    setStage("boot"); setBootLines([]); setBootIdx(0); setMessages([]); setHistory([]);
    setCanvasMode("neural"); setShuttingDown(false); setIsLoading(false); setQuiz(null);
  }, []);

  const selfDestruct = useCallback(() => {
    setIsLoading(true);
    setInputVal("");
    const lines = ["Self-destruct armed.", "Purging DropNet transfer queue...", "Muting all UltraVision personas...", "Unlinking in 3...", "2...", "1...", "Goodbye, stranger."];
    let i = 0;
    const next = () => {
      if (i < lines.length) {
        const text = lines[i];
        setMessages((p) => [...p, { id: `destruct-${i}`, sender: "clone", text }]);
        i += 1;
        setTimeout(next, 650);
      } else {
        setShuttingDown(true);
        setTimeout(() => { onClose(); resetAll(); }, 1100);
      }
    };
    setTimeout(next, 600);
  }, [onClose, resetAll]);

  /* ---- actions ---- */
  const executeActions = useCallback((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((a) => {
      if (a === "DOWNLOAD_RESUME") actions.downloadResume();
      else if (a === "OPEN_CONTACT") actions.scrollToSection("contact");
      else if (a === "SCROLL_TO_PROJECTS") actions.scrollToSection("projects");
      else if (a === "SCROLL_TO_SKILLS") actions.scrollToSection("skills");
      else if (a === "SCROLL_TO_ABOUT") actions.scrollToSection("about");
      else if (a === "ENABLE_DARK_MODE") actions.setTheme("dark");
      else if (a === "ENABLE_LIGHT_MODE") actions.setTheme("light");
      else if (a === "RANDOM_THEME") { actions.changeAccentColor(null); setRecruiter(false); unlock("THEME_DESTROYER"); }
      else if (a.startsWith("THEME:")) { actions.changeAccentColor(a.slice(6)); setRecruiter(false); unlock("THEME_DESTROYER"); }
      else if (a === "MATRIX_RAIN") setCanvasMode("matrix");
      else if (a === "OPEN_PROJECT_DROPNET") { actions.openProject("dropnet"); unlock("PROJECT_EXPLORER"); }
      else if (a.startsWith("OPEN_PROJECT:")) { actions.openProject(a.slice(13)); unlock("PROJECT_EXPLORER"); }
    });
  }, [actions, unlock]);

  const pushClone = useCallback((text, extra = {}, onDone) => {
    setMessages((p) => [...p, { id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender: "clone", text, streaming: true, onDone, ...extra }]);
  }, []);

  const finishStream = useCallback((msg) => {
    setMessages((p) => p.map((m) => (m.id === msg.id ? { ...m, streaming: false } : m)));
    msg.onDone?.();
  }, []);

  /* ---- send ---- */
  const send = useCallback(async (override) => {
    const text = (typeof override === "string" ? override : inputVal).trim();
    if (!text || isLoading) return;
    setInputVal("");
    lastInteraction.current = Date.now();
    idleShown.current = false;
    react(text);

    setMessages((p) => [...p, { id: `u-${Date.now()}`, sender: "user", text }]);
    const updated = [...history, { role: "user", text }];

    const det = deterministicFilter(text, {
      quiz, setQuiz, unlocked, coffee, sarcasm, focus, bugs, fallback, lastLatency,
      setCoffee, setSarcasm, triggerDestruct: selfDestruct
    });

    if (det.handled === true) {
      if (det.achievement) unlock(det.achievement);
      if (det.actions) executeActions(det.actions);
      if (det.clearChat) {
        setRecruiter(false);
        setTimeout(() => { setMessages([{ id: "cleared", sender: "clone", text: det.reply }]); setHistory([]); }, 250);
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        pushClone(det.reply, det.isRecruiter ? { recruiter: true } : {}, () => {
          if (det.isRecruiter) setRecruiter(true);
          if (det.close) setTimeout(onClose, 600);
          setHistory([...updated, { role: "model", text: det.reply }]);
        });
      }, 180 + Math.random() * 300);
      return;
    }

    const outgoing = det.handled === "ai" ? det.message : text;
    if (det.handled === "ai" && det.achievement) unlock(det.achievement);
    setIsLoading(true);
    const started = performance.now();
    try {
      const result = await askGemini(outgoing, updated.slice(-12, -1));
      setLastLatency(performance.now() - started);
      setIsLoading(false);
      setFallback(false);
      const isRec = result.achievement === "RECRUITER_DETECTED";
      pushClone(result.reply || "...", isRec ? { recruiter: true } : {}, () => {
        if (result.actions?.length) executeActions(result.actions);
        if (result.achievement) unlock(result.achievement);
        if (isRec) setRecruiter(true);
        setHistory([...updated, { role: "model", text: result.reply || "" }]);
      });
    } catch (err) {
      console.warn("[ArijeetOS] Gemini unavailable, using local memory:", err.message);
      setIsLoading(false);
      setFallback(true);
      const reply = det.handled === "ai" ? det.fallback : localFallback(text, actions);
      pushClone(reply, {}, () => setHistory([...updated, { role: "model", text: reply }]));
    }
  }, [inputVal, isLoading, history, quiz, unlocked, coffee, sarcasm, focus, bugs, fallback, lastLatency, react, unlock, executeActions, pushClone, selfDestruct, onClose, actions]);

  /* ---- run a prompt passed in from the website once chat is ready ---- */
  useEffect(() => {
    if (stage !== "chat" || !pendingPrompt.current) return undefined;
    const p = pendingPrompt.current;
    pendingPrompt.current = null;
    const id = setTimeout(() => send(p), 900);
    return () => clearTimeout(id);
  }, [stage, send]);

  /* ---- confirm stage ---- */
  const submitConfirm = (e) => {
    e.preventDefault();
    const v = confirmInput.toLowerCase().trim();
    if (!v) return;
    setConfirmInput("");
    if (v === "y" || v === "yes") setStage("sync");
    else if (v === "n" || v === "no") {
      setBootLines((p) => [...p, `> ${v}`, "Acknowledged. Closing synaptic bridge.", "Goodbye, stranger."]);
      setShuttingDown(true);
      setTimeout(() => { onClose(); resetAll(); }, 1100);
    } else {
      setBootLines((p) => [...p, `> ${v}`, "Unrecognized. Type y or n."]);
    }
  };

  /* ======================================================================
     RENDER
     ====================================================================== */

  const linkLabel = fallback ? "LOCAL MEMORY" : "LINK STABLE";
  const achCount = `${unlocked.size}/${Object.keys(ACHIEVEMENTS_CONFIG).length}`;

  const leftPane = h("aside", { className: "os-side cut", "aria-label": "ArijeetOS status" },
    h(HudBar, { title: "SUBJECT // A.DAS", right: "ID 0x2027" }),
    h("div", { className: "os-id" },
      h("div", { className: "os-avatar cut-sm" }, h(GlyphPortrait, { cell: 4, mode: isLoading ? "busy" : "idle", rgb: CP_YELLOW })),
      h("div", { className: "os-id-text" },
        h(Glitch, { as: "div", className: "os-name", text: "ARIJEET DAS" }),
        h("div", { className: `os-status ${fallback ? "warn" : ""}` }, h("span", { className: "os-led" }), linkLabel),
        h("div", { className: "os-id-meta" }, "KOLKATA // FLUTTER // ANDROID"))),
    h("div", { className: "os-core" },
      h("span", { className: "bracket tl" }), h("span", { className: "bracket tr" }), h("span", { className: "bracket bl" }), h("span", { className: "bracket br" }),
      h(CoreAnimation, { stage, canvasMode }),
      h("span", { className: "os-core-label" }, canvasMode === "matrix" ? "CORE // BREACHED" : "CORE // ENGRAM")),
    h("div", { className: "os-side-scroll" },
      h("h3", { className: "os-label" }, h("span", null, "DIAGNOSTICS"), h("span", { className: "os-label-line" })),
      h("dl", { className: "os-metrics" },
        [["COFFEE", coffee, "yellow"], ["SARCASM", sarcasm, "cyan"], ["STABILITY", 99.8, "yellow"]].map(([k, v, tone]) =>
          h("div", { key: k, className: "os-metric" },
            h("dt", null, k),
            h("dd", null, `${Math.round(v)}%`),
            h(SegBar, { value: v, tone }))),
        [["FOCUS", focus], ["BUG RISK", bugs], ["ACTIVITY", activity]].map(([k, v]) =>
          h("div", { key: k, className: "os-metric os-metric-text" }, h("dt", null, k), h("dd", null, String(v).toUpperCase())))),
      h("h3", { className: "os-label" }, h("span", null, `ACHIEVEMENTS ${achCount}`), h("span", { className: "os-label-line" })),
      h("ul", { className: "os-achievements" },
        Object.entries(ACHIEVEMENTS_CONFIG).map(([id, cfg]) => {
          const on = unlocked.has(id);
          return h("li", { key: id, className: `os-ach ${on ? "on" : ""}` },
            h("span", { className: "os-ach-mark" }, on ? "■" : "□"),
            h("div", null, h("div", { className: "os-ach-title" }, on ? cfg.title.toUpperCase() : "ENCRYPTED"), h("div", { className: "os-ach-desc" }, on ? cfg.desc : "Keep talking to decrypt this.")));
        })))
  );

  const chatPane = h("section", { className: "os-main cut", "aria-label": "Conversation" },
    h(HudBar, {
      title: stage === "sync" ? "UPLINK // NEURAL SYNC" : "ARIJEET_OS // ENGRAM v4.2",
      right: h("span", { className: `os-status ${fallback ? "warn" : ""}` }, h("span", { className: "os-led" }), fallback ? "LOCAL" : "GEMINI"),
      onClose
    }),

    stage === "sync"
      ? h("div", { className: "os-sync" },
          h("div", { className: "os-sync-top" },
            h("div", null,
              h("div", { className: "os-kicker" }, "NEURAL LINK // HANDSHAKE"),
              h(Glitch, { as: "h2", className: "os-sync-title", text: syncDone ? "LINK ESTABLISHED" : "SYNCHRONIZING" })),
            h("div", { className: "os-sync-pct" }, String(syncPct).padStart(3, "0"), h("span", null, "%"))),
          h(SegBar, { value: syncPct, segments: 40, className: "seg-lg" }),
          h("div", { className: "os-sync-grid" },
            h("ol", { className: "os-sync-list" },
              SYNC_STEPS.map((s, i) => {
                const done = syncPct >= s.threshold;
                const active = !done && (i === 0 || syncPct >= SYNC_STEPS[i - 1].threshold);
                return h("li", { key: s.label, className: `os-sync-item ${done ? "done" : active ? "active" : ""}` },
                  h("span", { className: "os-sync-code" }, `0${i + 1}`),
                  h("span", { className: "os-sync-label" }, s.label.toUpperCase()),
                  h("span", { className: "os-sync-state" }, done ? "[ OK ]" : active ? "[ .. ]" : "[ -- ]"));
              })),
            h("div", { className: "os-sync-side" },
              h("div", { className: "os-kicker" }, "MEMORY DUMP"),
              h(HexDump, { seed: Math.floor(syncPct / 6) }))),
          syncDone ? h(motion.p, { className: "os-sync-hello", initial: { opacity: 0, x: -8 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.3, ease: EASE } }, "> HELLO. I'M ARIJEET.") : null)
      : null,

    stage === "chat"
      ? h(React.Fragment, null,
          h("div", { className: "os-thread", role: "log", "aria-live": "polite" },
            messages.map((m) =>
              h(React.Fragment, { key: m.id },
                h("div", { className: `os-msg os-msg-${m.sender} ${m.streaming ? "glitch-in" : ""}` },
                  h("div", { className: "os-msg-who" }, h("span", null, m.sender === "clone" ? "ARIJEET // ENGRAM" : "YOU // GUEST")),
                  h("div", { className: "os-msg-text" },
                    m.streaming ? h(StreamingText, { text: m.text, onDone: () => finishStream(m) }) : renderRich(m.text))),
                m.recruiter && !m.streaming ? h(RecruiterCard, { actions, onClose }) : null)),
            isLoading ? h(Thinking) : null,
            h("div", { ref: threadEnd })),
          h("div", { className: "os-suggestions", role: "toolbar", "aria-label": "Suggested prompts" },
            SUGGESTIONS.map((s) => h("button", { key: s.label, className: "os-chip", disabled: isLoading, onClick: () => send(s.text) }, s.label))),
          h("form", { className: "os-input", onSubmit: (e) => { e.preventDefault(); send(); } },
            h("span", { className: "os-caret", "aria-hidden": "true" }, "TX>"),
            h("input", {
              ref: mainInput,
              value: inputVal,
              onChange: (e) => setInputVal(e.target.value),
              placeholder: isLoading ? "PROCESSING" : quiz ? "Answer a, b or c" : "Ask about my projects, or /help",
              disabled: isLoading,
              "aria-label": "Message ArijeetOS",
              autoComplete: "off",
              enterKeyHint: "send"
            }),
            h("button", { type: "submit", className: "cp-btn cp-btn-solid os-send", disabled: isLoading || !inputVal.trim() }, h(Icon, { name: "send", size: 14 }), h("span", null, "TRANSMIT"))))
      : null
  );

  return h(motion.div, {
    className: `os ${recruiter ? "os-recruiter-mode" : ""} ${shuttingDown ? "os-shutdown" : ""} ${canvasMode === "matrix" ? "os-breach" : ""}`,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "ArijeetOS",
    initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
    transition: { duration: 0.24, ease: EASE }
  },
    h(MatrixBackdrop, { active: canvasMode === "matrix" }),
    h("div", { className: "os-scanlines", "aria-hidden": "true" }),
    h("div", { className: "os-toasts" }, h(AnimatePresence, null, toasts.length ? h(AchievementToast, { key: toasts[0], id: toasts[0], onDone: dismissToast }) : null)),

    stage === "boot" || stage === "confirm"
      ? h("div", { className: "os-boot" },
          h("div", { className: "os-boot-window cut" },
            h(HudBar, { title: "CORE@ARIJEET-OS // SYNAPTIC_BRIDGE", right: "v4.2", onClose }),
            h("div", { className: "os-boot-body" },
              bootLines.map((l, i) => h("div", { key: i, className: "os-boot-line" }, h("span", { className: "os-boot-ok" }, "[OK]"), " ", l)),
              stage === "boot"
                ? h("div", { className: "os-boot-line" }, h("span", { className: "block-cursor" }), h("span", { className: "os-skip" }, "  ENTER TO SKIP"))
                : h("div", { className: "os-confirm" },
                    h(Glitch, { as: "p", className: "os-confirm-title", text: "ARIJEET_CONSCIOUSNESS v4.2" }),
                    h("p", null, "Archive online. Establish a neural link with my mind?"),
                    h("div", { className: "os-confirm-choices" },
                      h("button", { type: "button", className: "cp-btn cp-btn-solid", onClick: () => { setConfirmInput(""); setStage("sync"); } }, "[Y] JACK IN"),
                      h("button", { type: "button", className: "cp-btn", onClick: () => { setConfirmInput("n"); setTimeout(() => confirmRef.current?.form?.requestSubmit(), 0); } }, "[N] DISCONNECT")),
                    h("form", { className: "os-confirm-row", onSubmit: submitConfirm },
                      h("label", { htmlFor: "os-confirm", className: "os-caret" }, ">"),
                      h("input", { id: "os-confirm", ref: confirmRef, value: confirmInput, onChange: (e) => setConfirmInput(e.target.value), autoComplete: "off", "aria-label": "Type y or n", enterKeyHint: "go" }))),
              h("div", { ref: threadEnd }))))
      : h(motion.div, {
          className: "os-shell",
          initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: EASE }
        }, isMobile ? null : leftPane, chatPane)
  );
}
