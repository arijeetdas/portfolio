/* secret-terminal.js — the hidden tty on arijeetdas.in.
 * Separate from ArijeetOS: no AI, just a fake shell with a tiny filesystem,
 * games and too many jokes. Open it with the ` key, the footer hint, or the
 * Konami code (which logs you in as root). */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Icon, PHOSPHORS, applyPhosphor, applyTheme, getPhosphor, kolkataTime,
  pick, FORTUNES, JOKES, EIGHT_BALL, PERSONAS
} from "./shared.js";

const h = React.createElement;
const EASE = [0.22, 1, 0.36, 1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "arijeet" in figlet's standard font, plain ASCII so every mono font renders it.
const FIGLET = {
  a: ["       ", "  __ _ ", " / _` |", "| (_| |", " \\__,_|", "       "],
  r: ["      ", " _ __ ", "| '__|", "| |   ", "|_|   ", "      "],
  i: [" _ ", "(_)", "| |", "| |", "|_|", "   "],
  j: ["   _ ", "  (_)", "  | |", "  | |", " _/ |", "|__/ "],
  e: ["      ", "  ___ ", " / _ \\", "|  __/", " \\___|", "      "],
  t: [" _   ", "| |_ ", "| __|", "| |_ ", " \\__|", "     "]
};
const BANNER = [0, 1, 2, 3, 4, 5].map((row) =>
  [..."arijeet"].map((ch) => {
    const g = FIGLET[ch];
    const width = Math.max(...g.map((r) => r.length));
    return g[row].padEnd(width);
  }).join("")).filter((line) => line.trim());

const TRAIN = [
  "      ====        ________                ___________ ",
  "  _D _|  |_______/        \\__I_I_____===__|_________| ",
  "   |(_)---  |   H\\________/ |   |        =|___ ___|   ",
  "   /     |  |   H  |  |     |   |         ||_| |_||   ",
  "  |      |  |   H  |__--------------------| [___] |   ",
  "  | ________|___H__/__|_____/[][]~\\_______|       |   ",
  "  |/ |   |-----------I_____I [][] []  D   |=======|__ ",
  "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
  " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
  "  \\_/      \\O=====O=====O=====O_/      \\_/            "
];

const COW = (text) => {
  const t = text || "moo";
  const line = "-".repeat(t.length + 2);
  return [` ${"_".repeat(t.length + 2)}`, `< ${t} >`, ` ${line}`, "        \\   ^__^", "         \\  (oo)\\_______", "            (__)\\       )\\/\\", "                ||----w |", "                ||     ||"];
};

const COFFEE_ART = ["   ( (", "    ) )", "  ........", "  |      |]", "  \\      /", "   `----'"];

const GIT_LOG = [
  "a1f3c9e  fix: the bug from yesterday",
  "77b0d21  fix: the bug the fix introduced",
  "c0ffee1  chore: refill",
  "9e2d4b7  feat(dropnet): pair-only mode, because trust issues",
  "4a11d4y  wip: do not look at this commit",
  "d3adb33  revert: 'fix: the bug from yesterday'",
  "5ca1ab1  feat(ultravision): DUM-E learned to beep in Bengali (not really)",
  "0ff1ine  docs: README now longer than the code"
];

const HACK_LINES = [
  "Bypassing mainframe firewall......... ok",
  "Downloading more RAM.................. 16 GB",
  "Decrypting coffee_recipe.enc......... ok",
  "Rerouting through the hostel Wi-Fi... slow",
  "Compiling Gradle..................... still compiling",
  "Access granted. Welcome, script kiddie."
];

/* ---------------------------------------------------------------- filesystem */

function buildFs(site, projects) {
  const about = site.about || {};
  const skills = site.skills || {};
  const contact = site.contact || {};
  const projectFiles = {};
  projects.forEach((p) => {
    projectFiles[`${p.id}.md`] = [
      `# ${p.title}`,
      `status: ${p.status}`,
      "",
      p.summary,
      "",
      p.description,
      "",
      ...(p.highlights || []).map((x) => `- ${x}`),
      "",
      `stack: ${(p.tech || []).join(", ")}`,
      p.live ? `live:  ${p.live}` : null,
      p.github ? `code:  ${p.github}` : null,
      p.note ? `note:  ${p.note}` : null
    ].filter((l) => l !== null).join("\n");
  });
  return {
    "about.txt": [about.title, "", ...(about.paragraphs || []), "", ...(about.facts || []).map((f) => `${f.label}: ${f.value}`)].join("\n"),
    "skills.txt": (skills.categories || []).map((c) => `${c.title.padEnd(28)} ${c.items.join(", ")}`).join("\n"),
    "contact.txt": (contact.channels || []).map((c) => `${c.label.padEnd(10)} ${c.value}`).join("\n"),
    "resume.pdf": "%PDF-1.7 binary. Try `resume` to download it instead of reading bytes.",
    projects: projectFiles,
    ".secrets": [
      "Things nobody told you about this site:",
      "- the portrait in the hero is clickable. it does not like being poked",
      "- click the cursor next to the logo five times",
      "- type 'coffee' or 'arijeet' anywhere on the page",
      "- up up down down left right left right b a",
      "- this terminal has a 'guess' game and a train. type 'sl'"
    ].join("\n"),
    ".coffee_log": "02:14  cup 3   socket timeout\n02:51  cup 4   socket timeout, but faster\n03:30  cup 5   it was the firewall"
  };
}

function resolve(fs, cwd, target) {
  const parts = (target || "").replace(/^~\/?/, "").split("/").filter(Boolean);
  let path = target && (target.startsWith("~") || target.startsWith("/")) ? [] : [...cwd];
  for (const p of parts) {
    if (p === "..") path.pop();
    else if (p !== ".") path.push(p);
  }
  let node = fs;
  for (const p of path) {
    if (node && typeof node === "object" && p in node) node = node[p];
    else return { path, node: undefined };
  }
  return { path, node };
}

/* ---------------------------------------------------------------- commands */

const HELP = [
  ["help", "list commands"],
  ["ls, cd, pwd, cat, tree", "walk around the filesystem"],
  ["whoami, neofetch, date, uptime", "facts about this machine"],
  ["projects, open <name>", "list projects, open one on the page"],
  ["resume, contact, hire", "the useful ones"],
  ["arijeetos [question]", "hand over to the AI version of me"],
  ["theme <amber|green|cyan|rose|white|random>", "change the phosphor"],
  ["light, dark", "change the page theme"],
  ["fortune, joke, cowsay <text>", "wisdom of varying quality"],
  ["8ball <question>, flip, roll [sides]", "let chance decide"],
  ["rps <rock|paper|scissors>, guess [n]", "games"],
  ["persona", "which UltraVision persona are you"],
  ["coffee, sl, matrix, hack", "animations, mostly useless"],
  ["ping <host>, dropnet send <file>", "fake networking"],
  ["git log, vim, sudo <cmd>", "developer pain"],
  ["history, clear, exit", "the usual"]
];

const COMMANDS = [
  "help", "ls", "cd", "pwd", "cat", "tree", "whoami", "neofetch", "date", "uptime", "echo", "clear", "history", "exit", "quit", "logout",
  "theme", "light", "dark", "projects", "open", "resume", "contact", "hire", "email", "arijeetos", "sudo", "rm", "coffee", "fortune",
  "joke", "cowsay", "8ball", "flip", "roll", "rps", "guess", "persona", "sl", "matrix", "hack", "ping", "dropnet", "git", "vim",
  "weather", "hello", "hi", "credits", "achievements", "42", "make"
];

const QUICK = ["help", "ls -a", "neofetch", "projects", "coffee", "fortune", "sl", "matrix", "hack", "guess", "exit"];

const SECRETS = ["sl", "matrix", "hack", "sudo", "vim", "secrets", "guess", "rps", "42", "coffee", "root"];

function loadFound() {
  try { return new Set(JSON.parse(localStorage.getItem("arijeet.terminal.found") || "[]")); } catch { return new Set(); }
}

/* ---------------------------------------------------------------- matrix overlay */

function MatrixRain({ onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const size = 14;
    const cols = Math.floor(rect.width / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = "01{}/<>=#$ARIJEET".split("");
    let raf;
    const start = performance.now();
    const draw = (now) => {
      ctx.fillStyle = "rgba(7, 8, 13, 0.16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px "Geist Mono", monospace`;
      drops.forEach((d, i) => {
        const r = Math.random();
        ctx.fillStyle = r > 0.97 ? "rgba(243, 230, 0, 1)" : i % 6 === 0 ? "rgba(255, 42, 79, 0.55)" : "rgba(4, 218, 246, 0.5)";
        ctx.fillText(pick(chars), i * size, d * size);
        drops[i] = d * size > canvas.height && Math.random() > 0.97 ? 0 : d + 1;
      });
      if (now - start < 4500) raf = requestAnimationFrame(draw);
      else onDone();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);
  return h("canvas", { ref, className: "tty-matrix", "aria-hidden": "true" });
}

/* ---------------------------------------------------------------- component */

export default function SecretTerminal({ mode = "normal", onClose, actions, projects = [], site = {} }) {
  const root = mode === "root";
  const fs = useMemo(() => buildFs(site, projects), [site, projects]);
  const [lines, setLines] = useState([]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState([]);
  const [busy, setBusy] = useState(false);
  const [matrix, setMatrix] = useState(false);
  const historyRef = useRef([]);
  const histIdx = useRef(-1);
  const abortRef = useRef(false);
  const gameRef = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const idRef = useRef(0);
  const opened = useRef(Date.now());

  const user = root ? "root" : "guest";
  const promptText = `${user}@arijeet:${cwd.length ? `~/${cwd.join("/")}` : "~"}${root ? "#" : "$"}`;

  const print = useCallback((text, kind = "out") => {
    const id = ++idRef.current;
    const arr = Array.isArray(text) ? text : String(text).split("\n");
    setLines((prev) => [...prev, ...arr.map((t, i) => ({ id: `${id}-${i}`, text: t, kind }))]);
    return id;
  }, []);

  const replaceLive = useCallback((liveId, text, kind = "out") => {
    setLines((prev) => {
      const without = prev.filter((l) => !l.id.startsWith(`live${liveId}-`));
      const arr = Array.isArray(text) ? text : [text];
      return [...without, ...arr.map((t, i) => ({ id: `live${liveId}-${i}`, text: t, kind }))];
    });
  }, []);

  const found = useCallback((key) => {
    const set = loadFound();
    if (set.has(key)) return;
    set.add(key);
    try { localStorage.setItem("arijeet.terminal.found", JSON.stringify([...set])); } catch { /* ignore */ }
    print(`[secret found: ${key}]  ${set.size}/${SECRETS.length}`, "accent");
  }, [print]);

  /* ---- boot banner ---- */
  useEffect(() => {
    print(BANNER, "banner");
    print([
      "",
      `tty1 on arijeetdas.in  ${kolkataTime()} IST`,
      root ? "Cheat code accepted. You are root. Please don't delete Kolkata." : "This is not ArijeetOS. Nobody here is smart. Type 'help'.",
      ""
    ], "muted");
    if (root) found("root");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines]);
  useEffect(() => { if (!busy) inputRef.current?.focus(); }, [busy]);

  /* ---- animations ---- */
  const run = useCallback(async (fn) => {
    setBusy(true);
    abortRef.current = false;
    try { await fn(); } finally { setBusy(false); }
  }, []);

  const typeLines = useCallback(async (list, delay = 260, kind = "out") => {
    for (const l of list) {
      if (abortRef.current) { print("^C", "muted"); return; }
      print(l, kind);
      await sleep(delay);
    }
  }, [print]);

  /* ---- command interpreter ---- */
  const execute = useCallback(async (raw) => {
    const line = raw.trim();
    if (!line) return;
    const [cmd0, ...args] = line.split(/\s+/);
    const cmd = cmd0.toLowerCase();
    const rest = args.join(" ");

    switch (cmd) {
      case "help":
        print(HELP.map(([c, d]) => `  ${c.padEnd(44)} ${d}`));
        print("  Tab completes, \u2191/\u2193 browse history, Ctrl+C stops animations, Esc closes.", "muted");
        break;
      case "ls": {
        const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
        const target = args.find((a) => !a.startsWith("-"));
        const { node } = resolve(fs, cwd, target);
        if (node === undefined) { print(`ls: ${target}: No such file or directory`, "err"); break; }
        if (typeof node === "string") { print(target); break; }
        const names = Object.keys(node).filter((n) => showAll || !n.startsWith(".")).map((n) => (typeof node[n] === "object" ? `${n}/` : n));
        print(names.join("    "));
        if (showAll) found("secrets");
        break;
      }
      case "cd": {
        if (!rest || rest === "~") { setCwd([]); break; }
        const { path, node } = resolve(fs, cwd, rest);
        if (node === undefined) print(`cd: ${rest}: No such directory`, "err");
        else if (typeof node !== "object") print(`cd: ${rest}: Not a directory`, "err");
        else setCwd(path);
        break;
      }
      case "pwd": print(`/home/${user}${cwd.length ? `/${cwd.join("/")}` : ""}`); break;
      case "cat": {
        if (!rest) { print("cat: which file? Try 'cat about.txt'", "err"); break; }
        const { node } = resolve(fs, cwd, rest);
        if (node === undefined) print(`cat: ${rest}: No such file`, "err");
        else if (typeof node === "object") print(`cat: ${rest}: Is a directory`, "err");
        else { print(node); if (rest.includes(".secrets")) found("secrets"); }
        break;
      }
      case "tree": {
        const out = ["~"];
        const walk = (node, pad) => Object.keys(node).forEach((k, i, arr) => {
          const last = i === arr.length - 1;
          out.push(`${pad}${last ? "\u2514\u2500\u2500 " : "\u251c\u2500\u2500 "}${k}${typeof node[k] === "object" ? "/" : ""}`);
          if (typeof node[k] === "object") walk(node[k], pad + (last ? "    " : "\u2502   "));
        });
        walk(fs, "");
        print(out);
        break;
      }
      case "whoami": print(root ? "root (allegedly)" : "guest. Arijeet is the one who builds things. You're the one who reads them."); break;
      case "neofetch": {
        let cups = 0;
        try { cups = Number(localStorage.getItem("arijeet.cups") || 0); } catch { /* ignore */ }
        const logo = ["   _____  ", "  /  _  \\ ", " /  /_\\  \\", "/    |    \\", "\\____|__  /", "        \\/ "];
        const info = [
          `${user}@arijeet`,
          "-------------",
          "OS: ArijeetOS tty 4.2 (not the AI one)",
          "Host: arijeetdas.in",
          `Shell: ${root ? "rootsh" : "guestsh"} 0.1`,
          `Projects: ${projects.length} (${projects.filter((p) => p.tone === "dev").length} in development)`,
          `Phosphor: ${getPhosphor()}`,
          `Coffee: ${cups} cups logged on this browser`,
          "Location: Kolkata, India"
        ];
        print(info.map((l, i) => `${(logo[i] || "").padEnd(14)}${l}`));
        break;
      }
      case "date": print(`${new Date().toDateString()}  ${kolkataTime()} IST`); break;
      case "uptime": {
        const s = Math.round((Date.now() - opened.current) / 1000);
        print(`up ${s}s in this terminal, up since 2023 in B.Tech, load average: 3 coffees`);
        break;
      }
      case "echo": print(rest || ""); break;
      case "clear": setLines([]); break;
      case "history": print(historyRef.current.map((c, i) => `${String(i + 1).padStart(4)}  ${c}`)); break;
      case "exit": case "quit": case "logout": onClose(); break;

      case "theme": {
        const name = (args[0] || "").toLowerCase();
        if (!name) { print(`current: ${getPhosphor()}. options: ${PHOSPHORS.join(", ")}, random`); break; }
        if (name !== "random" && !PHOSPHORS.includes(name)) { print(`theme: unknown phosphor '${name}'`, "err"); break; }
        print(`phosphor set to ${applyPhosphor(name)}`, "accent");
        break;
      }
      case "light": applyTheme("light"); print("Page switched to light. This terminal stays dark, on principle."); break;
      case "dark": applyTheme("dark"); print("Page switched to dark. Welcome home."); break;

      case "projects":
        print(projects.map((p) => `  ${p.id.padEnd(14)} ${p.status.padEnd(28)} ${p.summary}`));
        print("  open <name> to see one on the page, or cat projects/<name>.md", "muted");
        break;
      case "open": {
        const p = projects.find((x) => x.id === (args[0] || "").toLowerCase() || x.title.toLowerCase() === rest.toLowerCase());
        if (!p) { print(`open: no project '${rest}'. Try: ${projects.map((x) => x.id).join(", ")}`, "err"); break; }
        print(`Opening ${p.title}...`, "accent");
        onClose();
        setTimeout(() => actions.openProject(p.id), 250);
        break;
      }
      case "resume": print("Downloading resume...", "accent"); actions.downloadResume(); break;
      case "contact": case "email": print(fs["contact.txt"]); break;
      case "hire":
        print([
          "Short version for busy people:",
          "- builds and ships Flutter and Android apps (DropNet, FetchNet)",
          "- comfortable below the UI: sockets, encryption, on-device ML",
          "- 7.98 CGPA, graduating 2027, available for internships",
          "Run 'resume' or 'contact'."
        ]);
        break;
      case "arijeetos":
        print("Handing you over to the smart one...", "accent");
        setTimeout(() => actions.openEngram(rest || null), 300);
        break;

      case "sudo": {
        found("sudo");
        if (/rm\s+-rf\s+\/?/.test(rest)) {
          await run(async () => {
            await typeLines(["Deleting /home/arijeet/sleep_schedule ... done", "Deleting /usr/bin/patience ... done", "Deleting /dev/coffee ... ERROR: resource busy", "Kernel panic: not syncing. Just kidding.", "Restored from backup. Please don't do that again."], 420, "err");
          });
        } else if (/make (me )?a? ?sandwich/.test(rest)) print("Okay.");
        else if (!rest) print("usage: sudo <command>", "err");
        else if (root) { print(`[root] running '${rest}' with great power and no responsibility`); await execute(rest); }
        else print(`${user} is not in the sudoers file. This incident will be reported to Arijeet's mom.`, "err");
        break;
      }
      case "make":
        print(/sandwich/.test(rest) ? "What? Make it yourself." : `make: *** No rule to make target '${rest || "anything"}'. Stop.`, "err");
        break;
      case "rm": print(/-rf/.test(rest) ? "rm: permission denied. Nice try though. (have you tried sudo?)" : "rm: this filesystem is read-only, like my patience at 3 a.m.", "err"); break;

      case "coffee":
        found("coffee");
        print(COFFEE_ART, "accent");
        try { localStorage.setItem("arijeet.cups", String(Number(localStorage.getItem("arijeet.cups") || 0) + 1)); } catch { /* ignore */ }
        print("Coffee level: 100%. Bug tolerance: restored.");
        break;
      case "fortune": print(pick(FORTUNES)); break;
      case "joke": print(pick(JOKES)); break;
      case "cowsay": print(COW(rest)); break;
      case "8ball": print(rest ? `\u25cf ${pick(EIGHT_BALL)}` : "8ball: ask a question first", rest ? "accent" : "err"); break;
      case "flip": print(Math.random() < 0.5 ? "Heads. Ship it." : "Tails. Write tests first."); break;
      case "roll": {
        const sides = Math.max(2, Math.min(1000, parseInt(args[0], 10) || 6));
        const n = 1 + Math.floor(Math.random() * sides);
        print(`d${sides} \u2192 ${n}${n === sides ? "  critical hit" : n === 1 ? "  critical bug" : ""}`);
        break;
      }
      case "rps": {
        const moves = ["rock", "paper", "scissors"];
        const me = (args[0] || "").toLowerCase();
        if (!moves.includes(me)) { print("rps: pick rock, paper or scissors", "err"); break; }
        const cpu = pick(moves);
        const win = (me === "rock" && cpu === "scissors") || (me === "paper" && cpu === "rock") || (me === "scissors" && cpu === "paper");
        print(`you: ${me}   me: ${cpu}   \u2192 ${me === cpu ? "draw. rematch?" : win ? "you win. I demand a recount." : "I win. As expected of a terminal."}`);
        if (win) found("rps");
        break;
      }
      case "guess": {
        const n = parseInt(args[0], 10);
        if (!gameRef.current || Number.isNaN(n)) {
          gameRef.current = { target: 1 + Math.floor(Math.random() * 100), tries: 0 };
          print("I picked a number between 1 and 100. Type 'guess <n>'.");
          break;
        }
        gameRef.current.tries++;
        const { target, tries } = gameRef.current;
        if (n === target) { print(`Correct, ${target}, in ${tries} tries. ${tries <= 7 ? "Binary search would be proud." : "Linear search energy."}`, "accent"); gameRef.current = null; found("guess"); }
        else print(n < target ? "Higher." : "Lower.");
        break;
      }
      case "persona": { const p = pick(PERSONAS); print(`You are ${p.name}: ${p.why}. (UltraVision has nine of these, public soon.)`); break; }

      case "sl":
        found("sl");
        await run(async () => {
          const live = ++idRef.current;
          const width = 64;
          for (let x = width; x > -TRAIN[0].length; x -= 2) {
            if (abortRef.current) break;
            replaceLive(live, TRAIN.map((row) => (x >= 0 ? " ".repeat(x) + row : row.slice(-x)).slice(0, width + 10)), "accent");
            await sleep(45);
          }
          replaceLive(live, ["You meant 'ls'. The train came anyway."], "muted");
        });
        break;
      case "matrix": found("matrix"); setMatrix(true); print("Wake up, guest...", "accent"); break;
      case "hack":
        found("hack");
        await run(async () => {
          const live = ++idRef.current;
          for (let i = 0; i <= 20; i++) {
            if (abortRef.current) break;
            replaceLive(live, `[${"#".repeat(i)}${".".repeat(20 - i)}] ${i * 5}%`, "accent");
            await sleep(80);
          }
          await typeLines(HACK_LINES, 320);
        });
        break;
      case "ping": {
        const host = args[0] || "arijeet";
        await run(async () => {
          print(`PING ${host} (192.168.1.${10 + (host.length % 200)}): 56 data bytes`);
          for (let i = 0; i < 4; i++) {
            if (abortRef.current) break;
            await sleep(480);
            const ms = host.includes("arijeet") ? (2 + Math.random() * 3).toFixed(1) : (18 + Math.random() * 60).toFixed(1);
            print(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms} ms${host.includes("arijeet") && i === 3 ? "  (replies faster by email)" : ""}`);
          }
        });
        break;
      }
      case "dropnet": {
        if (args[0] !== "send" || !args[1]) { print("usage: dropnet send <file>", "err"); break; }
        const file = args.slice(1).join(" ");
        await run(async () => {
          await typeLines(["> looking for receivers on the LAN", "> found pixel-7 at 192.168.1.14", "> session code K7Q2MX"], 380);
          const live = ++idRef.current;
          for (let i = 0; i <= 24; i++) {
            if (abortRef.current) break;
            replaceLive(live, `> sending ${file} [${"#".repeat(i)}${".".repeat(24 - i)}] ${Math.round((i / 24) * 100)}%`);
            await sleep(70);
          }
          if (!abortRef.current) print("> verified sha256 ok, crc32 ok. No internet was used.", "accent");
        });
        break;
      }
      case "git":
        if (args[0] === "log") print(GIT_LOG);
        else if (args[0] === "push") print("Everything up-to-date. Unlike my sleep schedule.");
        else if (args[0] === "blame") print("It was me. It's always me.");
        else print("git: try 'git log', 'git push' or 'git blame'", "err");
        break;
      case "vim":
        found("vim");
        print(["~", "~", "~", "VIM - Vi IMproved", "~", "type :q to exit (good luck)"], "muted");
        gameRef.current = { vim: true };
        break;
      case ":q": case ":q!": case ":wq":
        print(gameRef.current && gameRef.current.vim ? "You escaped vim. Most people don't." : "You're not in vim. But good instinct.");
        gameRef.current = null;
        break;
      case "weather": print("Kolkata: humid. Also humid tomorrow. Chance of rain: yes."); break;
      case "hello": case "hi": print("Hello. I'm a terminal, I can't do small talk. Try 'arijeetos' for that."); break;
      case "credits": print(["Built by Arijeet Das.", "Train by sl, cow by cowsay, coffee by Kolkata.", "Design pass inspired by unslop by @heydamir."]); break;
      case "42": found("42"); print("The answer. Now what was the question? (probably 'why is Gradle slow')"); break;
      case "achievements": {
        const set = loadFound();
        print(SECRETS.map((s) => `  ${set.has(s) ? "[x]" : "[ ]"} ${set.has(s) ? s : "???"}`));
        print(`  ${set.size}/${SECRETS.length} found`, "muted");
        break;
      }
      default:
        print(`${cmd}: command not found. Type 'help'.`, "err");
    }
  }, [fs, cwd, print, replaceLive, found, run, typeLines, onClose, actions, projects, root, user]);

  /* ---- input handling ---- */
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const value = input;
    setInput("");
    print(`${promptText} ${value}`, "in");
    if (value.trim()) {
      historyRef.current.push(value.trim());
      histIdx.current = historyRef.current.length;
    }
    await execute(value);
  };

  const complete = () => {
    const parts = input.split(" ");
    if (parts.length === 1) {
      const matches = COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (matches.length === 1) setInput(`${matches[0]} `);
      else if (matches.length > 1) print(matches.join("  "), "muted");
      return;
    }
    const last = parts[parts.length - 1];
    const dirPart = last.includes("/") ? last.slice(0, last.lastIndexOf("/") + 1) : "";
    const { node } = resolve(fs, cwd, dirPart || ".");
    if (!node || typeof node !== "object") return;
    const base = last.slice(dirPart.length);
    const names = Object.keys(node).filter((n) => n.startsWith(base) && (base.startsWith(".") || !n.startsWith(".")));
    if (names.length === 1) {
      parts[parts.length - 1] = dirPart + names[0] + (typeof node[names[0]] === "object" ? "/" : "");
      setInput(parts.join(" "));
    } else if (names.length > 1) print(names.join("  "), "muted");
  };

  const onKeyDown = (e) => {
    if (e.key === "Tab") { e.preventDefault(); complete(); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      histIdx.current = Math.max(0, histIdx.current - 1);
      setInput(historyRef.current[histIdx.current] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      histIdx.current = Math.min(historyRef.current.length, histIdx.current + 1);
      setInput(historyRef.current[histIdx.current] || "");
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLines([]); }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "c" && e.ctrlKey && busy) { abortRef.current = true; setMatrix(false); }
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => { window.removeEventListener("keydown", onKey); document.body.classList.remove("no-scroll"); };
  }, [onClose, busy]);

  return h(motion.div, {
    className: `tty ${root ? "tty-root" : ""}`,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Secret terminal",
    initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
    transition: { duration: 0.2, ease: EASE },
    onClick: () => inputRef.current?.focus()
  },
    h("div", { className: "tty-bar" },
      h("span", { className: "tty-hazard", "aria-hidden": "true" }),
      h("span", { className: "tty-title" }, `TTY1 // ${user.toUpperCase()}@ARIJEET`),
      h("span", { className: "tty-sub" }, root ? "ROOT ACCESS" : "NOT ARIJEETOS"),
      h("button", { className: "tty-close", onClick: onClose, "aria-label": "Close terminal" }, h(Icon, { name: "close", size: 16 }))
    ),
    h("div", { className: "tty-screen" },
      matrix ? h(MatrixRain, { onDone: () => setMatrix(false) }) : null,
      h("div", { className: "tty-lines", "aria-live": "polite" },
        lines.map((l) => h("div", { key: l.id, className: `tty-line tty-${l.kind}` }, l.text || "\u00a0"))
      ),
      // Phones have no Tab, arrows or backtick: one-tap commands instead.
      h("div", { className: "tty-quick", role: "toolbar", "aria-label": "Quick commands" },
        QUICK.map((q) => h("button", {
          key: q,
          type: "button",
          className: "tty-quick-btn",
          disabled: busy,
          onClick: (e) => { e.stopPropagation(); print(`${promptText} ${q}`, "in"); historyRef.current.push(q); execute(q); }
        }, q))),
      h("form", { className: "tty-input-row", onSubmit: submit },
        h("label", { className: "tty-prompt", htmlFor: "tty-input" }, promptText),
        h("input", {
          id: "tty-input",
          ref: inputRef,
          className: "tty-input",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown,
          autoComplete: "off",
          autoCapitalize: "off",
          spellCheck: "false",
          disabled: busy,
          "aria-label": "Terminal command"
        })
      ),
      h("div", { ref: endRef })
    )
  );
}
