/* script.js — arijeetdas.in
 * Website content comes from content/site.json (edit it in the Knowledge Studio
 * at /admin while running `npm run dev`). ArijeetOS (engram.js) and the secret
 * terminal (secret-terminal.js) are lazy-loaded on first use. */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import { SITE_CONTENT } from "./data/arijeet-profile.js";
import {
  Icon, CipherPortrait, PHOSPHORS, applyPhosphor, applyTheme, getPhosphor, getTheme,
  restoreAppearance, kolkataTime, prefersReducedMotion, tokenize
} from "./shared.js";

const h = React.createElement;
restoreAppearance();

const SITE = SITE_CONTENT || {};
const META = SITE.meta || {};
const SHELL = `${META.shellUser || "arijeet"}@${META.shellHost || "kolkata"}`;
const PROJECTS = (SITE.projects && SITE.projects.items) || [];
const RESUME = SITE.resume || { path: "assets/resume/Arijeet_Das_Resume.pdf" };
const EASE = [0.22, 1, 0.36, 1];

/* tmux-style windows: index, section id, tab label, path shown in the status line */
const WINDOWS = [
  { id: "home", label: "home", path: "~" },
  { id: "about", label: "about", path: "~/about.md" },
  { id: "skills", label: "skills", path: "~/skills/" },
  { id: "projects", label: "projects", path: "~/projects/" },
  { id: "playground", label: "ask", path: "~/arijeetos" },
  { id: "contact", label: "contact", path: "~/contact" }
];

function downloadResume() {
  const a = document.createElement("a");
  a.href = RESUME.path;
  a.download = RESUME.downloadName || RESUME.path.split("/").pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ==========================================================================
   HOOKS
   ========================================================================== */

function useClock() {
  const [time, setTime] = useState(() => kolkataTime());
  useEffect(() => {
    const id = setInterval(() => setTime(kolkataTime()), 15000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useAppearance() {
  const [p, setP] = useState(getPhosphor());
  const [t, setT] = useState(getTheme());
  useEffect(() => {
    const a = (e) => setP(e.detail);
    const b = (e) => setT(e.detail);
    window.addEventListener("phosphor-change", a);
    window.addEventListener("theme-change", b);
    return () => { window.removeEventListener("phosphor-change", a); window.removeEventListener("theme-change", b); };
  }, []);
  return [p, t];
}

/** Runs `tick` on an interval only while the element is on screen. */
function useVisibleInterval(ref, tick, ms) {
  useEffect(() => {
    let id = 0;
    const start = () => { if (!id) id = setInterval(tick, ms); };
    const stop = () => { clearInterval(id); id = 0; };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    if (ref.current) io.observe(ref.current);
    return () => { stop(); io.disconnect(); };
  }, [ref, tick, ms]);
}

/** true once the element has scrolled into view */
function useSeen(ref, amount = 0.4) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: amount });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, seen, amount]);
  return seen;
}

/* ==========================================================================
   TEXT EFFECTS
   ========================================================================== */

/** A shell prompt whose command types itself the first time it scrolls into view. */
function Prompt({ command, instant = false }) {
  const ref = useRef(null);
  const seen = useSeen(ref, 0.6);
  const [n, setN] = useState(instant || prefersReducedMotion() ? command.length : 0);
  useEffect(() => {
    if (!seen || n >= command.length) return undefined;
    const id = setTimeout(() => setN((x) => x + 1), 38 + Math.random() * 40);
    return () => clearTimeout(id);
  }, [seen, n, command]);
  return h("div", { ref, className: "prompt-line", "aria-hidden": "true" },
    h("span", { className: "prompt-user" }, SHELL),
    h("span", { className: "prompt-sep" }, ":~$ "),
    h("span", { className: "prompt-cmd" }, command.slice(0, n)),
    h("span", { className: "block-cursor" })
  );
}

const SCRAMBLE = "0123456789abcdef{}<>/=#$%";

/** Text that decrypts from random glyphs into the real words, once. */
function ScrambleText({ text, delay = 0, duration = 900 }) {
  const [out, setOut] = useState(() => (prefersReducedMotion() ? text : text.replace(/\S/g, () => SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0])));
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let raf;
    const start = performance.now() + delay;
    const tick = (now) => {
      const t = Math.max(0, now - start) / duration;
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const at = (i / text.length) * 0.75;
        s += ch === " " || t >= at + 0.25 ? ch : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
      }
      setOut(s);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, duration]);
  return h(React.Fragment, null, h("span", { className: "sr-only" }, text), h("span", { "aria-hidden": "true" }, out));
}

/* ==========================================================================
   SHARED PIECES
   ========================================================================== */

function SectionHead({ copy, id }) {
  return h("header", { className: "section-head" },
    h(Prompt, { command: copy.prompt || "" }),
    h("h2", { id: `${id}-title`, className: "section-title" }, copy.title),
    copy.lead ? h("p", { className: "section-lead" }, copy.lead) : null
  );
}

function Reveal({ children, className = "", as = "div", delay = 0, id }) {
  return h(motion[as], {
    id,
    className,
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.42, ease: EASE, delay }
  }, children);
}

function Keycap({ children }) {
  return h("kbd", { className: "keycap" }, children);
}

function Window({ title, meta, children, className = "" }) {
  return h("div", { className: `window ${className}`.trim() },
    h("div", { className: "window-bar" },
      h("span", { className: "window-dots", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
      h("span", { className: "window-title" }, title),
      meta ? h("span", { className: "window-meta" }, meta) : null),
    children);
}

/* ==========================================================================
   FIRST-VISIT LOGIN SPLASH (once per browser session, about a second)
   ========================================================================== */

function BootSplash({ onDone }) {
  const lines = useMemo(() => [
    `arijeetdas.in tty0`,
    `login: guest`,
    `Last login: ${new Date().toDateString()} from your browser`,
    `Welcome. Type : for commands.`
  ], []);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n < lines.length) {
      const id = setTimeout(() => setN((x) => x + 1), n === 1 ? 260 : 150);
      return () => clearTimeout(id);
    }
    const id = setTimeout(onDone, 380);
    return () => clearTimeout(id);
  }, [n, lines.length, onDone]);
  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);
  return h(motion.div, {
    className: "splash",
    onClick: onDone,
    initial: { opacity: 1 }, exit: { opacity: 0 },
    transition: { duration: 0.3, ease: EASE }
  },
    h("pre", { className: "splash-text" },
      lines.slice(0, n).map((l, i) => h("div", { key: i }, l)),
      h("span", { className: "block-cursor" })));
}

