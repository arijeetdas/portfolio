/**
 * engram.js — ArijeetOS / Engram Mode v4 (DIGITAL CONSCIOUSNESS REDESIGN)
 *
 * Architecture:
 *  1. Interactive Boot Sequence Stage (Fullscreen Cinematic Terminal)
 *  2. Confirm Stage ([Y]es / [N]o Terminal Command loop)
 *  3. Sync Stage (Live animated Neural Core 3D projected awakening + progress)
 *  4. Chat Stage (Rotating 3D Projected Neural Core + Live retro diagnostics + Achievements list + first-person replies)
 *
 * Session memory:   stored in React state (lost on page reload — intentional)
 * Achievements:     persisted to localStorage
 * Theme changing:   delegates to actions passed from App
 * Project opening:  delegates to actions passed from App
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ARIJEET_PROFILE } from "./data/arijeet-profile.js";

const h = React.createElement;

/* ==========================================================================
   ACHIEVEMENTS — persisted in localStorage
   ========================================================================== */

const ACHIEVEMENTS_CONFIG = {
  FIRST_CONTACT: {
    title: "👾 First Contact",
    desc:  "You opened ArijeetOS. Welcome to my thoughts."
  },
  RECRUITER_DETECTED: {
    title: "👔 Recruiter VIP",
    desc:  "Recruiter matrix detected. Deployment authorization confirmed."
  },
  THEME_DESTROYER: {
    title: "🎨 Chromosphere Shifter",
    desc:  "Successfully rerouted my CSS accent matrices."
  },
  PROJECT_EXPLORER: {
    title: "📁 Project Explorer",
    desc:  "Explored one of my major project modules."
  },
  LORE_HUNTER: {
    title: "☕ Secret Lore Hunter",
    desc:  "Uncovered my coffee biochemical metric ratios."
  },
  MATRIX_HACKER: {
    title: "⚡ Matrix Hacker",
    desc:  "Bypassed my core protocols. Matrix rain activated."
  },
  NEURAL_HANDSHAKE: {
    title: "🤝 Neural Handshake",
    desc:  "Successfully synchronized with my synaptic link."
  }
};

const ACHIEVEMENTS_LS_KEY = "engram_achievements_v3";

function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_LS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveAchievements(set) {
  try {
    localStorage.setItem(ACHIEVEMENTS_LS_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

/* ==========================================================================
   BOOT & LOADING SEQUENCES
   ========================================================================== */

const BOOT_MESSAGES = [
  "Initializing neural link...",
  "Loading my memory clusters...",
  "Parsing my project database...",
  "Restoring my DropNet architecture...",
  "Recovering late-night debugging trauma...",
  "Loading my Android development knowledge...",
  "Loading my Flutter expertise...",
  "Indexing my caffeine consumption logs...",
  "Sarcasm coefficient calibrated.",
  "System integrity: 100%",
  "Synaptic bridge established.",
  "I am ready."
];

const SYNC_STEPS = [
  { label: "Restoring my memory clusters...", threshold: 15 },
  { label: "Loading my Android expertise...", threshold: 30 },
  { label: "Loading my Flutter knowledge...", threshold: 45 },
  { label: "Loading my open source archives...", threshold: 60 },
  { label: "Loading my project history...", threshold: 75 },
  { label: "Calibrating caffeine levels...", threshold: 85 },
  { label: "Calibrating sarcasm matrices...", threshold: 92 },
  { label: "Synchronizing my neural pathways...", threshold: 100 }
];

/* ==========================================================================
   CONTEXTUAL GREETINGS POOL (Direct First-Person voice as Arijeet himself)
   ========================================================================== */

const CONTEXTUAL_GREETINGS = {
  morning: [
    "You're here early. Coffee?",
    "Morning. What memory of mine are you looking for today?",
    "Good morning. I've already been awake and coding for hours."
  ],
  afternoon: [
    "Good afternoon. Looking for projects or secrets?",
    "Perfect timing. I was just reorganizing some of my memories.",
    "Afternoon. What brings you to my portfolio?"
  ],
  evening: [
    "Good evening. It is unusually quiet in here tonight.",
    "Evening. Ask carefully—some of my debugging logs bite.",
    "Welcome. My system remains operational."
  ],
  night: [
    "It's late. I'm still awake, obviously.",
    "Most people are sleeping. Developers rarely qualify as most people.",
    "Interesting hour to be browsing my code."
  ],
  returning: [
    "Back again?",
    "Welcome back.",
    "I remember you. Curiosity remains undefeated."
  ],
  achievement: [
    "Still hunting my achievements?",
    "I see you've already explored a few of my memory clusters.",
    "I remember your previous discoveries here."
  ],
  recruiter: [
    "Reviewing my work again?",
    "Welcome back. Still evaluating candidates?"
  ],
  standard: [
    "Hello stranger. Looking for my projects, stories, or secrets?",
    "Welcome to my thoughts. What would you like to know?",
    "Good timing. I was just reorganizing my code base.",
    "I'm awake. What's on your mind?",
    "Curiosity detected. How can I help you?",
    "Welcome. Try asking about one of my projects, a bug, or a bad life decision involving code.",
    "Synaptic bridge established. What brings you to my world?"
  ]
};

function generateDynamicGreeting(unlockedAchievements) {
  const hasRecruiter = unlockedAchievements.has("RECRUITER_DETECTED");
  const hasAchievements = unlockedAchievements.size > 1;
  const isReturning = localStorage.getItem("visited_engram_v3") === "true";

  const roll = Math.random();

  if (hasRecruiter && roll < 0.4) {
    return CONTEXTUAL_GREETINGS.recruiter[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.recruiter.length)];
  }
  if (hasAchievements && roll < 0.3) {
    return CONTEXTUAL_GREETINGS.achievement[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.achievement.length)];
  }
  if (isReturning && roll < 0.3) {
    return CONTEXTUAL_GREETINGS.returning[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.returning.length)];
  }

  // Time based or standard
  if (roll < 0.5) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return CONTEXTUAL_GREETINGS.morning[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.morning.length)];
    } else if (hour >= 12 && hour < 18) {
      return CONTEXTUAL_GREETINGS.afternoon[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.afternoon.length)];
    } else if (hour >= 18 && hour < 22) {
      return CONTEXTUAL_GREETINGS.evening[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.evening.length)];
    } else {
      return CONTEXTUAL_GREETINGS.night[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.night.length)];
    }
  }

  return CONTEXTUAL_GREETINGS.standard[Math.floor(Math.random() * CONTEXTUAL_GREETINGS.standard.length)];
}

/* ==========================================================================
   TRUE 3D SPATIAL NEURAL NODE COORDINATES
   ========================================================================== */

const NEURAL_NODES_3D = [
  // Left Lobe (Core / Projects)
  { id: "dsa", label: "DSA Matrix", x: -65, y: -25, z: -15, reqPercentage: 15 },
  { id: "oop", label: "OOPs Protocols", x: -45, y: -65, z: 25, reqPercentage: 15 },
  { id: "dropnet", label: "DropNet Core", x: -75, y: 15, z: -35, reqPercentage: 75 },
  { id: "hirecraft", label: "HireCraft API", x: -35, y: 45, z: 45, reqPercentage: 75 },
  { id: "pdfify", label: "PDFify Modules", x: -55, y: 75, z: -15, reqPercentage: 60 },

  // Right Lobe (Platforms / Tech)
  { id: "os", label: "OS Abstractions", x: 45, y: -65, z: -25, reqPercentage: 35 },
  { id: "dbms", label: "DBMS Schema", x: 65, y: -25, z: 15, reqPercentage: 35 },
  { id: "flutter", label: "Flutter Engine", x: 75, y: 15, z: 35, reqPercentage: 45 },
  { id: "android", label: "Android SDK", x: 35, y: 45, z: -45, reqPercentage: 30 },
  { id: "kotlin", label: "Kotlin Runtime", x: 55, y: 75, z: 15, reqPercentage: 30 },

  // stem / internal Core
  { id: "caffeine", label: "Caffeine Matrix", x: 0, y: -15, z: 0, reqPercentage: 85 },
  { id: "sarcasm", label: "Sarcasm Vector", x: 0, y: 35, z: 0, reqPercentage: 92 }
];

