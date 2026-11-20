/* shared.js — pieces used by the website, ArijeetOS and the secret terminal. */

import React, { useEffect, useRef } from "react";

const h = React.createElement;

/* ==========================================================================
   ICONS — lucide paths (ISC licence), 24px grid, 1.5 stroke
   ========================================================================== */

const ICONS = {
  arrowUpRight: [["path", { d: "M7 7h10v10" }], ["path", { d: "M7 17 17 7" }]],
  download: [["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }], ["path", { d: "m7 10 5 5 5-5" }], ["path", { d: "M12 15V3" }]],
  mail: [["rect", { width: 20, height: 16, x: 2, y: 4, rx: 2 }], ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }]],
  phone: [["path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }]],
  github: [["path", { d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" }], ["path", { d: "M9 18c-4.51 2-5-2-7-2" }]],
  linkedin: [["path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }], ["rect", { width: 4, height: 12, x: 2, y: 9 }], ["circle", { cx: 4, cy: 4, r: 2 }]],
  whatsapp: [["path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }]],
  terminal: [["path", { d: "m4 17 6-6-6-6" }], ["path", { d: "M12 19h8" }]],
  close: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  lock: [["rect", { width: 18, height: 11, x: 3, y: 11, rx: 2 }], ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]],
  send: [["path", { d: "m22 2-7 20-4-9-9-4Z" }], ["path", { d: "M22 2 11 13" }]],
  file: [["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }], ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }]],
  phoneDevice: [["rect", { width: 14, height: 20, x: 5, y: 2, rx: 2 }], ["path", { d: "M12 18h.01" }]],
  laptop: [["path", { d: "M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" }]],
  award: [["circle", { cx: 12, cy: 8, r: 6 }], ["path", { d: "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" }]],
  cpu: [["rect", { width: 16, height: 16, x: 4, y: 4, rx: 2 }], ["rect", { width: 6, height: 6, x: 9, y: 9, rx: 1 }], ["path", { d: "M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" }]],
  mapPin: [["path", { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" }], ["circle", { cx: 12, cy: 10, r: 3 }]],
  cap: [["path", { d: "M22 10v6M2 10l10-5 10 5-10 5z" }], ["path", { d: "M6 12v5c3 3 9 3 12 0v-5" }]],
  briefcase: [["rect", { width: 20, height: 14, x: 2, y: 7, rx: 2 }], ["path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" }]],
  coffee: [["path", { d: "M10 2v2M14 2v2M6 2v2" }], ["path", { d: "M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" }]],
  menu: [["path", { d: "M4 6h16M4 12h16M4 18h16" }]],
  chevronDown: [["path", { d: "m6 9 6 6 6-6" }]],
  sun: [["circle", { cx: 12, cy: 12, r: 4 }], ["path", { d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" }]],
  moon: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
  wifi: [["path", { d: "M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0" }]],
  play: [["path", { d: "m6 3 14 9-14 9V3z" }]],
  user: [["circle", { cx: 12, cy: 8, r: 5 }], ["path", { d: "M20 21a8 8 0 0 0-16 0" }]]
};

export function Icon({ name, size = 16, className = "", title }) {
  const parts = ICONS[name] || [];
  return h(
    "svg",
    {
      className: `icon ${className}`.trim(),
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.5,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": title ? undefined : "true",
      role: title ? "img" : undefined
    },
    title ? h("title", null, title) : null,
    parts.map(([tag, attrs], i) => h(tag, { key: i, ...attrs }))
  );
}

/* ==========================================================================
   PHOSPHOR THEMES — accent colours named after CRT phosphors
   ========================================================================== */

export const PHOSPHORS = ["amber", "green", "cyan", "rose", "white"];

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } }
};

export function getPhosphor() {
  return document.documentElement.dataset.phosphor || "amber";
}

export function applyPhosphor(name) {
  const next = name === "random" || !PHOSPHORS.includes(name)
    ? PHOSPHORS.filter((p) => p !== getPhosphor())[Math.floor(Math.random() * (PHOSPHORS.length - 1))]
    : name;
  document.documentElement.dataset.phosphor = next;
  store.set("arijeet.phosphor", next);
  window.dispatchEvent(new CustomEvent("phosphor-change", { detail: next }));
  return next;
}

export function getTheme() {
  return document.documentElement.dataset.theme || "dark";
}

export function applyTheme(theme) {
  const next = theme === "toggle" ? (getTheme() === "dark" ? "light" : "dark") : theme;
  document.documentElement.dataset.theme = next;
  store.set("arijeet.theme", next);
  window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
  return next;
}

export function restoreAppearance() {
  const p = store.get("arijeet.phosphor");
  const t = store.get("arijeet.theme");
  document.documentElement.dataset.phosphor = PHOSPHORS.includes(p) ? p : "amber";
  document.documentElement.dataset.theme = t === "light" ? "light" : "dark";
}

export function readAccent() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
  return v || "242, 169, 59";
}

/* ==========================================================================
   TIME, MOTION
   ========================================================================== */

export function kolkataTime(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }).format(date);
  } catch {
    return date.toTimeString().slice(0, 5);
  }
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================================
   CODE HIGHLIGHTER — tiny tokenizer for the Dart / shell snippets
   ========================================================================== */

const KEYWORDS = new Set(["final", "await", "while", "const", "class", "return", "if", "else", "var", "void", "async", "for", "in", "new", "true", "false", "null"]);

export function tokenize(line) {
  if (/^\s*(\/\/|#)/.test(line)) return [{ t: "comment", v: line }];
  if (line.startsWith("$ ")) {
    const hash = line.indexOf(" #");
    if (hash > 0) return [{ t: "prompt", v: "$ " }, { t: "plain", v: line.slice(2, hash) }, { t: "comment", v: line.slice(hash) }];
    return [{ t: "prompt", v: "$ " }, { t: "plain", v: line.slice(2) }];
  }
  if (line.startsWith("> ")) return [{ t: "muted", v: line }];
  const tokens = [];
  const re = /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\/\/.*$|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b|\s+|.)/g;
  let m;
  while ((m = re.exec(line))) {
    const v = m[0];
    let t = "plain";
    if (v.startsWith("'") || v.startsWith('"')) t = "string";
    else if (v.startsWith("//")) t = "comment";
    else if (/^\d/.test(v)) t = "number";
    else if (KEYWORDS.has(v)) t = "keyword";
    else if (/^[A-Z]/.test(v)) t = "type";
    tokens.push({ t, v });
  }
  return tokens;
}

/* ==========================================================================
   GLYPH PORTRAIT — the profile photo drawn in code glyphs, always shifting
   ========================================================================== */

const GLYPHS = " .:-=/<>{}#";

/**
 * mode: "idle" (slow shimmer) | "busy" (faster, used while ArijeetOS thinks)
 * crop: fraction of the source square to sample, centred on the face.
 */
export function GlyphPortrait({ src = "assets/profile.png", cell = 7, mode = "idle", rgb = null, className = "", label = "Portrait of Arijeet Das drawn in code characters" }) {
  const canvasRef = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let cells = [];
    let cols = 0;
    let rows = 0;
    let visible = true;
    let disposed = false;
    let accent = rgb || readAccent();
    const reduced = prefersReducedMotion();
    const img = new Image();
    img.decoding = "async";
    img.src = src;

    const onPhosphor = () => { accent = rgb || readAccent(); };
    window.addEventListener("phosphor-change", onPhosphor);
    window.addEventListener("theme-change", onPhosphor);

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !img.naturalWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(rect.width / cell);
      rows = Math.floor(rect.height / (cell * 1.25));

      const s = document.createElement("canvas");
      s.width = cols;
      s.height = rows;
      const sx = s.getContext("2d", { willReadFrequently: true });
      // Face-centred square crop, same framing as the favicon.
      const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.62;
      const ox = (img.naturalWidth - size) / 2;
      const oy = img.naturalHeight * 0.02;
      sx.drawImage(img, ox, oy, size, size, 0, 0, cols, rows);
      const px = sx.getImageData(0, 0, cols, rows).data;
      cells = [];
      let lo = 1;
      let hi = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const light = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
          if (light > 0.9) continue; // white studio background stays empty
          lo = Math.min(lo, light);
          hi = Math.max(hi, light);
          cells.push({ x, y, light, seed: Math.random() * 1000 });
        }
      }
      // Stretch contrast so the face reads clearly, then lift the mid-tones.
      const span = Math.max(0.05, hi - lo);
      cells.forEach((c) => { c.light = Math.pow((c.light - lo) / span, 0.75); });
    };

    let step = 0;
    let last = 0;
    const draw = (now) => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.font = `500 ${cell + 1}px "Geist Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      const busy = modeRef.current === "busy";
      const sweep = (now / (busy ? 18 : 45)) % (rows + 20) - 10; // a scan band rolls down the face
      for (const c of cells) {
        const flicker = Math.sin(c.seed + step * (busy ? 0.9 : 0.35)) > (busy ? 0.6 : 0.88) ? 2 : 0;
        const band = Math.max(0, 1 - Math.abs(c.y - sweep) / 3);
        const idx = Math.min(GLYPHS.length - 1, Math.max(1, Math.round(c.light * (GLYPHS.length - 1)) + flicker));
        const alpha = Math.min(1, 0.28 + c.light * 0.72 + band * 0.3);
        ctx.fillStyle = `rgba(${accent}, ${alpha.toFixed(3)})`;
        ctx.fillText(GLYPHS[idx], c.x * cell, c.y * cell * 1.25);
      }
    };

    const loop = (now) => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      const fps = modeRef.current === "busy" ? 16 : 9;
      if (!visible || now - last < 1000 / fps) return;
      last = now;
      step++;
      draw(now);
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const ro = new ResizeObserver(() => { build(); draw(performance.now()); });

    img.onload = () => {
      if (disposed) return;
      build();
      ro.observe(canvas);
      if (reduced) draw(0);
      else raf = requestAnimationFrame(loop);
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("phosphor-change", onPhosphor);
      window.removeEventListener("theme-change", onPhosphor);
    };
  }, [src, cell, rgb]);

  return h("canvas", { ref: canvasRef, className: `glyph-portrait ${className}`.trim(), role: "img", "aria-label": label });
}

/* ==========================================================================
   CIPHER PORTRAIT — the photo shown as ciphertext that decrypts into a
   phosphor-toned picture, then encrypts again, on a loop.
   ========================================================================== */

const HEX = "0123456789abcdef";
const CYCLE = [
  ["encrypted", 2600],
  ["decrypting", 1900],
  ["decrypted", 4200],
  ["encrypting", 1500]
];

/**
 * onStatus(phase, pct) is called when the visible status changes (phase or 10% step).
 * reveal=true (hover/focus) decrypts and holds; false resumes the cycle.
 */
export function CipherPortrait({ src = "assets/profile.png", cell = 6, reveal = false, onStatus, className = "", label = "Photo of Arijeet Das" }) {
  const canvasRef = useRef(null);
  const revealRef = useRef(reveal);
  revealRef.current = reveal;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduced = prefersReducedMotion();
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    let disposed = false;
    let raf = 0;
    let visible = true;
    let W = 0;
    let H = 0;
    let photo = null;   // pre-toned photo canvas
    let cells = [];
    let cols = 0;
    let rows = 0;
    let rowH = 0;
    let accent = readAccent();

    // cycle state
    let phaseIdx = 0;
    let phaseStart = performance.now();
    let revealPos = 0; // 0..1, how much of the photo is decrypted (top down)
    let lastStatus = "";
    // Phones get a lighter frame rate; the effect still reads as smooth.
    const FPS = window.matchMedia && window.matchMedia("(hover: none)").matches ? 20 : 30;

    const report = (phase, pct) => {
      const key = `${phase}:${Math.floor(pct / 10)}`;
      if (key !== lastStatus) { lastStatus = key; statusRef.current?.(phase, Math.round(pct)); }
    };

    const crop = () => {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const aspect = H / W;
      // Show from the top of the hair down past the chin (about 62% of the photo),
      // widening the crop for wide frames so the face sits in a field of ciphertext.
      let ch = ih * 0.62;
      let cw = ch / aspect;
      if (cw > iw) { cw = iw; ch = cw * aspect; }
      if (ch > ih * 0.98) { ch = ih * 0.98; cw = ch / aspect; }
      return { sx: (iw - cw) / 2, sy: ih * 0.02, sw: cw, sh: ch };
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !img.naturalWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = crop();
      const [ar, ag, ab] = accent.split(",").map((n) => parseInt(n, 10));

      // 1. phosphor-toned photo with soft CRT scanlines, background dropped
      const pw = canvas.width;
      const ph = canvas.height;
      photo = document.createElement("canvas");
      photo.width = pw;
      photo.height = ph;
      const px = photo.getContext("2d", { willReadFrequently: true });
      px.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, pw, ph);
      const data = px.getImageData(0, 0, pw, ph);
      const d = data.data;
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        const keep = Math.min(1, Math.max(0, (0.93 - l) / 0.06)); // fade out the white studio background
        const tone = Math.pow(Math.min(1, l / 0.88), 0.9);
        const y = Math.floor(p / pw);
        const scan = (y % 3 === 0) ? 0.78 : 1;
        // ink (11,13,20) → phosphor, keeping a hint of the original colour
        d[i] = (11 + (ar - 11) * tone) * 0.86 * scan + d[i] * 0.14 * tone;
        d[i + 1] = (13 + (ag - 13) * tone) * 0.86 * scan + d[i + 1] * 0.14 * tone;
        d[i + 2] = (20 + (ab - 20) * tone) * 0.86 * scan + d[i + 2] * 0.14 * tone;
        d[i + 3] = 255 * keep;
      }
      px.putImageData(data, 0, 0);

      // 2. ciphertext grid sampled from the same crop
      cols = Math.floor(W / cell);
      rowH = cell * 1.3;
      rows = Math.floor(H / rowH);
      const s = document.createElement("canvas");
      s.width = cols;
      s.height = rows;
      const sx = s.getContext("2d", { willReadFrequently: true });
      sx.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, cols, rows);
      const sp = sx.getImageData(0, 0, cols, rows).data;
      cells = [];
      let lo = 1;
      let hi = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const l = (0.2126 * sp[i] + 0.7152 * sp[i + 1] + 0.0722 * sp[i + 2]) / 255;
          const bg = l > 0.9;
          if (!bg) { lo = Math.min(lo, l); hi = Math.max(hi, l); }
          cells.push({ x, y, l, bg, ch: HEX[(Math.random() * 16) | 0] });
        }
      }
      const span = Math.max(0.05, hi - lo);
      cells.forEach((cc) => { if (!cc.bg) cc.l = Math.pow((cc.l - lo) / span, 0.8); });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const cut = revealPos * H;

      // decrypted part
      if (photo && cut > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, cut);
        ctx.clip();
        ctx.drawImage(photo, 0, 0, W, H);
        ctx.restore();
      }

      // ciphertext part
      ctx.font = `500 ${cell + 1}px "Geist Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      for (const c of cells) {
        const y = c.y * rowH;
        if (y + rowH <= cut) continue;
        if (Math.random() < 0.035) c.ch = HEX[(Math.random() * 16) | 0];
        const near = Math.max(0, 1 - Math.abs(y - cut) / (rowH * 3));
        const a = c.bg ? 0.07 + near * 0.4 : 0.22 + c.l * 0.78;
        ctx.fillStyle = `rgba(${accent}, ${Math.min(1, a + near * 0.3).toFixed(3)})`;
        ctx.fillText(c.ch, c.x * cell, y);
      }

      // the decrypt head: a bright scan line
      if (cut > 0 && cut < H) {
        ctx.fillStyle = `rgba(${accent}, 0.9)`;
        ctx.fillRect(0, cut - 1, W, 2);
      }
    };

    const step = (now) => {
      const forced = revealRef.current;
      const [phase, dur] = CYCLE[phaseIdx];
      const t = Math.min(1, (now - phaseStart) / dur);
      const ease = (x) => 1 - Math.pow(1 - x, 3);

      if (forced) {
        revealPos = Math.min(1, revealPos + 0.06);
        report(revealPos >= 1 ? "decrypted" : "decrypting", revealPos * 100);
        // resume from the hold phase when the pointer leaves
        phaseIdx = 2;
        phaseStart = now;
        return;
      }
      if (phase === "encrypted") { revealPos = 0; report(phase, 0); }
      else if (phase === "decrypting") { revealPos = ease(t); report(phase, revealPos * 100); }
      else if (phase === "decrypted") { revealPos = 1; report(phase, 100); }
      else { revealPos = 1 - ease(t); report(phase, (1 - revealPos) * 100); }
      if (t >= 1) { phaseIdx = (phaseIdx + 1) % CYCLE.length; phaseStart = now; }
    };

    let last = 0;
    const loop = (now) => {
      if (disposed) return;
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < 1000 / FPS) return;
      last = now;
      step(now);
      draw();
    };

    const onPhosphor = () => { accent = readAccent(); build(); if (reduced) draw(); };
    window.addEventListener("phosphor-change", onPhosphor);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    const ro = new ResizeObserver(() => { build(); draw(); });

    img.onload = () => {
      if (disposed) return;
      build();
      ro.observe(canvas);
      if (reduced) { revealPos = 1; report("decrypted", 100); draw(); }
      else raf = requestAnimationFrame(loop);
    };

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("phosphor-change", onPhosphor);
    };
  }, [src, cell]);

  return h("canvas", { ref: canvasRef, className: `cipher-portrait ${className}`.trim(), role: "img", "aria-label": label });
}

/* ==========================================================================
   SMALL RANDOM HELPERS used by both shells
   ========================================================================== */

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export const FORTUNES = [
  "A bug you fixed today will return wearing a different stack trace.",
  "Your next build will pass on the first try. Then you will wonder what you forgot.",
  "The Wi-Fi is fine. It was DNS. It is always DNS.",
  "Someone will star your repo. It will be you, from a second account. Resist.",
  "You will write a TODO today and meet it again in 2029.",
  "Hot reload will save you three hours this week. Gradle will take them back."
];

export const JOKES = [
  "I told my phone a UDP joke. I'm not sure it got it.",
  "There are 10 kinds of people: those who read binary and those who wait for the punchline.",
  "My code doesn't have bugs. It has surprise features that ship at 2 a.m.",
  "Why did the Flutter widget go to therapy? Too many unresolved builds.",
  "I'd tell you a TCP joke, but I'd have to keep repeating it until you acknowledge it.",
  "A SQL query walks into a bar, walks up to two tables and asks: can I join you?"
];

export const EIGHT_BALL = [
  "It is certain.",
  "Signs point to yes. The signs are console logs.",
  "Ask again after coffee.",
  "Better not tell you now. Merge conflict pending.",
  "Very doubtful. Unless you add tests.",
  "Outlook good. Ship it.",
  "My sources say no. My sources are Stack Overflow from 2014.",
  "Yes, but only on Android."
];

export const ROASTS = [
  "This portfolio has more easter eggs than unit tests.",
  "He named an AI after himself so recruiters have someone to talk to at 3 a.m. Respect, but also, sleep.",
  "Four apps, one CGPA of 7.98, and an ongoing relationship with socket timeouts.",
  "The terminal in the hero types the same code forever. Like his last group project.",
  "He built a file transfer app so he would never have to email himself a PDF again. Peak laziness, peak engineering."
];

export const PERSONAS = [
  { name: "J.A.R.V.I.S.", why: "calm, organised, quietly judging your calendar" },
  { name: "F.R.I.D.A.Y.", why: "quick, practical, already three steps ahead" },
  { name: "E.D.I.T.H.", why: "precise and slightly intimidating" },
  { name: "Vision", why: "thoughtful, takes the long way to a good answer" },
  { name: "Ultron", why: "dramatic pauses, strong opinions about humanity's code style" },
  { name: "Human Torch", why: "fast, loud, never waits for the loading bar" },
  { name: "Jocasta", why: "patient and kind, reads the docs first" },
  { name: "DUM-E", why: "enthusiastic, occasionally helpful, mostly beeps" },
  { name: "U", why: "DUM-E's sibling, slightly better at holding things" }
];