/* ==========================================================================
   TAB BAR (tmux status line on top)
   ========================================================================== */

function TabBar({ active, onNavigate }) {
  const [, theme] = useAppearance();
  const [menu, setMenu] = useState(false);
  const idx = Math.max(0, WINDOWS.findIndex((w) => w.id === active));
  const current = WINDOWS[idx];
  const go = (id) => { setMenu(false); onNavigate(id); };

  // The phone menu closes on Escape, on scroll and on any tap outside it.
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setMenu(false); };
    const onScroll = () => setMenu(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll); };
  }, [menu]);

  return h("nav", { className: "tabbar", "aria-label": "Sections" },
    h("div", { className: "tabbar-inner" },
      h("button", { className: "session", onClick: () => go("home"), "aria-label": `${META.wordmark || "Arijeet Das"}, go to top` },
        h("span", { className: "session-chip mono" }, "[0]"),
        h("span", { className: "session-name" }, META.wordmark || "Arijeet Das"),
        h("span", { className: "wordmark-cursor", "aria-hidden": "true" })),

      /* desktop: tmux tab strip */
      h("div", { className: "tabs", role: "list" },
        WINDOWS.map((w, i) =>
          h("a", {
            key: w.id,
            role: "listitem",
            href: `#${w.id}`,
            className: `tab ${active === w.id ? "active" : ""}`,
            "aria-current": active === w.id ? "true" : undefined,
            onClick: (e) => { e.preventDefault(); go(w.id); }
          },
            h("span", { className: "tab-index" }, `${i}:`),
            h("span", null, w.label),
            h("span", { className: "tab-flag", "aria-hidden": "true" }, active === w.id ? "*" : " ")))),

      /* phones: one button showing the current window, opens choose-window */
      h("button", {
        className: `tab-switch ${menu ? "open" : ""}`,
        onClick: () => setMenu((m) => !m),
        "aria-expanded": menu,
        "aria-controls": "window-menu",
        "aria-label": `Section: ${current.label}. Open section menu`
      },
        h("span", { className: "tab-index" }, `${idx}:`),
        h("span", { className: "tab-switch-label" }, current.label),
        h("span", { className: "tab-flag", "aria-hidden": "true" }, "*"),
        h("span", { className: "tab-switch-count" }, `${idx + 1}/${WINDOWS.length}`),
        h(Icon, { name: "chevronDown", size: 16, className: "tab-switch-chevron" })),

      h("div", { className: "tabbar-actions" },
        h("button", {
          className: "icon-button",
          onClick: () => applyTheme("toggle"),
          "aria-label": theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
        }, h(Icon, { name: theme === "dark" ? "sun" : "moon" })))
    ),

    h(AnimatePresence, null,
      menu ? h(React.Fragment, { key: "menu" },
        h(motion.div, {
          className: "window-menu-scrim",
          onClick: () => setMenu(false),
          initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
          transition: { duration: 0.18, ease: EASE }
        }),
        h(motion.div, {
          id: "window-menu",
          className: "window-menu",
          role: "menu",
          initial: { opacity: 0, y: -6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 },
          transition: { duration: 0.2, ease: EASE }
        },
          h("div", { className: "window-menu-head" }, h("span", null, "choose-window"), h("span", null, `${WINDOWS.length} windows`)),
          WINDOWS.map((w, i) =>
            h("button", {
              key: w.id,
              role: "menuitem",
              className: `window-row ${active === w.id ? "active" : ""}`,
              onClick: () => go(w.id)
            },
              h("span", { className: "window-row-index" }, `(${i})`),
              h("span", { className: "window-row-label" }, w.label, active === w.id ? h("span", { className: "tab-flag" }, "*") : null),
              h("span", { className: "window-row-path" }, w.path))))) : null)
  );
}

/* ==========================================================================
   STATUS LINE (vim style, bottom) with a : command line
   ========================================================================== */