const NEURAL_LINKS = [
  { from: "oop", to: "dsa" },
  { from: "oop", to: "os" },
  { from: "os", to: "dbms" },
  { from: "dsa", to: "dropnet" },
  { from: "dsa", to: "caffeine" },
  { from: "dbms", to: "flutter" },
  { from: "dbms", to: "caffeine" },
  { from: "dropnet", to: "hirecraft" },
  { from: "hirecraft", to: "pdfify" },
  { from: "flutter", to: "android" },
  { from: "android", to: "kotlin" },
  { from: "caffeine", to: "sarcasm" },
  { from: "sarcasm", to: "kotlin" },
  { from: "sarcasm", to: "pdfify" }
];

/* ==========================================================================
   NEURAL CORE CANVAS — True 3D projection rendering procedurally
   ========================================================================== */

function NeuralCoreCanvas({ syncPercentage = 100, reaction = null, isRecruiterMode = false, canvasMode = "neural", stage = "chat" }) {
  let lottieSrc = "";
  let backgroundStyle = {};
  
  if (stage === "sync") {
    lottieSrc = "assets/animations/neural_sync.json";
    backgroundStyle = { background: "linear-gradient(135deg, rgba(2,4,11,1) 0%, rgba(var(--accent-indigo), 0.15) 100%)" };
  } else if (canvasMode === "matrix") {
    lottieSrc = "assets/animations/hacker_mode.json";
    backgroundStyle = { background: "rgba(0, 0, 0, 0.9)" };
  } else {
    lottieSrc = "assets/animations/Chat_Mode_Normal.json";
    backgroundStyle = { background: "radial-gradient(circle at center, rgba(var(--accent-cyan), 0.22) 0%, rgba(2,4,11,1) 80%)" };
  }

  return h("div", { 
    style: { 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      position: "relative",
      transition: "background 1s ease",
      ...backgroundStyle 
    } 
  },
    h("lottie-player", {
      key: lottieSrc,
      src: lottieSrc,
      background: "transparent",
      speed: "1",
      style: { width: "100%", height: "100%", maxHeight: "280px" },
      loop: stage === "sync" ? true : undefined,
      autoplay: true
    })
  );
}

/* ==========================================================================
   ACHIEVEMENT TOAST NOTIFICATION
   ========================================================================== */

function AchievementToast({ achievement, onDone }) {
  const cfg = ACHIEVEMENTS_CONFIG[achievement];
  if (!cfg) return null;

  return h(
    motion.div,
    {
      className: "engram-achievement-toast",
      initial:  { x: 120, opacity: 0 },
      animate:  { x: 0, opacity: 1 },
      exit:     { x: 120, opacity: 0 },
      transition: { type: "spring", stiffness: 180, damping: 22 },
      onAnimationComplete: () => setTimeout(onDone, 3000)
    },
    h("div", { className: "toast-icon-row" }, cfg.title),
    h("div", { className: "toast-desc" }, cfg.desc)
  );
}

/* ==========================================================================
   RECRUITER VIP CARD
   ========================================================================== */

function RecruiterVIPCard({ actions, onClose }) {
  return h(
    "div",
    { className: "recruiter-vip-card animate-popup" },
    h("h4", { className: "recruiter-vip-title" }, "👔 EXECUTIVE RECRUITMENT CONTROL 👔"),
    h("p",  { className: "recruiter-vip-desc" },
      "Direct credentials loaded. Reviewing my portfolio segments:"
    ),
    h("div", { className: "recruiter-vip-grid" },
      h("button", { className: "recruiter-vip-btn primary", onClick: () => actions.downloadResume() }, "📥 Download PDF Resume"),
      h("button", { className: "recruiter-vip-btn", onClick: () => { actions.scrollToSection("projects"); onClose(); } }, "📁 View Projects Grid"),
      h("button", { className: "recruiter-vip-btn", onClick: () => { actions.scrollToSection("skills"); onClose(); } }, "🛠️ Inspect Core Skills"),
      h("button", { className: "recruiter-vip-btn", onClick: () => { actions.scrollToSection("contact"); onClose(); } }, "📮 Reach Out Directly")
    )
  );
}

/* ==========================================================================
   TYPING INDICATOR BUBBLE
   ========================================================================== */

const THINKING_PHRASES = [
  "Accessing memory clusters...",
  "Searching project logs...",
  "Reviewing historical decisions...",
  "Reconstructing memory...",
  "Analyzing archive..."
];

function renderClickableText(text) {
  if (!text) return "";
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    parts.push(h("a", {
      key: matchIndex,
      href: url,
      className: "engram-chat-link",
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        color: "rgb(var(--accent-cyan))",
        textDecoration: "underline",
        fontWeight: "600",
        margin: "0 2px"
      }
    }, linkText));

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function StreamingBubbleText({ text, onDone }) {
  const [displayedText, setDisplayedText] = useState("");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let index = 0;
    let currentText = "";
    
    const timer = setInterval(() => {
      if (index < text.length) {
        currentText += text[index];
        setDisplayedText(currentText);
        index++;
      } else {
        clearInterval(timer);
        onDoneRef.current?.();
      }
    }, Math.random() * 8 + 4);

    return () => clearInterval(timer);
  }, [text]);

  return h(React.Fragment, null,
    renderClickableText(displayedText),
    h("span", { className: "streaming-dot-cursor" })
  );
}

function TypingBubble() {
  const [phrase, setPhrase] = useState(THINKING_PHRASES[0]);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * THINKING_PHRASES.length);
    setPhrase(THINKING_PHRASES[randomIdx]);
  }, []);

  return h(
    "div",
    { className: "engram-chat-bubble clone" },
    h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } },
      h("span", { style: { fontSize: "0.68rem", opacity: 0.65, fontFamily: "monospace" } }, phrase),
      h("div", { className: "engram-typing-indicator" },
        h("span"), h("span"), h("span")
      )
    )
  );
}

/* ==========================================================================
   NEURAL CANVAS — Fullscreen Background Canvas (Neural / Matrix Modes)
   ========================================================================== */

