#!/usr/bin/env node
/**
 * build-knowledge.cjs — compiles the editable `content/` folder into the files
 * the website and the Engram AI actually read.
 *
 *   content/manifest.json        category order + profile version
 *   content/profile/<key>.json   one AI knowledge category per file
 *   content/notes/<slug>.md      free-form knowledge documents (optional front matter)
 *   content/site.json            text, skills, projects and contact shown on the website
 *   assets/<folder>/*            downloadable documents (certificates, resume, ...)
 *
 * Outputs (both committed, so Vercel needs no build step):
 *   data/knowledge.json          read by the server (dev-server.cjs and api/engram.js)
 *   data/arijeet-profile.js      ES module read by the browser (script.js, engram.js)
 *
 * Usage: `npm run build:knowledge`, or require() it and call buildKnowledge().
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const PROFILE_DIR = path.join(CONTENT, "profile");
const NOTES_DIR = path.join(CONTENT, "notes");
const DATA_DIR = path.join(ROOT, "data");

/** Asset folders whose files are listed for the AI so it can link to them. */
const DOCUMENT_FOLDERS = ["resume", "Certificates", "internship", "documents"];

const SLUG_RE = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function readJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    errors.push(`${path.relative(ROOT, file)}: ${err.message}`);
    return undefined;
  }
}

/** Parses an optional `---\nkey: value\n---` header at the top of a note. */
function parseNote(raw) {
  const meta = {};
  let body = raw.replace(/^﻿/, "");
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    body = body.slice(match[0].length);
  }
  return { meta, body: body.trim() };
}

/**
 * Returns the on-disk spelling of an assets/ sub-folder (e.g. "Documents" when
 * asked for "documents"). Windows is case-insensitive but Vercel (Linux) is not,
 * so generated links must use the real casing that git commits.
 */
function resolveAssetFolder(name) {
  const assets = path.join(ROOT, "assets");
  try {
    const match = fs.readdirSync(assets, { withFileTypes: true })
      .find((d) => d.isDirectory() && d.name.toLowerCase() === String(name).toLowerCase());
    if (match) return match.name;
  } catch { /* assets/ missing */ }
  return name;
}

function listDocuments() {
  const docs = [];
  for (const wanted of DOCUMENT_FOLDERS) {
    const folder = resolveAssetFolder(wanted);
    const dir = path.join(ROOT, "assets", folder);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (!fs.statSync(full).isFile()) continue;
      docs.push({
        folder,
        name: name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
        path: `assets/${folder}/${name}`
      });
    }
  }
  return docs;
}

function validateSite(site, errors) {
  if (!site || typeof site !== "object") {
    errors.push("content/site.json must contain an object");
    return;
  }
  const items = site.projects && site.projects.items;
  if (!Array.isArray(items)) errors.push("site.json: projects.items must be a list");
  else items.forEach((p, i) => {
    if (!p || !p.id || !p.title) errors.push(`site.json: projects.items[${i}] needs an "id" and a "title"`);
  });
  const cats = site.skills && site.skills.categories;
  if (!Array.isArray(cats)) errors.push("site.json: skills.categories must be a list");
  else cats.forEach((c, i) => {
    if (!c || !c.title || !Array.isArray(c.items)) errors.push(`site.json: skills.categories[${i}] needs a "title" and an "items" list`);
  });
  if (site.contact && !Array.isArray(site.contact.channels)) errors.push("site.json: contact.channels must be a list");
}

/**
 * Reads content/, validates it, and (unless dryRun) writes the data/ outputs.
 * Returns { ok, errors, stats, knowledge }.
 */
function buildKnowledge({ dryRun = false } = {}) {
  const errors = [];
  const manifest = readJson(path.join(CONTENT, "manifest.json"), errors) || {};
  const order = Array.isArray(manifest.profileOrder) ? manifest.profileOrder : [];

  // ---- Profile categories (ordered by manifest, new files appended A–Z) ----
  const files = fs.existsSync(PROFILE_DIR)
    ? fs.readdirSync(PROFILE_DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5))
    : [];
  const keys = [
    ...order.filter((k) => files.includes(k)),
    ...files.filter((k) => !order.includes(k)).sort()
  ];

  const profile = {
    version: manifest.version || "2.0",
    lastUpdated: new Date().toISOString().slice(0, 10)
  };
  for (const key of keys) {
    if (!SLUG_RE.test(key)) {
      errors.push(`content/profile/${key}.json: file name must start with a letter and use only letters, digits, - or _`);
      continue;
    }
    const value = readJson(path.join(PROFILE_DIR, `${key}.json`), errors);
    if (value !== undefined) profile[key] = value;
  }

  // ---- Free-form notes ----
  const notes = [];
  if (fs.existsSync(NOTES_DIR)) {
    for (const file of fs.readdirSync(NOTES_DIR).filter((f) => /\.(md|txt)$/i.test(f)).sort()) {
      const { meta, body } = parseNote(fs.readFileSync(path.join(NOTES_DIR, file), "utf8"));
      if (!body) continue;
      notes.push({
        id: file.replace(/\.(md|txt)$/i, ""),
        title: meta.title || file.replace(/\.(md|txt)$/i, ""),
        category: meta.category || "general",
        content: body
      });
    }
  }

  // ---- Website content ----
  const site = readJson(path.join(CONTENT, "site.json"), errors);
  validateSite(site, errors);

  const documents = listDocuments();

  if (errors.length) return { ok: false, errors };

  const knowledge = { profile, site, notes, documents };
  const stats = {
    categories: keys.length,
    notes: notes.length,
    documents: documents.length,
    projects: site.projects.items.length,
    knowledgeChars: JSON.stringify(knowledge).length
  };

  if (!dryRun) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, "knowledge.json"), JSON.stringify(knowledge, null, 2) + "\n");

    const header = "/* AUTO-GENERATED by scripts/build-knowledge.cjs. Do not edit by hand:\n" +
      "   change files in content/ (or use the Knowledge Studio at /admin) and rebuild. */\n\n";
    const js = header +
      `export const ARIJEET_PROFILE = ${JSON.stringify(profile, null, 2)};\n\n` +
      `export const SITE_CONTENT = ${JSON.stringify(site, null, 2)};\n\n` +
      `export const KNOWLEDGE_NOTES = ${JSON.stringify(notes, null, 2)};\n\n` +
      `export const KNOWLEDGE_DOCUMENTS = ${JSON.stringify(documents, null, 2)};\n`;
    fs.writeFileSync(path.join(DATA_DIR, "arijeet-profile.js"), js);
  }

  return { ok: true, errors: [], stats, knowledge };
}

module.exports = { buildKnowledge, parseNote, resolveAssetFolder, SLUG_RE, DOCUMENT_FOLDERS, ROOT, CONTENT, PROFILE_DIR, NOTES_DIR };

if (require.main === module) {
  const dryRun = process.argv.includes("--check");
  const result = buildKnowledge({ dryRun });
  if (!result.ok) {
    console.error("Knowledge build failed:\n  - " + result.errors.join("\n  - "));
    process.exit(1);
  }
  console.log(`${dryRun ? "Knowledge check passed" : "Knowledge built"}: ${JSON.stringify(result.stats)}`);
}