function StatusLine({ active, command, setCommand, message, onRun }) {
  const [phosphor] = useAppearance();
  const time = useClock();
  const [pct, setPct] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { if (command !== null) inputRef.current?.focus(); }, [command !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const win = WINDOWS.find((w) => w.id === active) || WINDOWS[0];
  const pos = pct === 0 ? "Top" : pct >= 99 ? "Bot" : `${pct}%`;

  return h("div", { className: "statusline", role: "status" },
    h("button", {
      className: `mode ${command !== null ? "mode-cmd" : ""}`,
      onClick: () => setCommand(command === null ? "" : null),
      "aria-label": "Open the command line"
    }, command !== null ? "COMMAND" : "NORMAL"),
    command !== null
      ? h("form", {
          className: "cmdline",
          onSubmit: (e) => { e.preventDefault(); onRun(command); }
        },
          h("span", { className: "cmd-colon" }, ":"),
          h("input", {
            ref: inputRef,
            value: command,
            onChange: (e) => setCommand(e.target.value),
            onKeyDown: (e) => { if (e.key === "Escape") { e.preventDefault(); setCommand(null); } },
            onBlur: () => { if (!command) setCommand(null); },
            "aria-label": "Command",
            autoComplete: "off",
            spellCheck: "false"
          }))
      : h(React.Fragment, null,
          h("span", { className: "sl-path" }, win.path),
          message
            ? h("span", { className: "sl-msg" }, message)
            : h("span", { className: "sl-hint" }, "type ", h("b", null, ":help"), " for commands")),
    h("span", { className: "sl-right" },
      h("span", { className: "sl-hide" }, "utf-8"),
      h("span", { className: "sl-hide" }, phosphor),
      h("span", { className: "sl-hide" }, `${time} IST`),
      h("span", { className: "sl-pos" }, pos))
  );
}

/* ==========================================================================
   HERO
   ========================================================================== */

function CyclingCode({ snippets, onFile }) {
  const [state, setState] = useState({ idx: 0, chars: 0, phase: "typing" });
  const reduced = useMemo(prefersReducedMotion, []);
  const snippet = snippets[state.idx % snippets.length] || { lines: [] };
  const fullText = snippet.lines.join("\n");

  useEffect(() => { onFile(snippet.file); }, [snippet.file, onFile]);

  useEffect(() => {
    if (!snippets.length) return undefined;
    if (reduced) {
      const id = setTimeout(() => setState((s) => ({ idx: s.idx + 1, chars: 0, phase: "typing" })), 7000);
      return () => clearTimeout(id);
    }
    let delay;
    let next;
    if (state.phase === "typing") {
      if (state.chars >= fullText.length) {
        delay = 2600;
        next = { ...state, phase: "erasing" };
      } else {
        const ch = fullText[state.chars];
        delay = ch === "\n" ? 240 + Math.random() * 160 : ch === " " ? 18 : 26 + Math.random() * 32;
        next = { ...state, chars: state.chars + 1 };
      }
    } else {
      delay = 70;
      const cut = fullText.lastIndexOf("\n", state.chars - 2);
      next = cut <= 0 ? { idx: state.idx + 1, chars: 0, phase: "typing" } : { ...state, chars: cut + 1 };
    }
    const id = setTimeout(() => setState(next), delay);
    return () => clearTimeout(id);
  }, [state, fullText, reduced, snippets.length]);

  const visible = reduced ? fullText : fullText.slice(0, state.chars);
  const lines = visible.split("\n");
  const total = Math.max(6, snippet.lines.length);

  return h("pre", { className: "code-block", "aria-label": `Code: ${snippet.file}` },
    Array.from({ length: total }).map((_, i) => {
      const text = lines[i];
      const isLast = i === lines.length - 1;
      return h("div", { key: i, className: "code-line" },
        h("span", { className: "code-num" }, String(i + 1).padStart(2, "0")),
        h("span", { className: "code-text" },
          text !== undefined ? tokenize(text).map((tok, j) => h("span", { key: j, className: `tok-${tok.t}` }, tok.v)) : null,
          isLast && text !== undefined ? h("span", { className: "block-cursor" }) : null));
    }));
}

const CIPHER_LABEL = {
  encrypted: "encrypted, aes-256-gcm",
  decrypting: "decrypting",
  decrypted: "decrypted, sha256 ok",
  encrypting: "encrypting"
};

function HeroVisual() {
  const [file, setFile] = useState("");
  const [hover, setHover] = useState(false);
  const [status, setStatus] = useState({ phase: "encrypted", pct: 0 });
  const time = useClock();
  const snippets = (SITE.hero && SITE.hero.snippets) || [];
  const onStatus = useCallback((phase, pct) => setStatus({ phase, pct }), []);
  const plain = status.phase === "decrypted";
  const touch = useMemo(() => window.matchMedia && window.matchMedia("(hover: none)").matches, []);

  return h(Window, { className: "hero-window", title: plain ? "arijeet.png" : "arijeet.png.enc", meta: "zsh" },
    h("div", { className: "hero-window-body" },
      h("div", {
        className: "cipher-frame",
        tabIndex: 0,
        role: "button",
        "aria-pressed": hover,
        // Mouse: hover decrypts. Touch: tap toggles. Keyboard: focus decrypts.
        onMouseEnter: touch ? undefined : () => setHover(true),
        onMouseLeave: touch ? undefined : () => setHover(false),
        onClick: touch ? () => setHover((v) => !v) : undefined,
        onFocus: touch ? undefined : () => setHover(true),
        onBlur: () => setHover(false),
        "aria-label": `Portrait of Arijeet Das. ${touch ? "Tap" : "Hover"} to decrypt.`
      },
        h(CipherPortrait, { src: (SITE.hero && SITE.hero.portrait) || "assets/profile.png", reveal: hover, onStatus, cell: 6 }),
        h("div", { className: "cipher-tag mono" },
          h("span", { className: `cipher-dot ${plain ? "ok" : ""}` }),
          CIPHER_LABEL[status.phase],
          status.phase === "decrypting" || status.phase === "encrypting" ? ` ${status.pct}%` : "")),
      h("div", { className: "hero-code" },
        h("div", { className: "code-tab mono" }, h("span", null, file), h("span", { className: "muted" }, "dart")),
        h(CyclingCode, { snippets, onFile: setFile }))
    ),
    h("div", { className: "window-status" },
      h("span", { className: "status-live" }, h("span", { className: "live-dot" }), "Online"),
      h("span", null, `Kolkata ${time} IST`),
      h("span", { className: "status-right" }, touch ? "tap the photo" : "hover the photo to decrypt"))
  );
}

function Hero({ onNavigate }) {
  const hero = SITE.hero || {};
  return h("section", { id: "home", className: "hero", "aria-labelledby": "home-title" },
    h(motion.div, {
      className: "hero-copy",
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: EASE }
    },
      h(Prompt, { command: hero.prompt || "whoami" }),
      h("h1", { id: "home-title", className: "hero-title" }, h(ScrambleText, { text: hero.title || "", delay: 250 })),
      h("p", { className: "hero-lead" }, hero.lead),
      h("div", { className: "hero-actions" },
        h("button", { className: "btn btn-primary", onClick: downloadResume },
          h(Icon, { name: "download" }), hero.primaryAction || "Download resume"),
        h("button", { className: "btn btn-secondary", onClick: () => onNavigate("projects") },
          hero.secondaryAction || "See projects")),
      h("p", { className: "hero-keys muted" },
        h(Keycap, null, ":"), " commands  ", h(Keycap, null, "0-5"), " jump  ", h(Keycap, null, "?"), " shortcuts")
    ),
    h(motion.div, {
      className: "hero-visual",
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: EASE, delay: 0.08 }
    }, h(HeroVisual))
  );
}