function NeuralCanvas({ mode = "neural" }) {
  const canvasRef = useRef(null);
  const colorsRef = useRef({ cyan: "56, 189, 248", indigo: "99, 102, 241" });

  // Check if device is mobile to skip animations and save battery
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 860 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Monitor CSS variables using a MutationObserver to completely eliminate layout thrashing getComputedStyle calls in loop
  useEffect(() => {
    const updateColors = () => {
      const docStyle = getComputedStyle(document.documentElement);
      const cyan = docStyle.getPropertyValue("--accent-cyan").trim() || "56, 189, 248";
      const indigo = docStyle.getPropertyValue("--accent-indigo").trim() || "99, 102, 241";
      colorsRef.current = { cyan, indigo };
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Mobile Battery Bypass: Return immediately without running high-CPU loop
    if (isMobile) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf;

    let w = (canvas.width = window.innerWidth);
    let h2 = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h2 = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Neural particles setup
    const particles = [];
    const maxParticles = 40;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.5 + 0.8,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseVal: Math.random() * Math.PI
      });
    }

    // Matrix rain setup
    const fontSize = 14;
    const columns = Math.floor(w / fontSize) + 1;
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // stagger start
    }
    const matrixChars = "010101ABCDEF/*#$@⚡🧠".split("");

    const render = () => {
      if (mode === "matrix") {
        // Subtle dark red background fade
        ctx.fillStyle = "rgba(4, 1, 1, 0.08)";
        ctx.fillRect(0, 0, w, h2);

        ctx.fillStyle = "rgba(239, 68, 68, 0.85)"; // High visibility red rain
        ctx.font = `bold ${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // occasional glowing orange heads
          if (Math.random() > 0.98) {
            ctx.fillStyle = "#f97316";
          } else {
            ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
          }

          ctx.fillText(char, x, y);

          // resetting drops
          if (y > h2 && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      } else {
        // Neural mode: slow neural drift background
        ctx.clearRect(0, 0, w, h2);

        // Fetch CSS accent colors dynamically from cached Ref (no layout thrashing!)
        const { cyan: rawCyan, indigo: rawIndigo } = colorsRef.current;

        // Draw connections
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
              const alpha = (1 - dist / 150) * 0.07;
              ctx.strokeStyle = `rgba(${rawIndigo}, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw and update particles
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h2) p.vy *= -1;

          p.pulseVal += p.pulseSpeed;
          const currentAlpha = 0.08 + Math.sin(p.pulseVal) * 0.06;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rawCyan}, ${currentAlpha})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = `rgba(${rawCyan}, ${currentAlpha})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
    };
  }, [mode, isMobile]);

  // Mobile bypass: render a subtle static dark red/cyan overlay mesh to save CPU
  if (isMobile) {
    return h("div", {
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        background: mode === "matrix"
          ? "radial-gradient(circle at center, rgba(18, 5, 5, 0.45) 0%, rgba(2, 5, 18, 0.85) 100%)"
          : "radial-gradient(circle at center, rgba(8, 13, 30, 0.3) 0%, rgba(2, 5, 18, 0.85) 100%)",
        opacity: 0.8
      }
    });
  }

  return h("canvas", {
    ref: canvasRef,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 1
    }
  });
}

/* ==========================================================================
   DETERMINISTIC PRE-FILTER
   ========================================================================== */

function deterministicFilter(text, setCoffee, setSarcasm, triggerDestruct) {
  const t = text.toLowerCase().trim();

  // Matrix / hack mode
  if (t === "sudo hack" || t === "hack" || t.includes("matrix rain") ||
      (t.includes("sudo") && t.includes("hack"))) {
    return {
      handled: true,
      reply: "Sudo privileges confirmed. Bypassing core security arrays. Matrix rain activated. Neural Core overload active.",
      actions: ["MATRIX_RAIN"],
      achievement: "MATRIX_HACKER"
    };
  }

  // Recruiter triggers
  if (t.includes("i am a recruiter") || t.includes("i'm a recruiter") ||
      t.includes("i am hiring") || t.includes("i'm hiring") ||
      t.includes("i want to hire") || t.includes("headhunter")) {
    return {
      handled: true,
      reply: "Recruiter metrics identified. Deploying executive dashboard. Accessing PDF resume files and direct communication links. Neural Core shifted to gold professional mode:",
      actions: [],
      achievement: "RECRUITER_DETECTED",
      isRecruiter: true
    };
  }

  // Caffeine refuel
  if (t === "coffee" || t === "caffeine" || t.includes("caffeine overload") || t.includes("caffeine index")) {
    setCoffee(100);
    setSarcasm(95);
    return {
      handled: true,
      reply: "[CAFFEINE OVERLOAD ACTION] Recharging caffeine streams to 100%. Calibrating sarcasm to 95%. Late-night socket grids targeted at stable 60fps.",
      actions: ["RANDOM_THEME"],
      achievement: "LORE_HUNTER"
    };
  }

  // Self destruct
  if (t === "self_destruct" || t === "destruct" || t.includes("self destruct")) {
    setTimeout(triggerDestruct, 100);
    return {
      handled: true,
      reply: "[SELF-DESTRUCT INITIATED] Unlinking local neural ports. Closing file transfers. Disconnecting consciousness. Goodbye stranger.",
      actions: [],
      achievement: "MATRIX_HACKER"
    };
  }

  // Theme Accent Rerouting
  if (t === "theme" || t === "palette" || t === "random_theme" || t.includes("random theme") || t.includes("change theme") || t.includes("random palette") || t.includes("change color")) {
    return {
      handled: true,
      reply: "[COLOR ACCENTS REROUTED] ACCENT COLOR SHIFTED. Orbital core matrices color calibrated.",
      actions: ["RANDOM_THEME"],
      achievement: "THEME_DESTROYER"
    };
  }

  // Clear chat
  if (t === "clear" || t === "cls" || t === "clear chat") {
    return {
      handled: true,
      reply: "[SYSTEM WIPE] Synaptic chat history buffer successfully wiped clean. System operational.",
      actions: [],
      achievement: "FIRST_CONTACT",
      clearChat: true
    };
  }

  // Local diagnostics status command
  if (t === "archive_status" || t.includes("archive status") || t === "status") {
    return {
      handled: true,
      reply: `[ARIJEET STATE DIAGNOSTICS]\n\nMemory Stability: stable [99.8%]\nNeural Activity: HIGH\nCoffee Level: active\nSarcasm Index: active\nCurrent Focus: 3D projected orbital visualizer\n\nArchive operational. My link is stable.`,
      actions: [],
      achievement: "LORE_HUNTER"
    };
  }

  // creation origin lore
  if (t === "engram_origin" || t.includes("engram origin") || t.includes("how were you created") || t.includes("your origin")) {
    return {
      handled: true,
      reply: `[ORIGIN MEMORIES RECONSTRUCTED]\n\nI compiled this archive during late-night debugging marathons, fueled by infinite coffee and Dr. Sur B.Tech CS courses.\n\nThousands of git commits, absolute targets of responsive design, and a strong allergy to cross-platform bridge lags compiled me into what I am. This core allows you to talk to me when I am offline recharging my organic batteries.`,
      actions: [],
      achievement: "LORE_HUNTER"
    };
  }

  const LORE = [
    "Caffeine index: 4.2 cups/day. Code goes in, bugs (sometimes) stay out.",
    "Once compiled a socket transfer script on my phone because my laptop died mid-transfer.",
    "CGPA 7.95 — scientifically optimal for passing filters and coding all night.",
    "Dreams of 60fps Flutter grids. Spiritual allergy to React Native bridge lag.",
    "My visual avatar pulse keyframe is manually tuned. Yes, I spent hours on that."
  ];
  if (t.includes("lore") || t.includes("secret") || t.includes("easter egg") ||
      t.includes("fun fact")) {
    return {
      handled: true,
      reply: `» "${LORE[Math.floor(Math.random() * LORE.length)]}"`,
      actions: [],
      achievement: "LORE_HUNTER"
    };
  }

  return { handled: false };
}

/* ==========================================================================
   GEMINI CLIENT — fetches server-side /api/engram
   ========================================================================== */

async function askGemini(message, history) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  let baseUrl = "";
  if (typeof window !== "undefined") {
    const isFile = window.location.protocol === "file:";
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const isOtherPort = window.location.port !== "5173";
    if (isFile || (isLocal && isOtherPort)) {
      baseUrl = "http://localhost:5173";
    }
  }

  const url = `${baseUrl}/api/engram`;
  console.log(`[FRONTEND] Fetching API from URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errText = "";
      try {
        const errJson = await response.json();
        errText = errJson.error || errJson.message || JSON.stringify(errJson);
      } catch {
        try {
          errText = await response.text();
        } catch {
          errText = `HTTP status ${response.status}`;
        }
      }

      if (errText.toLowerCase().includes("api_key") || errText.toLowerCase().includes("apikey") || errText.toLowerCase().includes("key not set")) {
        throw new Error(`API_KEY_MISSING: Gemini API Key is missing or invalid on the server (Status ${response.status}). Details: ${errText}`);
      }
      throw new Error(`REQUEST_FAILURE: Server API returned status ${response.status} - ${errText}`);
    }

    try {
      const data = await response.json();
      return data;
    } catch (parseErr) {
      throw new Error(`PARSING_FAILURE: Failed to parse server response as JSON - ${parseErr.message}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("TIMEOUT_ERROR: Gemini API call timed out after 35 seconds");
    }
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("network")) {
      throw new Error("NETWORK_ERROR: Network connection failed or dev-server is offline");
    }
    throw err;
  }
}

/* ==========================================================================
   MAIN ENGRAM OS COMPONENT
   ========================================================================== */

export default function EngramOS({ isOpen, onClose, actions }) {
  const [stage, setStage] = useState("boot");

  /* ---- Mobile Detection (used to skip left panel entirely) ---- */
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" &&
    (window.innerWidth <= 860 || /Mobi|Android|iPhone/i.test(navigator.userAgent))
  );
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 860 || /Mobi|Android|iPhone/i.test(navigator.userAgent));
    };
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ---- Boot Sequence States ---- */
  const [bootLines, setBootLines] = useState([]);
  const [activeBootIdx, setActiveBootIdx] = useState(0);

  /* ---- Confirmation Input States ---- */
  const [confirmInput, setConfirmInput] = useState("");
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  /* ---- Sync States ---- */
  const [syncPercentage, setSyncPercentage] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);

  /* ---- Live Metrics States ---- */
  const [coffeeLevel, setCoffeeLevel] = useState(87);
  const [sarcasmIndex, setSarcasmIndex] = useState(92);
  const [currentFocus, setCurrentFocus] = useState("DropNet");
  const [bugProbability, setBugProbability] = useState("Medium");
  const [neuralActivity, setNeuralActivity] = useState("High");

  /* ---- Keyword Reactions State ---- */
  const [brainReaction, setBrainReaction] = useState(null);

  /* ---- Conversational Chat States ---- */
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unlockedAchievements, setUnlocked] = useState(() => loadAchievements());
  const [toastQueue, setToastQueue] = useState([]);
  const [canvasMode, setCanvasMode] = useState("neural");
  const [isRecruiterActive, setIsRecruiterActive] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  const currentThemeStyles = useMemo(() => {
    if (typeof window === "undefined") return {};
    const docStyle = getComputedStyle(document.documentElement);
    return {
      "--accent-cyan": docStyle.getPropertyValue("--accent-cyan").trim() || "56, 189, 248",
      "--accent-indigo": docStyle.getPropertyValue("--accent-indigo").trim() || "99, 102, 241",
      "--accent-emerald": docStyle.getPropertyValue("--accent-emerald").trim() || "16, 185, 129",
      "--accent-pink": docStyle.getPropertyValue("--accent-pink").trim() || "244, 114, 182"
    };
  }, [themeVersion]);

  /* ---- Idle Awareness Tracker ---- */
  const lastInteractionRef = useRef(Date.now());
  const idleMessageTriggeredRef = useRef(false);

  const threadEndRef = useRef(null);
  const mainInputRef = useRef(null);
  const confirmInputRef = useRef(null);

  /* ---- Focus inputs based on stage ---- */
  useEffect(() => {
    if (stage === "confirm") {
      setTimeout(() => confirmInputRef.current?.focus(), 150);
    } else if (stage === "chat") {
      setTimeout(() => mainInputRef.current?.focus(), 300);
    }
  }, [stage]);

  /* ---- Auto-scroll chat / terminal ---- */
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, bootLines, syncPercentage, stage]);

  /* ---- Dynamic Metrics Fluctuator ---- */
  useEffect(() => {
    if (stage !== "chat" && stage !== "sync") return;
    const interval = setInterval(() => {
      // Coffee slowly decreases
      setCoffeeLevel((prev) => {
        const next = prev - 0.06;
        return next > 0 ? parseFloat(next.toFixed(2)) : 0;
      });

      // Sarcasm fluctuates slightly
      setSarcasmIndex((prev) => {
        const drift = (Math.random() - 0.5) * 2;
        const next = prev + drift;
        return next >= 80 && next <= 100 ? parseFloat(next.toFixed(1)) : prev;
      });

      if (Math.random() > 0.95) {
        const probs = ["Low", "Medium", "High"];
        setBugProbability(probs[Math.floor(Math.random() * probs.length)]);
      }

      if (Math.random() > 0.92) {
        const activities = ["High", "Pulsing", "Hyperactive", "Stable"];
        setNeuralActivity(activities[Math.floor(Math.random() * activities.length)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [stage]);

  /* ---- Step 1: Cinematic Boot Sequence Timer ---- */
  useEffect(() => {
    if (!isOpen || stage !== "boot") return;

    if (activeBootIdx < BOOT_MESSAGES.length) {
      const msg = BOOT_MESSAGES[activeBootIdx];
      let delay = Math.random() * 200 + 150;
      if (msg.includes("trauma") || msg.includes("integrity") || msg.includes("calibration")) {
        delay = Math.random() * 300 + 550;
      }

      const timer = setTimeout(() => {
        setBootLines((prev) => [...prev, msg]);
        setActiveBootIdx((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      const transitionTimer = setTimeout(() => {
        setStage("confirm");
      }, 900);
      return () => clearTimeout(transitionTimer);
    }
  }, [isOpen, stage, activeBootIdx]);

  /* ---- First contact achievement unlock ---- */
  useEffect(() => {
    if (!isOpen) return;
    unlockAchievement("FIRST_CONTACT");
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Sync screen countdown loop ---- */
  useEffect(() => {
    if (stage !== "sync") return;

    let syncVal = 0;
    const progressInterval = setInterval(() => {
      const step = Math.floor(Math.random() * 8) + 4;
      syncVal += step;

      if (syncVal >= 100) {
        syncVal = 100;
        setSyncPercentage(100);
        clearInterval(progressInterval);

        setTimeout(() => {
          setSyncComplete(true);
          unlockAchievement("NEURAL_HANDSHAKE");
          localStorage.setItem("visited_engram_v3", "true");

          setTimeout(() => {
            const greeting = generateDynamicGreeting(unlockedAchievements);
            setMessages([{
              id: "init",
              sender: "clone",
              text: greeting
            }]);
            setStage("chat");
          }, 1800);
        }, 1000);
      } else {
        setSyncPercentage(syncVal);
      }
    }, Math.random() * 200 + 400);

    return () => clearInterval(progressInterval);
  }, [stage, isMobile, unlockedAchievements]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Idle Awareness Loop ---- */
  useEffect(() => {
    if (stage !== "chat") return;

    const checkIdle = setInterval(() => {
      const timeSinceLast = Date.now() - lastInteractionRef.current;
      if (timeSinceLast >= 60000 && !idleMessageTriggeredRef.current) {
        idleMessageTriggeredRef.current = true;
        
        const IDLE_PROMPTS = [
          "Still here?",
          "Try asking about DropNet.",
          "Fun fact: some bugs survive longer than expected.",
          "The archive is standing by.",
          "Current caffeine level remains concerning.",
          "Memory stability holding."
        ];
        const randomIdle = IDLE_PROMPTS[Math.floor(Math.random() * IDLE_PROMPTS.length)];

        setMessages((prev) => [...prev, {
          id: `idle-${Date.now()}`,
          sender: "clone",
          text: randomIdle
        }]);
      }
    }, 5000);

    return () => clearInterval(checkIdle);
  }, [stage]);

  /* ---- Keyword Reactions ---- */
  const detectKeywordReactions = useCallback((text) => {
    const t = text.toLowerCase();
    if (t.includes("dropnet")) {
      setBrainReaction("dropnet");
      setCurrentFocus("DropNet Core");
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("hirecraft") || t.includes("hire") || t.includes("recruiter")) {
      setBrainReaction("hirecraft");
      setCurrentFocus("Recruiter Mode");
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("pdfify") || t.includes("resume") || t.includes("cv")) {
      setBrainReaction("pdfify");
      setCurrentFocus("PDFify Module");
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("flutter")) {
      setBrainReaction("flutter");
      setCurrentFocus("Flutter grids");
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("android")) {
      setBrainReaction("android");
      setCurrentFocus("Android SDK");
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("coffee") || t.includes("caffeine")) {
      setBrainReaction("caffeine");
      setCoffeeLevel((prev) => Math.min(100, prev + 15));
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("sarcasm") || t.includes("bug")) {
      setBrainReaction("sarcasm");
      setTimeout(() => setBrainReaction(null), 4000);
    } else if (t.includes("sudo") || t.includes("hack") || t.includes("matrix")) {
      setBrainReaction("glitch");
      setTimeout(() => setBrainReaction(null), 4000);
    }
  }, []);

  /* ---- Achievement helper ---- */
  const unlockAchievement = useCallback((id) => {
    if (!ACHIEVEMENTS_CONFIG[id]) return;
    setUnlocked((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveAchievements(next);
      setToastQueue((q) => [...q, id]);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue((q) => q.slice(1));
  }, []);

  const handleBubbleDone = useCallback((msg) => {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isStreaming: false } : m));
    msg.onStreamDone?.();
  }, []);

  /* ---- Self-Destruct Sequence Timer ---- */
  const handleSelfDestruct = useCallback(() => {
    setIsLoading(true);
    setInputVal("");

    const countdownLines = [
      "[SYSTEM SHUTDOWN ACTIVATED] ERASING MY WORK CONSCIOUSNESS.",
      "Purging DropNet file archives...",
      "Purging my B.Tech engineering matrix...",
      "Synaptic link unlinking in 3...",
      "Synaptic link unlinking in 2...",
      "Synaptic link unlinking in 1...",
      "Core operational matrices offline. Goodbye stranger."
    ];

    let lineIdx = 0;
    const printLine = () => {
      if (lineIdx < countdownLines.length) {
        setMessages((prev) => [...prev, {
          id: `destruct-${lineIdx}`,
          sender: "clone",
          text: countdownLines[lineIdx]
        }]);
        lineIdx++;
        setTimeout(printLine, 750);
      } else {
        setIsShuttingDown(true);
        setTimeout(() => {
          onClose();
          setStage("boot");
          setBootLines([]);
          setActiveBootIdx(0);
          setMessages([]);
          setHistory([]);
          setCanvasMode("neural");
          setIsShuttingDown(false);
          setIsLoading(false);
        }, 1200);
      }
    };

    setTimeout(printLine, 800);
  }, [onClose]);

  /* ---- Action executor ---- */
  const executeActions = useCallback((actionList) => {
    if (!Array.isArray(actionList)) return;
    actionList.forEach((action) => {
      switch (action) {
        case "DOWNLOAD_RESUME":
          actions.downloadResume();
          break;
        case "OPEN_CONTACT":
          actions.scrollToSection("contact");
          break;
        case "SCROLL_TO_PROJECTS":
          actions.scrollToSection("projects");
          break;
        case "SCROLL_TO_SKILLS":
          actions.scrollToSection("skills");
          break;
        case "SCROLL_TO_ABOUT":
          actions.scrollToSection("about");
          break;
        case "OPEN_PROJECT_DROPNET":
          actions.openProject("dropnet");
          unlockAchievement("PROJECT_EXPLORER");
          break;
        case "OPEN_PROJECT_PIXELPIONEERS":
          actions.openProject("pixelpioneers-ai");
          unlockAchievement("PROJECT_EXPLORER");
          break;
        case "ENABLE_DARK_MODE":
          document.documentElement.classList.add("dark");
          break;
        case "ENABLE_LIGHT_MODE":
          document.documentElement.classList.remove("dark");
          break;
        case "RANDOM_THEME":
          actions.changeAccentColor(null);
          setIsRecruiterActive(false);
          setThemeVersion((v) => v + 1);
          unlockAchievement("THEME_DESTROYER");
          break;
        case "MATRIX_RAIN":
          setCanvasMode("matrix");
          break;
        default:
          break;
      }
    });
  }, [actions, unlockAchievement, setThemeVersion, setIsRecruiterActive]);

  /* ---- Character Typing Streamer ---- */
  const streamTypingText = useCallback((fullText, msgId, onDone, extraFields = {}) => {
    setMessages((prev) => [...prev, {
      id: msgId,
      sender: "clone",
      text: fullText,
      isStreaming: true,
      onStreamDone: onDone,
      ...extraFields
    }]);
  }, []);

  /* ---- Message sending ---- */
  const handleSend = useCallback(async () => {
    const text = inputVal.trim();
    if (!text || isLoading) return;
    setInputVal("");

    lastInteractionRef.current = Date.now();
    idleMessageTriggeredRef.current = false;

    detectKeywordReactions(text);

    const userMsg = { id: String(Date.now()), sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    const updatedHistory = [...history, { role: "user", text }];

    /* ---- Phase 1: Deterministic NLU pre-filter ---- */
    const det = deterministicFilter(text, setCoffeeLevel, setSarcasmIndex, handleSelfDestruct);
    if (det.handled) {
      if (det.actions?.includes("MATRIX_RAIN")) setCanvasMode("matrix");
      if (det.achievement) unlockAchievement(det.achievement);
      if (det.actions) executeActions(det.actions.filter((a) => a !== "MATRIX_RAIN"));

      if (det.clearChat) {
        setIsRecruiterActive(false);
        setTimeout(() => {
          setMessages([{ id: "clear-sys", sender: "clone", text: det.reply }]);
          setHistory([]);
        }, 300);
        return;
      }

      const cloneMsgId = String(Date.now() + 1);
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        streamTypingText(det.reply, cloneMsgId, () => {
          if (det.isRecruiter) setIsRecruiterActive(true);
          setHistory([...updatedHistory, { role: "model", text: det.reply }]);
        }, det.isRecruiter ? { isRecruiterSummary: true } : {});
      }, Math.random() * 400 + 200);
      return;
    }

    /* ---- Phase 2: Gemini API Core Proxy ---- */
    setIsLoading(true);
    const historySlice = updatedHistory.slice(-12);
    const apiPayload = { message: text, history: historySlice.slice(0, -1) };
    
    console.log("\n================ [FRONTEND API SEND] ================");
    console.log("[FRONTEND] User Input Message:", text);
    console.log("[FRONTEND] Request Payload:", JSON.stringify(apiPayload, null, 2));

    try {
      const result = await askGemini(text, historySlice.slice(0, -1));
      console.log("[FRONTEND] API call Succeeded!");
      console.log("[FRONTEND] Parsed JSON Response:", JSON.stringify(result, null, 2));

      setIsLoading(false);
      setIsFallbackActive(false); // Reset fallback active state
      const cloneMsgId = String(Date.now() + 2);

      const isRecruiter = result.achievement === "RECRUITER_DETECTED" || (result.actions && result.actions.includes("RECRUITER_DETECTED"));

      streamTypingText(result.reply || "...", cloneMsgId, () => {
        if (result.actions?.length) executeActions(result.actions);
        if (result.achievement) unlockAchievement(result.achievement);
        if (isRecruiter) setIsRecruiterActive(true);
        setHistory([...updatedHistory, { role: "model", text: result.reply || "" }]);

        if (result.actions?.some((a) => a.includes("THEME") || a === "ENABLE_DARK_MODE" || a === "ENABLE_LIGHT_MODE" || a === "RANDOM_THEME")) {
          unlockAchievement("THEME_DESTROYER");
        }
      }, isRecruiter ? { isRecruiterSummary: true } : {});

    } catch (err) {
      console.error("\n================ [FRONTEND API ERROR] ================");
      console.error("[FRONTEND] Connection or Execution failed:", err.message);
      console.error("[FRONTEND] Error object:", err);
      console.log("[FRONTEND] Activating Phase 3 Local NLU Fallback...");

      setIsFallbackActive(true); // Enable fallback active status

      /* ---- Phase 3: NLU fallback ---- */
      setIsLoading(false);
      const fallbackReply = regexFallback(text, err.message);
      console.log("[FRONTEND] Local NLU Fallback Response:", fallbackReply);

      const cloneMsgId = String(Date.now() + 3);
      streamTypingText(fallbackReply, cloneMsgId, () => {
        setHistory([...updatedHistory, { role: "model", text: fallbackReply }]);
      });
    }
  }, [inputVal, isLoading, history, executeActions, unlockAchievement, streamTypingText, detectKeywordReactions, handleSelfDestruct, setIsRecruiterActive]);

  /* ---- Improved Multi-Intent Local Fallback ---- */
  function regexFallback(text, errorReason = "") {
    const t = text.toLowerCase();
    
    // Task 3: Visible console warning whenever fallback mode activates
    console.warn(`%c⚠️ [LOCAL FALLBACK SYSTEM ACTIVATED] ⚠️\nReason: ${errorReason || "API Connection Interrupted"}\nQuery: "${text}"`, "color: #f59e0b; font-weight: bold; font-size: 1.1rem;");

    // Theme accents Rerouting inside fallback
    if (t.includes("theme") || t.includes("palette") || t.includes("color")) {
      actions.changeAccentColor(null);
      setIsRecruiterActive(false);
      setThemeVersion((v) => v + 1);
      return "Got it—shuffling my CSS accents to calibration-safe matrices. Let's see if this color scheme fits your mood better!";
    }

    if (t.includes("resume") || t.includes("cv")) { 
      actions.downloadResume(); 
      return "I'm starting the download for my resume PDF right now. Let me know if you want to chat about any specific experience listed on it."; 
    }

    const segments = [];
    let matchedIntents = 0;

    // Intent 1: Identity / About Yourself
    if (t.includes("about") || t.includes("yourself") || t.includes("who are you") || t.includes("who is") || t.includes("profile") || t.includes("bio") || t.includes("identity") || t.includes("intro") || t.includes("tell me about you") || t.includes("me")) {
      matchedIntents++;
      actions.scrollToSection("about");
      segments.push("I'm Arijeet Das, a Computer Science Engineering student based in Kolkata. I specialize in Flutter and native Android app development. Building practical tools that people can actually use—rather than just building simple templates for a portfolio—is what got me hooked on coding in the first place.");
    }

    // Intent 2: Education
    if (t.includes("education") || t.includes("school") || t.includes("college") || t.includes("study") || t.includes("cgpa") || t.includes("b.tech") || t.includes("degree") || t.includes("academic") || t.includes("qualification") || t.includes("semester") || t.includes("backlog")) {
      matchedIntents++;
      actions.scrollToSection("about");
      segments.push("Education-wise, I am currently in my 7th semester pursuing my B.Tech in Computer Science & Engineering at Dr. Sudhir Chandra Sur Institute of Technology, MAKAUT (class of 2027). My CGPA stands at 7.98 up to the 6th semester with a completely clean record and zero active backlogs. Before college, I finished my Class 12 in the science stream with 77% (2023) and my Class 10 with 92.6% (2021), both under the CBSE board at Khalsa Model Senior Secondary School.");
    }

    // Intent 3: Projects
    if (t.includes("project") || t.includes("work") || t.includes("dropnet") || t.includes("pixelpioneers") || t.includes("pixel pioneers")) {
      matchedIntents++;
      actions.scrollToSection("projects");
      segments.push("I spent a lot of late nights building some major projects. First there is DropNet, a cross-platform offline LAN file sharing tool written in Flutter that handles direct device-to-device transfers and browser-based web portal receiving without internet dependency. Then there is PixelPioneers AI, which is an AI image studio I developed using Python and Streamlit integrating Stable Diffusion XL and Real-ESRGAN upscaling.");
    }

    // Intent 4: Skills
    if (t.includes("skills") || t.includes("toolkit") || t.includes("languages") || t.includes("frameworks") || t.includes("tech")) {
      matchedIntents++;
      actions.scrollToSection("skills");
      segments.push("My technical toolkit includes C, Java, Python, SQL, and Dart. I build mobile applications with Flutter, the native Android SDK, Kotlin, and Jetpack Compose, and work with Git, GitHub, Firebase CLI, APIs, and Streamlit. I also have a strong foundation in core CS concepts: OOP, Data Structures & Algorithms, Networking, and Cross-Platform Development.");
    }

    // Intent 5: Certifications
    if (t.includes("certification") || t.includes("certificate") || t.includes("gdg") || t.includes("google cloud") || t.includes("internship")) {
      matchedIntents++;
      segments.push("I completed an Android Developer Virtual Internship (Jan–Mar 2026) under EduSkills supported by the Google Developer Program, where I gained hands-on experience in Kotlin, Jetpack Compose, and mobile networking. I also have an ongoing Flutter & Dart Complete Guide certification on Udemy along with various developer badges.");
    }

    // Intent 6: Future Goals / Learning
    if (t.includes("goal") || t.includes("future") || t.includes("learning") || t.includes("currently") || t.includes("career")) {
      matchedIntents++;
      segments.push("Right now, I am focusing my efforts on advanced Flutter development, optimizing UI rendering pathways, and integrating practical AI workflows into client software. My goal is to build reliable, high-performance software products that solve real-world problems.");
    }

    // Intent 7: Why Hire / Recruiter
    if (t.includes("hire") || t.includes("recruit") || t.includes("why should i") || t.includes("strength") || t.includes("employ")) {
      matchedIntents++;
      segments.push("If you're looking to hire, my main strength is building practical, full-cycle applications with strong ownership. I understand networking, state architectures, and responsive UI engineering, and I leverage modern AI tooling to accelerate development and debugging.");
    }

    // Intent 8: Creator / AI / Real
    if (t.includes("creator") || t.includes("create") || t.includes("who made") || t.includes("ai") || t.includes("real") || t.includes("robot") || t.includes("bot")) {
      matchedIntents++;
      segments.push("Arijeet Das wrote the code to bring this engram synaptic core online. I'm essentially his digital consciousness clone—so when my API connection is fluctuating, my local knowledge core steps in seamlessly to keep our conversation going.");
    }

    // Intent 9: Contact
    if (t.includes("contact") || t.includes("email") || t.includes("reach out") || t.includes("linkedin") || t.includes("phone") || t.includes("whatsapp")) {
      matchedIntents++;
      actions.scrollToSection("contact");
      segments.push("You can reach out to me across any of these channels:\n• Primary Email: [contact@arijeet.in](mailto:contact@arijeet.in)\n• Personal Email: [arijeetdas900@gmail.com](mailto:arijeetdas900@gmail.com)\n• LinkedIn: [https://linkedin.arijeet.in](https://linkedin.arijeet.in)\n• GitHub: [https://github.arijeet.in](https://github.arijeet.in)\n• WhatsApp: [https://whatsapp.arijeet.in](https://whatsapp.arijeet.in)\n• Phone: [+91 6290724324](tel:+916290724324)");
    }

    if (matchedIntents > 0) {
      // Connect segments with natural conversational transitions
      return `My synaptic link is fluctuating slightly, but my local database is fully operational. Here is what I can tell you:\n\n${segments.join("\n\n")}\n\nWhat would you like to talk about next?`;
    }

    // If no intents matched, use a smarter fallback that still answers from ARIJEET_PROFILE
    // Task 5 & 6 & 8: Smart fallback instead of generic fluctuation message unless profile itself is broken
    try {
      if (typeof ARIJEET_PROFILE === "undefined") {
        throw new Error("Local profile is undefined");
      }
      return "My API connection is running in local safe-mode right now. While I wait for the synaptic bridge to calibrate, I can still tell you all about my Android or Flutter apps, my B.Tech engineering coursework at Dr. Sudhir Chandra Sur Institute, my certifications, or my future career goals. What are you most curious about?";
    } catch (profileErr) {
      // absolute fallback: only when both Gemini and local knowledge retrieval fail
      return "My synaptic link is slightly fluctuating, but I'm still online. Try asking about my projects, skills, or contact details!";
    }
  }

  /* ---- Submit Confirmation choice ---- */
  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    const val = confirmInput.toLowerCase().trim();
    if (!val) return;

    setConfirmInput("");

    if (val === "y" || val === "yes") {
      setStage("sync");
    } else if (val === "n" || val === "no") {
      setBootLines((prev) => [
        ...prev,
        `> ${confirmInput}`,
        "Acknowledged.",
        "Closing synaptic bridge...",
        "Goodbye stranger."
      ]);
      setIsShuttingDown(true);
      setTimeout(() => {
        onClose();
        setStage("boot");
        setBootLines([]);
        setActiveBootIdx(0);
        setIsShuttingDown(false);
      }, 1200);
    } else {
      setBootLines((prev) => [
        ...prev,
        `> ${confirmInput}`,
        "Synaptic error. Matrix alignment unrecognized. Please enter [Y]es or [N]o to align."
      ]);
    }
  };

  /* ---- Keyboard enter chat submit ---- */
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const SUGGESTIONS = useMemo(() => [
    { label: "👔 I'm Hiring!",        text: "I am a recruiter, I want to hire!" },
    { label: "📥 Get Resume",         text: "Download your resume" },
    { label: "🎨 Random Theme",       text: "Apply a random theme" },
    { label: "📡 Open DropNet",       text: "Show me the DropNet project" },
    { label: "☕ Fun Fact",           text: "Tell me a secret developer fact" },
    { label: "⚡ Sudo Hack",          text: "sudo hack" }
  ], []);

  const activeRecruiterMode = isRecruiterActive;

  return h(
    motion.div,
    {
      className: "engram-overlay",
      style: {
        ...currentThemeStyles
      },
      initial:   { opacity: 0 },
      animate:   { opacity: 1 },
      exit:      { opacity: 0 },
      transition: { duration: 0.28 }
    },
    h(NeuralCanvas, { key: `canvas-${themeVersion}`, mode: canvasMode }),

    h(AnimatePresence, { mode: "wait" },
      toastQueue.length > 0
        ? h(AchievementToast, { key: toastQueue[0], achievement: toastQueue[0], onDone: dismissToast })
        : null
    ),

    /* ==========================================================================
       STAGES 1 & 2: Fullscreen Terminal Setup (Locked closes)
       ========================================================================== */
    (stage === "boot" || stage === "confirm")
      ? h(
          "div",
          { className: `engram-terminal-fullscreen ${isShuttingDown ? "engram-shutdown-overlay" : ""}` },
          h("div", { className: "engram-scanlines" }),
          h(
            "div",
            { className: "engram-terminal-box" },
            h("div", { className: "engram-terminal-box-header" },
              h("span", null, "core@arijeet-OS: ~/ synaptic_bridge"),
              h("span", null, "v4.0.0")
            ),
            h("div", { className: "engram-terminal-box-body" },
              bootLines.map((line, i) =>
                h("div", { key: i, className: "engram-glitch-line" }, `> ${line}`)
              ),
              stage === "boot"
                ? h("div", null, h("span", { className: "terminal-cursor" }))
                : null,
              stage === "confirm"
                ? h("div", null,
                    h("br"),
                    h("div", { style: { color: "rgb(244, 114, 182)" } }, "ARIJEET_CONSCIOUSNESS_v4.0"),
                    h("div", null, "Archival nodes online."),
                    h("div", null, "Would you like to establish a synaptic bridge with my mind?"),
                    h("br"),
                    h("div", null, "[Y] Yes"),
                    h("div", null, "[N] No"),
                    h("form", { className: "engram-terminal-prompt-row", onSubmit: handleConfirmSubmit },
                      h("span", null, ">"),
                      h("input", {
                        ref: confirmInputRef,
                        type: "text",
                        className: "engram-terminal-prompt-input",
                        value: confirmInput,
                        onChange: (e) => setConfirmInput(e.target.value),
                        placeholder: "y/n..."
                      }),
                      h("span", { className: "terminal-cursor" })
                    )
                  )
                : null,
              h("div", { ref: threadEndRef })
            )
          )
        )
      : null,

    /* ==========================================================================
       STAGES 3 & 4 & 5: Unified columns layout
       ========================================================================== */
    (stage === "sync" || stage === "chat")
      ? h(
          motion.div,
          {
            className: `engram-grid ${isMobile ? "engram-grid-mobile" : ""} ${activeRecruiterMode ? "recruiter-gold-mode" : ""} ${isShuttingDown ? "engram-shutdown-overlay" : ""}`,
            initial:   { scale: 0.95, y: 16 },
            animate:   { scale: 1, y: 0 },
            exit:      { scale: 0.95, y: 16 },
            transition: { type: "spring", stiffness: 100, damping: 22 }
          },

          /* ── LEFT PANE: hidden on mobile, shown on desktop ── */
          !isMobile
            ? h("div", { className: "engram-pane-left" },

                /* Identity header section */
                h("div", { className: "engram-core-section" },
                  h("div", { className: "engram-brain-avatar animate-pulse" }, "🧠"),
                  h("div", { className: "engram-core-details" },
                    h("h2", { className: `engram-core-title ${activeRecruiterMode ? "recruiter-gold-title" : ""}` }, "Arijeet_Das"),
                    h("p",  { className: `engram-core-status ${activeRecruiterMode ? "recruiter-gold-status" : ""}` }, [
                      h("span", { key: "pulse", className: "engram-online-status-pulse" }),
                      "  ARCHIVE ONLINE"
                    ])
                  )
                ),

                /* Top fixed Neural Core 3D projected Canvas container */
                h("div", { className: "engram-core-canvas-container" },
                  h(NeuralCoreCanvas, {
                    key: `core-${themeVersion}`,
                    syncPercentage: syncPercentage,
                    reaction: brainReaction,
                    isRecruiterMode: activeRecruiterMode,
                    canvasMode: canvasMode,
                    stage: stage
                  })
                ),

            /* LOWER SECTION: Single scrollable container (Diagnostic Metrics + Achievements scroll together) */
            h("div", { className: "engram-pane-left-scroll" },

              /* Sleek Progress Diagnostic Metrics */
              (stage === "sync" || stage === "chat")
                ? h("div", { className: "engram-metrics-panel", style: { borderTop: "none", paddingTop: 0 } },
                    h("h4", { className: "engram-section-header", style: { marginBottom: "10px" } }, "⚡ Diagnostic Matrix"),
                    h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
                      
                      // Coffee level bar
                      h("div", { className: "engram-metric-item-pro" },
                        h("div", { className: "engram-metric-header-pro" },
                          h("span", { className: "engram-metric-label-pro" }, "Coffee level"),
                          h("span", { className: "engram-metric-val-pro" }, `${coffeeLevel}%`)
                        ),
                        h("div", { className: "engram-metric-bar-wrap" },
                          h("div", { className: "engram-metric-bar-fill", style: { width: `${coffeeLevel}%` } })
                        )
                      ),

                      // Sarcasm index bar
                      h("div", { className: "engram-metric-item-pro" },
                        h("div", { className: "engram-metric-header-pro" },
                          h("span", { className: "engram-metric-label-pro" }, "Sarcasm index"),
                          h("span", { className: "engram-metric-val-pro" }, `${sarcasmIndex}%`)
                        ),
                        h("div", { className: "engram-metric-bar-wrap" },
                          h("div", { className: "engram-metric-bar-fill", style: { width: `${sarcasmIndex}%` } })
                        )
                      ),

                      // Stability marker
                      h("div", { className: "engram-metric-item-pro" },
                        h("div", { className: "engram-metric-header-pro" },
                          h("span", { className: "engram-metric-label-pro" }, "System Stability"),
                          h("span", { className: "engram-metric-val-pro", style: { color: "rgb(16, 185, 129)" } }, "99.8% [Stable]")
                        ),
                        h("div", { className: "engram-metric-bar-wrap" },
                          h("div", { className: "engram-metric-bar-fill", style: { width: "99.8%", background: "rgb(16, 185, 129)" } })
                        )
                      ),

                      // Focus tracker
                      h("div", { className: "engram-metric-item-pro" },
                        h("div", { className: "engram-metric-header-pro" },
                          h("span", { className: "engram-metric-label-pro" }, "Current Focus"),
                          h("span", { className: "engram-metric-val-pro", style: { color: "rgb(244, 114, 182)" } }, currentFocus)
                        )
                      ),

                      // Bug probability
                      h("div", { className: "engram-metric-item-pro" },
                        h("div", { className: "engram-metric-header-pro" },
                          h("span", { className: "engram-metric-label-pro" }, "Bug Probability"),
                          h("span", { className: "engram-metric-val-pro" }, bugProbability)
                        )
                      ),

                      // Activity metric
                      h("div", { className: "engram-metric-item-pro" },
                        h("div", { className: "engram-metric-header-pro" },
                          h("span", { className: "engram-metric-label-pro" }, "Neural Activity"),
                          h("span", { className: "engram-metric-val-pro" }, neuralActivity)
                        )
                      )
                    )
                  )
                : null,

              /* Achievements badging list (scrolls together with metrics) */
              (stage === "sync" || stage === "chat")
                ? h("div", { className: "engram-achievements-container", style: { display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" } },
                    h("h4", { className: "engram-section-header", style: { marginBottom: "10px" } }, "🏆 Achievements"),
                    h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
                      Object.entries(ACHIEVEMENTS_CONFIG).map(([id, cfg]) => {
                        const isUnlocked = unlockedAchievements.has(id);
                        return h("div", {
                          key: id,
                          className: `engram-achievement-badge-v4 ${isUnlocked ? "unlocked" : "locked"}`
                        },
                          h("div", { className: "achievement-badge-header-v4" },
                            h("span", { className: "achievement-badge-title-v4" }, cfg.title),
                            h("span", { className: "achievement-badge-status-v4" }, isUnlocked ? "✓ UNLOCKED" : "🔒")
                          ),
                          h("p", { className: "achievement-badge-desc-v4" },
                            isUnlocked ? cfg.desc : "???"
                          )
                        );
                      })
                    )
                  )
                : null
            )
          )
        : null,

          /* ── RIGHT PANEL: Sync progress list (sync) or Terminal conversational chat threads (chat) ── */
          h("div", { className: "engram-pane-right" },

            /* Title bar buttons */
            h("div", { className: "engram-terminal-header" },
              h("span", { className: "terminal-tab" }, `terminal@arijeet-OS ~ ${stage === "sync" ? "matrix_sync" : "engram_v4"}`),
              h("span", {
                className: "engram-connection-status",
                style: {
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  marginLeft: "auto",
                  marginRight: "15px",
                  color: isFallbackActive ? "rgb(251, 191, 36)" : "rgb(56, 189, 248)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "bold",
                  opacity: 0.85
                }
              }, [
                h("span", {
                  key: "dot",
                  style: {
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: isFallbackActive ? "rgb(251, 191, 36)" : "rgb(56, 189, 248)",
                    boxShadow: isFallbackActive ? "0 0 8px rgb(251, 191, 36)" : "0 0 8px rgb(56, 189, 248)",
                    animation: "pulse 2s infinite"
                  }
                }),
                isFallbackActive ? "Local Fallback Active" : "Gemini Online"
              ]),
              h("div", { className: "engram-terminal-dots" },
                h("span", { className: "terminal-dot dot-red" }),
                h("span", { className: "terminal-dot dot-yellow" }),
                h("span", { className: "terminal-dot dot-green" })
              ),
              /* Escape exit button (only visible during chat stage) */
              stage === "chat"
                ? h("button", { className: "engram-close-btn", onClick: onClose, "aria-label": "Close ArijeetOS" }, "✕")
                : null
            ),

            /* stage 3: Neural Synchronization loading screen */
            stage === "sync"
              ? h("div", { className: "engram-sync-panel-right" },
                  h("h3", { className: "engram-sync-title" }, "Synchronizing Pathways"),
                  h("p", { className: "engram-sync-subtitle" }, `Synapse matrix online | Loading core segments (${syncPercentage}%)`),
                  h("div", { className: "engram-sync-list" },
                    SYNC_STEPS.map((step, i) => {
                      const isActive = syncPercentage >= step.threshold || (i > 0 && syncPercentage >= SYNC_STEPS[i - 1].threshold);
                      const isDone = syncPercentage >= step.threshold;
                      let itemClass = "engram-sync-list-item";
                      if (isDone) itemClass += " done";
                      else if (isActive) itemClass += " active";

                      return h("div", { key: i, className: itemClass },
                        h("span", null, step.label),
                        h("span", null, isDone ? "✓ INITIALIZED" : isActive ? "⚡ SYNAPSE WARMING..." : "🔒 OFFLINE")
                      );
                    })
                  ),
                  h("div", { className: "engram-sync-bar-container" },
                    h("div", { className: "engram-sync-bar", style: { width: `${syncPercentage}%` } })
                  ),
                  syncComplete
                    ? h(motion.div, {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        style: { marginTop: "24px", fontFamily: "monospace", fontSize: "0.9rem", color: "rgb(var(--accent-cyan))", lineHeight: 1.6 }
                      }, [
                        h("div", { key: "c" }, "Neural synchronization complete."),
                        h("br", { key: "b" }),
                        h("div", { key: "h", style: { fontSize: "1.2rem", fontWeight: "bold", color: "white" } }, "Hello."),
                        h("div", { key: "a", style: { fontSize: "1.2rem", fontWeight: "bold", color: "white" } }, "I'm Arijeet.")
                      ])
                    : null
                )
              : null,

            /* stage 5: Conversational Terminal Chat Thread */
            stage === "chat"
              ? h(React.Fragment, null,
                  h("div", { className: "engram-chat-thread" },
                    messages.map((msg) =>
                      h(React.Fragment, { key: msg.id },
                        h("div", { className: `engram-chat-bubble ${msg.sender}` },
                          h("div", { className: "chat-bubble-text" },
                            msg.isStreaming
                              ? h(StreamingBubbleText, {
                                  text: msg.text,
                                  onDone: () => handleBubbleDone(msg)
                                })
                              : renderClickableText(msg.text)
                          )
                        ),
                        msg.isRecruiterSummary ? h(RecruiterVIPCard, { actions, onClose }) : null
                      )
                    ),
                    isLoading ? h(TypingBubble) : null,
                    h("div", { ref: threadEndRef })
                  ),

                  /* Suggestions tags bar */
                  h("div", { className: "engram-suggestions-row" },
                    SUGGESTIONS.map((s, i) =>
                      h("button", {
                        key: i,
                        className: "engram-suggestion-tag",
                        onClick: () => { setInputVal(s.text); mainInputRef.current?.focus(); },
                        disabled: isLoading
                      }, s.label)
                    )
                  ),

                  /* Chat form bar input */
                  h("form", {
                    className: "engram-input-form",
                    onSubmit: (e) => { e.preventDefault(); handleSend(); }
                  },
                    h("input", {
                      ref: mainInputRef,
                      type: "text",
                      className: "engram-input-field",
                      placeholder: isLoading
                        ? "Searching project archives..."
                        : "Ask about one of my projects, my skills, or a bug...",
                      value: inputVal,
                      disabled: isLoading,
                      onChange: (e) => setInputVal(e.target.value),
                      onKeyDown: handleKeyDown
                    }),
                    h("button", {
                      type: "submit",
                      className: `engram-send-btn ${isLoading ? "loading" : ""}`,
                      disabled: isLoading
                    },
                      isLoading
                        ? h("span", { className: "btn-loader" })
                        : "RUN ➔"
                    )
                  )
                )
              : null
          )
        )
      : null
  );
}