/* ==========================================================================
   ABOUT
   ========================================================================== */

function About() {
  const about = SITE.about || {};
  return h("section", { id: "about", className: "section", "aria-labelledby": "about-title" },
    h(SectionHead, { copy: about, id: "about" }),
    h("div", { className: "about-grid" },
      h(Reveal, { className: "about-text" },
        (about.paragraphs || []).map((p, i) => h("p", { key: i }, p)),
        about.now && about.now.length
          ? h("div", { className: "now" },
              h("div", { className: "now-head mono" }, h("span", { className: "accent" }, "$ "), "tail -f now.log"),
              h("ul", null, about.now.map((n, i) => h("li", { key: i },
                h("span", { className: "mono muted" }, `[${String(i + 1).padStart(2, "0")}]`),
                h("span", null, n, i === about.now.length - 1 ? h("span", { className: "block-cursor" }) : null)))))
          : null
      ),
      h(Reveal, { className: "about-side", delay: 0.05 },
        h("dl", { className: "facts" },
          (about.facts || []).map((f, i) =>
            h("div", { key: i, className: "fact" },
              h("dt", null, f.label),
              h("dd", null, f.value)))),
        h("ol", { className: "entries" },
          (about.entries || []).map((e, i) =>
            h("li", { key: i, className: "entry" },
              h("span", { className: "entry-icon" }, h(Icon, { name: e.kind === "work" ? "briefcase" : "cap" })),
              h("div", null,
                h("div", { className: "entry-top" },
                  h("h3", null, e.title),
                  h("span", { className: "mono muted" }, e.period)),
                h("p", { className: "entry-org" }, e.org),
                e.body ? h("p", { className: "entry-body" }, e.body) : null)))))
    )
  );
}

/* ==========================================================================
   SKILLS — ls -l
   ========================================================================== */

function Skills() {
  const skills = SITE.skills || {};
  const cats = skills.categories || [];
  return h("section", { id: "skills", className: "section", "aria-labelledby": "skills-title" },
    h(SectionHead, { copy: skills, id: "skills" }),
    h(Reveal, { className: "listing" },
      h("div", { className: "listing-total mono muted" }, `total ${cats.reduce((n, c) => n + (c.items || []).length, 0)}`),
      cats.map((c) =>
        h("div", { key: c.id || c.title, className: "skill-row" },
          h("span", { className: "perm mono" }, "drwxr-xr-x"),
          h("span", { className: "count mono" }, String((c.items || []).length).padStart(2, " ")),
          h("h3", { className: "skill-group" }, `${(c.id || c.title).toLowerCase()}/`,
            c.id && c.title.toLowerCase() !== c.id.toLowerCase() ? h("span", { className: "skill-title" }, c.title) : null),
          h("ul", { className: "skill-items" },
            (c.items || []).map((s) => h("li", { key: s, className: "tag" }, s))))))
  );
}

/* ==========================================================================
   PROJECT PREVIEWS — small live scenes built in code
   ========================================================================== */

const DROPNET_FILES = [
  { name: "semester_notes.zip", size: "48 MB" },
  { name: "dropnet_demo.mp4", size: "212 MB" },
  { name: "resume_final_FINAL.pdf", size: "1.2 MB" },
  { name: "ultravision_build.apk", size: "96 MB" }
];

function DropNetPreview() {
  const ref = useRef(null);
  const [t, setT] = useState(0);
  const tick = useCallback(() => setT((x) => x + 1), []);
  useVisibleInterval(ref, tick, 90);
  const cycle = 70;
  const file = DROPNET_FILES[Math.floor(t / cycle) % DROPNET_FILES.length];
  const local = t % cycle;
  const pct = Math.min(100, Math.round((local / 52) * 100));
  const done = local >= 52;

  return h("div", { ref, className: "preview preview-dropnet", "aria-hidden": "true" },
    h("div", { className: "dn-device" },
      h(Icon, { name: "laptop", size: 18 }),
      h("div", null, h("div", { className: "dn-name" }, "arijeet-laptop"), h("div", { className: "mono muted" }, "192.168.1.6"))),
    h("div", { className: "dn-link" },
      h("div", { className: "dn-wire" }, h("span", { className: "dn-packet", style: { left: `${done ? 100 : (local * 7) % 100}%`, opacity: done ? 0 : 1 } })),
      h("div", { className: "mono muted dn-wire-label" }, h(Icon, { name: "wifi", size: 14 }), "LAN, no internet")),
    h("div", { className: "dn-device" },
      h(Icon, { name: "phoneDevice", size: 18 }),
      h("div", null, h("div", { className: "dn-name" }, "pixel-7"), h("div", { className: "mono muted" }, "192.168.1.14"))),
    h("div", { className: "dn-transfer" },
      h("div", { className: "dn-file" },
        h(Icon, { name: "file", size: 16 }),
        h("span", { className: "dn-file-name" }, file.name),
        h("span", { className: "mono muted" }, file.size)),
      h("div", { className: "bar" }, h("span", { style: { transform: `scaleX(${pct / 100})` } })),
      h("div", { className: "dn-state mono" },
        done ? h("span", { className: "ok" }, h(Icon, { name: "check", size: 14 }), "Verified, sha256 ok") : h("span", null, `Sending ${pct}%`),
        h("span", { className: "muted" }, "pair-only mode")))
  );
}

const PERSONA_LINES = [
  { name: "J.A.R.V.I.S.", line: "Good evening. Three photos match “sunset at the ghat”." },
  { name: "DUM-E", line: "*beep* *whirr* [I found your keys. They were in the photo.]" },
  { name: "Ultron", line: "You call this a gallery… I call it a beginning." },
  { name: "F.R.I.D.A.Y.", line: "Upscaled to 4x. Faces fixed. You're welcome." }
];

function UltraVisionPreview() {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const tick = useCallback(() => setI((x) => x + 1), []);
  useVisibleInterval(ref, tick, 3600);
  const p = PERSONA_LINES[i % PERSONA_LINES.length];
  return h("div", { ref, className: "preview preview-uv", "aria-hidden": "true" },
    h("div", { className: "uv-phone" },
      h("div", { className: "uv-top" },
        h("span", { className: "uv-avatar" }, p.name.slice(0, 1)),
        h("div", null, h("div", { className: "uv-name" }, p.name), h("div", { className: "mono muted" }, "on device")),
        h("span", { className: "uv-chip mono" }, "offline")),
      h(AnimatePresence, { mode: "wait" },
        h(motion.div, {
          key: i,
          className: "uv-bubble",
          initial: { opacity: 0, y: 6 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -4 },
          transition: { duration: 0.3, ease: EASE }
        }, p.line)),
      h("div", { className: "uv-model" },
        h("div", { className: "uv-model-row" }, h(Icon, { name: "cpu", size: 14 }), h("span", null, "Model fits in RAM"), h("span", { className: "mono muted" }, "verified")),
        h("div", { className: "bar bar-static" }, h("span", { style: { transform: "scaleX(0.62)" } })))),
    h("div", { className: "uv-stamp mono" }, "In development, public soon")
  );
}

function FetchNetPreview() {
  const ref = useRef(null);
  const [t, setT] = useState(0);
  const tick = useCallback(() => setT((x) => x + 1), []);
  useVisibleInterval(ref, tick, 80);
  const url = "https://youtu.be/flutter-talk";
  const local = t % 120;
  const typed = url.slice(0, Math.min(url.length, local));
  const pct = local > 40 ? Math.min(100, Math.round(((local - 40) / 60) * 100)) : 0;
  return h("div", { ref, className: "preview preview-fetch", "aria-hidden": "true" },
    h("div", { className: "fx-input mono" }, typed || " ", local < url.length ? h("span", { className: "block-cursor" }) : null),
    h("div", { className: "fx-chips" },
      ["4K", "1080p", "720p", "MP3 320"].map((q) => h("span", { key: q, className: `fx-chip ${q === "1080p" ? "on" : ""}` }, q))),
    h("div", { className: "bar" }, h("span", { style: { transform: `scaleX(${pct / 100})` } })),
    h("div", { className: "mono muted fx-state" }, pct >= 100 ? "Saved to Video" : pct ? `Downloading ${pct}%` : "Paste a link")
  );
}

const CLI_LINES = [
  "$ python dropnet.py send notes.pdf",
  "> beacon: found 2 receivers",
  "> encrypting with code 4FJ9QX",
  "> [####################] 100%",
  "> sha256 ok  crc32 ok"
];

function CliPreview() {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const tick = useCallback(() => setN((x) => (x + 1) % (CLI_LINES.length + 4)), []);
  useVisibleInterval(ref, tick, 700);
  return h("pre", { ref, className: "preview preview-cli", "aria-hidden": "true" },
    CLI_LINES.slice(0, Math.min(n, CLI_LINES.length)).map((l, i) =>
      h("div", { key: i }, tokenize(l).map((tok, j) => h("span", { key: j, className: `tok-${tok.t}` }, tok.v)))),
    n <= CLI_LINES.length ? h("span", { className: "block-cursor" }) : null);
}

const PREVIEWS = { dropnet: DropNetPreview, ultravision: UltraVisionPreview, fetchnet: FetchNetPreview, cli: CliPreview };

/* ==========================================================================
   PROJECTS
   ========================================================================== */

function StatusTag({ project }) {
  return h("span", { className: `status-tag tone-${project.tone || "neutral"}` },
    h("span", { className: "status-dot" }), project.status);
}

function ProjectLinks({ project }) {
  return h("div", { className: "project-links" },
    project.live ? h("a", { className: "btn btn-secondary btn-sm", href: project.live, target: "_blank", rel: "noopener noreferrer" }, "Open", h(Icon, { name: "arrowUpRight", size: 14 })) : null,
    project.github ? h("a", { className: "btn btn-quiet btn-sm", href: project.github, target: "_blank", rel: "noopener noreferrer" }, h(Icon, { name: "github", size: 14 }), "Source") : null,
    !project.live && !project.github && project.note ? h("span", { className: "muted small" }, project.note) : null);
}

function ProjectIndex() {
  const go = (id) => {
    const el = document.getElementById(`project-${id}`);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };
  return h(Reveal, { className: "listing project-index" },
    h("div", { className: "listing-total mono muted" }, `total ${PROJECTS.length}`),
    PROJECTS.map((p) =>
      h("button", { key: p.id, className: "index-row", onClick: () => go(p.id) },
        h("span", { className: "perm mono" }, p.tone === "dev" ? "drwx------" : "drwxr-xr-x"),
        h("span", { className: "index-name mono" }, `${p.id}/`),
        h("span", { className: "index-status" }, h(StatusTag, { project: p })),
        h("span", { className: "index-summary" }, p.summary),
        h(Icon, { name: "arrowUpRight", size: 14, className: "index-arrow" }))));
}

function ProjectFeature({ project, index, onSelect }) {
  const Preview = PREVIEWS[project.preview];
  return h(Reveal, { id: `project-${project.id}`, className: `project-feature ${index % 2 ? "flip" : ""}`, as: "article" },
    h("div", { className: "project-copy" },
      h("div", { className: "project-meta" }, h(StatusTag, { project }), h("span", { className: "mono muted" }, project.tag)),
      h("h3", { className: "project-title" }, project.title),
      h("p", { className: "project-summary" }, project.summary),
      h("p", { className: "project-desc" }, project.description),
      h("ul", { className: "project-highlights" }, (project.highlights || []).map((x, i) => h("li", { key: i }, x))),
      h("p", { className: "project-tech mono" }, (project.tech || []).join("  /  ")),
      h("div", { className: "project-actions" },
        h(ProjectLinks, { project }),
        h("button", { className: "link-button", onClick: () => onSelect(project) }, "Details"))),
    h("div", { className: "project-visual" },
      Preview ? h(Window, { title: `${project.id} — preview`, meta: project.tone === "dev" ? "wip" : "live", className: "preview-window" }, h(Preview)) : null));
}

function ProjectCard({ project, onSelect }) {
  const Preview = PREVIEWS[project.preview];
  return h(Reveal, { id: `project-${project.id}`, className: "project-card", as: "article" },
    h("div", { className: "project-card-visual" }, Preview ? h(Preview) : null),
    h("div", { className: "project-card-body" },
      h("div", { className: "project-meta" }, h(StatusTag, { project }), h("span", { className: "mono muted" }, project.tag)),
      h("h3", { className: "project-title small" }, project.title),
      h("p", { className: "project-summary" }, project.summary),
      h("div", { className: "project-actions" },
        h(ProjectLinks, { project }),
        h("button", { className: "link-button", onClick: () => onSelect(project) }, "Details"))));
}

function Projects({ onSelect }) {
  const copy = SITE.projects || {};
  const featured = PROJECTS.slice(0, 2);
  const rest = PROJECTS.slice(2);
  return h("section", { id: "projects", className: "section", "aria-labelledby": "projects-title" },
    h(SectionHead, { copy, id: "projects" }),
    h(ProjectIndex),
    h("div", { className: "project-features" }, featured.map((p, i) => h(ProjectFeature, { key: p.id, project: p, index: i, onSelect }))),
    rest.length ? h("div", { className: "project-cards" }, rest.map((p) => h(ProjectCard, { key: p.id, project: p, onSelect }))) : null);
}

function ProjectSheet({ project, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    document.body.classList.add("no-scroll");
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("no-scroll"); window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  const Preview = PREVIEWS[project.preview];
  return h(motion.div, {
    className: "sheet-backdrop",
    initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
    transition: { duration: 0.2, ease: EASE },
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
  },
    h(motion.div, {
      className: "sheet",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "sheet-title",
      initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 },
      transition: { duration: 0.3, ease: EASE }
    },
      h("div", { className: "sheet-head" },
        h("div", null,
          h("div", { className: "project-meta" }, h(StatusTag, { project }), h("span", { className: "mono muted" }, project.tag)),
          h("h3", { id: "sheet-title", className: "project-title" }, project.title)),
        h("button", { ref: closeRef, className: "icon-button", onClick: onClose, "aria-label": "Close" }, h(Icon, { name: "close" }))),
      Preview ? h("div", { className: "sheet-visual" }, h(Preview)) : null,
      h("p", { className: "project-summary" }, project.summary),
      h("p", { className: "project-desc" }, project.description),
      h("ul", { className: "project-highlights" }, (project.highlights || []).map((x, i) => h("li", { key: i }, x))),
      h("p", { className: "project-tech mono" }, (project.tech || []).join("  /  ")),
      h(ProjectLinks, { project })));
}

/* ==========================================================================
   PLAYGROUND — prompts that open ArijeetOS
   ========================================================================== */

function Playground({ onOpenEngram }) {
  const copy = SITE.playground;
  if (!copy) return null;
  return h("section", { id: "playground", className: "section", "aria-labelledby": "playground-title" },
    h(SectionHead, { copy, id: "playground" }),
    h(Reveal, { className: "prompt-grid" },
      (copy.prompts || []).map((p, i) =>
        h("button", { key: p.label, className: "prompt-chip", onClick: () => onOpenEngram(p.text) },
          h("span", { className: "prompt-chip-num mono" }, String(i + 1).padStart(2, "0")),
          h("span", { className: "prompt-chip-label" }, p.label),
          h("span", { className: "prompt-chip-cmd mono" }, p.text.startsWith("/") ? p.text.split(" ")[0] : "ask")))),
    h("p", { className: "muted small playground-hint" },
      "Type ", h(Keycap, null, "/help"), " inside ArijeetOS for every command."));
}

/* ==========================================================================
   CONTACT
   ========================================================================== */

const CHANNEL_ICON = { email: "mail", github: "github", linkedin: "linkedin", whatsapp: "whatsapp", phone: "phone" };

function PingPanel({ host }) {
  const ref = useRef(null);
  const [lines, setLines] = useState([]);
  const seq = useRef(0);
  const tick = useCallback(() => {
    seq.current += 1;
    if (seq.current > 6) { seq.current = 0; setLines([]); return; }
    const ms = (1.4 + Math.random() * 2.2).toFixed(1);
    setLines((l) => [...l, `64 bytes from ${host}: icmp_seq=${seq.current} ttl=64 time=${ms} ms`]);
  }, [host]);
  useVisibleInterval(ref, tick, 1100);
  return h("div", { ref },
    h(Window, { title: `ping ${host}`, meta: "icmp", className: "ping-window" },
      h("pre", { className: "ping-body", "aria-hidden": "true" },
        h("div", { className: "muted" }, `PING ${host} (${host.includes("@") ? host.split("@")[1] : "arijeet.in"}): 56 data bytes`),
        lines.map((l, i) => h("div", { key: i }, l)),
        h("span", { className: "block-cursor" }))));
}

function Contact() {
  const contact = SITE.contact || {};
  const [copied, setCopied] = useState(false);
  const copyEmail = () => {
    if (!contact.email || !navigator.clipboard) return;
    navigator.clipboard.writeText(contact.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return h("section", { id: "contact", className: "section", "aria-labelledby": "contact-title" },
    h(SectionHead, { copy: contact, id: "contact" }),
    h("div", { className: "contact-grid" },
      h(Reveal, { className: "contact-left" },
        contact.email
          ? h("div", { className: "contact-email" },
              h("a", { href: `mailto:${contact.email}`, className: "email-link" }, contact.email),
              h("button", { className: "btn btn-quiet btn-sm", onClick: copyEmail }, h(Icon, { name: copied ? "check" : "file", size: 14 }), copied ? "Copied" : "Copy"))
          : null,
        h(PingPanel, { host: contact.email || "arijeet" })),
      h(Reveal, { className: "channels", delay: 0.05 },
        (contact.channels || []).map((c) => {
          const external = /^https?:/i.test(c.href || "");
          return h("a", {
            key: c.href,
            className: "channel",
            href: c.href,
            ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})
          },
            h("span", { className: "channel-icon" }, h(Icon, { name: CHANNEL_ICON[c.type] || "arrowUpRight" })),
            h("span", { className: "channel-label" }, c.label),
            h("span", { className: "channel-value mono" }, c.value),
            h(Icon, { name: "arrowUpRight", size: 14, className: "channel-arrow" }));
        })))
  );
}

/* ==========================================================================
   FOOTER
   ========================================================================== */

function Footer({ onOpenTerminal }) {
  const [phosphor] = useAppearance();
  const year = new Date().getFullYear();
  return h("footer", { className: "footer" },
    h("div", { className: "footer-inner" },
      h("div", { className: "footer-left" },
        h("span", null, `© ${year} ${META.ownerName || "Arijeet Das"}`),
        META.footerNote ? h("span", { className: "muted" }, META.footerNote) : null),
      h("div", { className: "phosphors", role: "radiogroup", "aria-label": "Accent colour" },
        h("span", { className: "muted small" }, "Phosphor"),
        PHOSPHORS.map((p) =>
          h("button", {
            key: p,
            className: `phosphor-dot p-${p} ${phosphor === p ? "on" : ""}`,
            role: "radio",
            "aria-checked": phosphor === p,
            "aria-label": p,
            title: p,
            onClick: () => applyPhosphor(p)
          }))),
      h("button", { className: "footer-secret mono", onClick: onOpenTerminal, "aria-label": "Open the terminal" },
        h(Icon, { name: "terminal", size: 14 }),
        h("span", null, "Terminal"),
        h("span", { className: "footer-secret-key" }, h(Keycap, null, "`")))));
}

/* ==========================================================================
   TOASTS, SHORTCUTS
   ========================================================================== */

function Toast({ toast }) {
  return h(AnimatePresence, null,
    toast ? h(motion.div, {
      key: toast.id,
      className: "toast",
      role: "status",
      initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 },
      transition: { duration: 0.2, ease: EASE }
    }, toast.text) : null);
}

const SHORTCUTS = [
  [":", "Open the command line (try :help, :theme green, :q)"],
  ["0 - 5", "Jump to a section, like tmux windows"],
  ["`", "Open the secret terminal"],
  ["?", "Show this list"],
  ["Esc", "Close whatever is open"],
  ["↑↑↓↓←→←→ B A", "You know what this does"],
  ["type arijeet", "Wake up ArijeetOS"],
  ["type coffee", "Refill the coffee meter"],
  ["type sudo", "Ask nicely for root"]
];

const COMMAND_HELP = ":0-5 :about :projects  :theme <name>  :light :dark  :term  :os [question]  :resume  :open <project>  :q";

function ShortcutSheet({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return h(motion.div, {
    className: "sheet-backdrop",
    initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
  },
    h(motion.div, {
      className: "sheet sheet-small",
      role: "dialog", "aria-modal": "true", "aria-label": "Keyboard shortcuts",
      initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 6 },
      transition: { duration: 0.24, ease: EASE }
    },
      h("div", { className: "sheet-head" },
        h("h3", { className: "project-title small" }, "Shortcuts"),
        h("button", { className: "icon-button", onClick: onClose, "aria-label": "Close" }, h(Icon, { name: "close" }))),
      h("dl", { className: "shortcut-list" },
        SHORTCUTS.map(([k, v]) => h("div", { key: k, className: "shortcut" }, h("dt", null, h(Keycap, null, k)), h("dd", null, v)))),
      h("p", { className: "mono muted small sheet-foot" }, COMMAND_HELP)));
}

/* ==========================================================================
   APP
   ========================================================================== */

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

function firstVisit() {
  try { return !sessionStorage.getItem("arijeet.booted") && !prefersReducedMotion(); } catch { return false; }
}

function App() {
  const [active, setActive] = useState("home");
  const [selected, setSelected] = useState(null);
  const [engram, setEngram] = useState({ open: false, prompt: null, Component: null });
  const [terminal, setTerminal] = useState({ open: false, mode: "normal", Component: null });
  const [shortcuts, setShortcuts] = useState(false);
  const [toast, setToast] = useState(null);
  const [splash, setSplash] = useState(firstVisit);
  const [command, setCommand] = useState(null);
  const [message, setMessage] = useState("");

  const say = useCallback((text) => {
    const id = Date.now();
    setToast({ id, text });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2800);
  }, []);

  const echoTimer = useRef(0);
  const echo = useCallback((text) => {
    setMessage(text);
    clearTimeout(echoTimer.current);
    echoTimer.current = setTimeout(() => setMessage(""), 4000);
  }, []);

  const endSplash = useCallback(() => {
    try { sessionStorage.setItem("arijeet.booted", "1"); } catch { /* ignore */ }
    setSplash(false);
  }, []);

  const navigate = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      setActive(id);
    }
  }, []);

  useEffect(() => {
    const sections = WINDOWS.map((n) => document.getElementById(n.id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-35% 0px -60% 0px" });
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const openEngram = useCallback(async (prompt = null) => {
    let Component = engram.Component;
    if (!Component) {
      try { Component = (await import("./engram.js")).default; } catch (err) { console.error("ArijeetOS failed to load", err); return; }
    }
    setEngram({ open: true, prompt: typeof prompt === "string" ? prompt : null, Component });
  }, [engram.Component]);

  const openTerminal = useCallback(async (mode = "normal") => {
    let Component = terminal.Component;
    if (!Component) {
      try { Component = (await import("./secret-terminal.js")).default; } catch (err) { console.error("Terminal failed to load", err); return; }
    }
    setTerminal({ open: true, mode, Component });
  }, [terminal.Component]);

  /* ---- : command line ---- */
  const runCommand = useCallback((raw) => {
    setCommand(null);
    const line = (raw || "").trim();
    if (!line) return;
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(" ");
    const c = cmd.toLowerCase();
    const win = WINDOWS.findIndex((w) => w.id === c || w.label === c);
    if (/^\d$/.test(c) && WINDOWS[+c]) { navigate(WINDOWS[+c].id); return; }
    if (win >= 0) { navigate(WINDOWS[win].id); return; }
    switch (c) {
      case "help": case "h": setShortcuts(true); return;
      case "q": echo("E37: No write since last change (add ! to override)"); return;
      case "q!": case "qa!": echo("You can't quit a portfolio. Close the tab, if you dare."); return;
      case "wq": case "x": echo("\"portfolio\" written. 4 projects, 0 bugs (that I know of)."); return;
      case "w": echo("Saved. Nothing to write, but it felt good."); return;
      case "theme": case "colorscheme": case "colo": {
        const name = (arg || "random").toLowerCase();
        if (name !== "random" && !PHOSPHORS.includes(name)) { echo(`E185: Cannot find color scheme '${name}'. Try ${PHOSPHORS.join(", ")}`); return; }
        echo(`phosphor ${applyPhosphor(name)}`);
        return;
      }
      case "light": case "dark": applyTheme(c); echo(`background=${c}`); return;
      case "set":
        if (/background=(light|dark)/.test(arg)) { applyTheme(arg.split("=")[1]); echo(arg); return; }
        echo(`E518: Unknown option: ${arg}`);
        return;
      case "term": case "terminal": case "sh": openTerminal(); return;
      case "os": case "arijeetos": case "ai": openEngram(arg || null); return;
      case "resume": downloadResume(); echo("Downloading resume"); return;
      case "open": case "e": {
        const p = PROJECTS.find((x) => x.id === arg.toLowerCase() || x.title.toLowerCase() === arg.toLowerCase());
        if (p) setSelected(p);
        else echo(`E484: Can't open file ${arg || "(none)"}. Try ${PROJECTS.map((x) => x.id).join(", ")}`);
        return;
      }
      case "coffee": echo("Coffee level: 100%"); return;
      case "sudo": echo("This isn't that kind of terminal. Try `"); return;
      default: echo(`E492: Not an editor command: ${line}`);
    }
  }, [navigate, openEngram, openTerminal, echo]);

  /* ---- keyboard ---- */
  useEffect(() => {
    let konami = 0;
    let typed = "";
    const onKey = (e) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (engram.open || terminal.open || splash) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      konami = key === KONAMI[konami] ? konami + 1 : key === KONAMI[0] ? 1 : 0;
      if (konami === KONAMI.length) {
        konami = 0;
        applyPhosphor("green");
        say("Cheat code accepted. Root shell unlocked");
        openTerminal("root");
        return;
      }
      if (e.key === ":") { e.preventDefault(); setCommand(""); return; }
      if (e.key === "`" || e.key === "~") { e.preventDefault(); openTerminal(); return; }
      if (e.key === "?") { setShortcuts(true); return; }
      if (/^[0-5]$/.test(e.key) && WINDOWS[+e.key]) { navigate(WINDOWS[+e.key].id); return; }
      if (e.key.length === 1) {
        typed = (typed + key).slice(-12);
        if (typed.endsWith("arijeet")) { typed = ""; openEngram(); }
        else if (typed.endsWith("coffee")) {
          typed = "";
          let cups = 1;
          try { cups = Number(localStorage.getItem("arijeet.cups") || 0) + 1; localStorage.setItem("arijeet.cups", String(cups)); } catch { /* ignore */ }
          say(`Coffee refilled. That's cup ${cups} on this browser`);
        } else if (typed.endsWith("sudo")) {
          typed = "";
          say("Nice try. Root lives in the terminal. Press `");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engram.open, terminal.open, splash, openEngram, openTerminal, navigate, say]);

  const engramActions = useMemo(() => ({
    scrollToSection: (id) => navigate(id),
    downloadResume,
    openProject: (id) => {
      const p = PROJECTS.find((x) => x.id === id) || PROJECTS.find((x) => id && x.id.startsWith(id));
      if (p) setSelected(p);
    },
    changeAccentColor: (name) => applyPhosphor(name || "random"),
    setTheme: (t) => applyTheme(t)
  }), [navigate]);

  return h(React.Fragment, null,
    h("a", { className: "skip-link", href: "#main" }, "Skip to content"),
    h(TabBar, { active, onNavigate: navigate }),
    h("main", { id: "main", className: "page" },
      h(Hero, { onNavigate: navigate }),
      h(About),
      h(Skills),
      h(Projects, { onSelect: setSelected }),
      h(Playground, { onOpenEngram: openEngram }),
      h(Contact)),
    h(Footer, { onOpenTerminal: () => openTerminal() }),
    h(StatusLine, { active, command, setCommand, message, onRun: runCommand }),
    // The one ArijeetOS launcher, same on every screen size.
    h("button", { className: "os-fab", onClick: () => openEngram(), "aria-label": "Open ArijeetOS, the AI version of Arijeet" },
      h("span", { className: "live-dot" }), h("span", null, "ArijeetOS"), h("span", { className: "os-fab-sub" }, "ask me")),
    h(Toast, { toast }),
    h(AnimatePresence, null, splash ? h(BootSplash, { key: "splash", onDone: endSplash }) : null),
    h(AnimatePresence, null, selected ? h(ProjectSheet, { key: "sheet", project: selected, onClose: () => setSelected(null) }) : null),
    h(AnimatePresence, null, shortcuts ? h(ShortcutSheet, { key: "shortcuts", onClose: () => setShortcuts(false) }) : null),
    h(AnimatePresence, null,
      engram.open && engram.Component
        ? h(engram.Component, {
            key: "engram",
            isOpen: true,
            initialPrompt: engram.prompt,
            onClose: () => setEngram((s) => ({ ...s, open: false, prompt: null })),
            actions: engramActions
          })
        : null),
    h(AnimatePresence, null,
      terminal.open && terminal.Component
        ? h(terminal.Component, {
            key: "terminal",
            mode: terminal.mode,
            onClose: () => setTerminal((s) => ({ ...s, open: false })),
            actions: { ...engramActions, openEngram: (p) => { setTerminal((s) => ({ ...s, open: false })); openEngram(p); } },
            projects: PROJECTS,
            site: SITE
          })
        : null)
  );
}

createRoot(document.getElementById("root")).render(h(App));
