import React, { useEffect, useMemo, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

const h = React.createElement;

/* ==========================================================================
   CONSTANT CONFIGURATIONS & DATA
   ========================================================================== */

const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" }
];

const SKILL_CATEGORIES = [
  {
    id: "languages",
    title: "Languages",
    accent: "cyan",
    items: ["C", "Java", "Python", "SQL", "Dart"]
  },
  {
    id: "frameworks",
    title: "App Development",
    accent: "indigo",
    items: ["Flutter", "Android SDK", "Kotlin", "Jetpack Compose"]
  },
  {
    id: "core-cs",
    title: "Core Concepts",
    accent: "emerald",
    items: ["OOP", "Data Structures & Algorithms", "Networking", "Cross-Platform Development"]
  },
  {
    id: "tools",
    title: "Development Tools & Technologies",
    accent: "pink",
    items: ["Git", "GitHub", "Firebase CLI", "APIs", "Streamlit"]
  }
];

const PROJECTS_DATA = [
  {
    id: "dropnet",
    title: "DropNet",
    category: "mobile",
    tag: "Flutter / Offline P2P",
    shortDesc: "A cross-platform LAN file-transfer application developed in Flutter for Android, Windows, Linux, macOS and iOS, enabling direct device-to-device file sharing without internet dependency, local web portal app-free transfers, and pair-only secure mode.",
    tech: ["Flutter", "Dart", "P2P Sockets", "LAN / Web Portal", "Material Design"],
    github: "https://git.dropnet.arijeet.in",
    live: "https://dropnet.arijeet.in"
  },
  {
    id: "pixelpioneers-ai",
    title: "PixelPioneers AI",
    category: "web",
    tag: "Python / AI Studio",
    shortDesc: "An AI image generation and enhancement platform built using Python and Streamlit, integrating Stability AI (SDXL) and Replicate AI (Real-ESRGAN) for prompt-based creation and 2x, 4x, 8x image upscaling.",
    tech: ["Python", "Streamlit", "Stable Diffusion XL", "Real-ESRGAN", "Replicate AI"],
    github: "https://git.pixpio.arijeet.in",
    live: "https://pixpio.arijeet.in"
  }
];

/* ==========================================================================
   CUSTOM REUSABLE HOOKS
   ========================================================================== */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 860);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// Detect coarse pointer (touch) devices — used to skip JS-driven effects
const isTouch = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

// Removed useMousePosition to prevent React state recalculation lag on mousemove


/* ==========================================================================
   BACKGROUND CANVAS PARTICLES
   ========================================================================== */

function CanvasParticles() {
  const canvasRef = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = 38;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 1.8 + 0.8;
        this.color = `rgba(56, 189, 248, ${Math.random() * 0.12 + 0.04})`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 100) * 0.03})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => { p.update(); p.draw(); });
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  if (isMobile) return null;

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
   DYNAMIC AMBIENT ORBS BACKGROUND
   ========================================================================== */

function AmbientBackground({ activeSection }) {
  const isMobile = useIsMobile();
  const containerRef = useRef(null);

  useEffect(() => {
    if (isMobile || isTouch()) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    let rafPending = false;
    let targetX = 0;
    let targetY = 0;

    const updateCSSVars = () => {
      container.style.setProperty("--drift-x", `${targetX}px`);
      container.style.setProperty("--drift-y", `${targetY}px`);
      rafPending = false;
    };

    const handleMouseMove = (e) => {
      targetX = e.clientX - window.innerWidth / 2;
      targetY = e.clientY - window.innerHeight / 2;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateCSSVars);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  const [orb1Color, orb2Color, orb3Color] = useMemo(() => {
    let o1 = "rgba(var(--accent-cyan), 0.7)";
    let o2 = "rgba(var(--accent-indigo), 0.7)";
    let o3 = "rgba(var(--accent-pink), 0.4)";

    if (activeSection === "about") {
      o1 = "rgba(var(--accent-indigo), 0.7)";
      o2 = "rgba(var(--accent-pink), 0.6)";
      o3 = "rgba(var(--accent-cyan), 0.4)";
    } else if (activeSection === "skills") {
      o1 = "rgba(var(--accent-pink), 0.7)";
      o2 = "rgba(var(--accent-cyan), 0.6)";
      o3 = "rgba(var(--accent-emerald), 0.4)";
    } else if (activeSection === "projects") {
      o1 = "rgba(var(--accent-cyan), 0.7)";
      o2 = "rgba(var(--accent-emerald), 0.6)";
      o3 = "rgba(var(--accent-indigo), 0.4)";
    } else if (activeSection === "contact") {
      o1 = "rgba(var(--accent-emerald), 0.7)";
      o2 = "rgba(var(--accent-indigo), 0.6)";
      o3 = "rgba(var(--accent-pink), 0.4)";
    }

    return [o1, o2, o3];
  }, [activeSection]);

  return h(
    "div",
    { ref: containerRef, className: "ambient-background", "aria-hidden": "true" },
    h("div", { className: "glow-orb orb-1", style: { background: `radial-gradient(circle, ${orb1Color}, transparent 70%)` } }),
    h("div", { className: "glow-orb orb-2", style: { background: `radial-gradient(circle, ${orb2Color}, transparent 70%)` } }),
    h("div", { className: "glow-orb orb-3", style: { background: `radial-gradient(circle, ${orb3Color}, transparent 70%)` } }),
    h("div", { className: "bg-grain" })
  );
}

/* ==========================================================================
   AMBIENT INTERACTIVE MOUSE SPOTLIGHT FOLLOWER
   ========================================================================== */

function MouseFollower() {
  const isMobile = useIsMobile();
  const touch = isTouch();
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  const springConfig = { damping: 36, stiffness: 130, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (touch || isMobile) return undefined;
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, touch]);

  if (isMobile || touch) return null;

  return h(
    React.Fragment,
    null,
    h(motion.div, { className: "mouse-follower-bg", style: { x: smoothX, y: smoothY, translateX: "-50%", translateY: "-50%" } }),
    h(motion.div, { className: "mouse-follower-fg", style: { x: smoothX, y: smoothY, translateX: "-50%", translateY: "-50%" } })
  );
}

/* ==========================================================================
   FLOATING MAGNETIC NAVBAR
   ========================================================================== */

function Navbar({ activeSection, onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0, opacity: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const navContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector(`.nav-item[data-id="${activeSection}"]`);
    if (activeBtn) {
      setPillStyle({ width: activeBtn.offsetWidth, left: activeBtn.offsetLeft, opacity: 1 });
    } else {
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeSection]);

  const handleNavClick = (id) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return h(
    "header",
    { ref: navContainerRef, className: `navbar-container ${scrolled ? "scrolled" : ""}` },
    h(
      "button",
      { className: "logo", onClick: () => handleNavClick("home") },
      "Arijeet",
      h("span", { className: "logo-dot" })
    ),
    h(
      "button",
      {
        className: "menu-toggle",
        onClick: () => setMenuOpen(!menuOpen),
        "aria-label": "Toggle Menu"
      },
      h("span", { style: menuOpen ? { transform: "rotate(45deg) translate(5px, 5px)" } : {} }),
      h("span", { style: menuOpen ? { opacity: 0 } : {} }),
      h("span", { style: menuOpen ? { transform: "rotate(-45deg) translate(5px, -5px)" } : {} })
    ),
    h(
      "nav",
      { className: `nav-links ${menuOpen ? "open" : ""}` },
      h("div", { className: "nav-pill-active", style: pillStyle }),
      NAV_ITEMS.map((item) =>
        h(
          "button",
          {
            key: item.id,
            className: `nav-item ${activeSection === item.id ? "active" : ""}`,
            "data-id": item.id,
            onClick: () => handleNavClick(item.id)
          },
          item.label
        )
      )
    )
  );
}

/* ==========================================================================
   SECTION-SPECIFIC UNIQUE ANIMATION VARIANTS (ON-SCREEN / OFF-SCREEN)
   ========================================================================== */

// On mobile: simple fade-up only (avoids layout paint from transforms)
// On desktop: rich spring/rotate/skew animations

const MOBILE_EASE = { duration: 0.42, ease: [0.25, 0.1, 0.25, 1] };
const MOBILE_EXIT = { duration: 0.28, ease: "easeIn" };

// 1. Hero: Scale zoom + dramatic slide-up
const getHeroVariants = (isMobile) => ({
  offscreen: { opacity: 0, y: isMobile ? 18 : 0, scale: isMobile ? 1 : 0.95 },
  onscreen: {
    opacity: 1, y: 0, scale: 1,
    transition: isMobile ? MOBILE_EASE : { type: "spring", stiffness: 80, damping: 20 }
  },
  exit: { opacity: 0, y: isMobile ? -12 : -30, scale: isMobile ? 1 : 0.96, transition: isMobile ? MOBILE_EXIT : { ease: "easeInOut", duration: 0.4 } }
});

// 2. About: Slide from left (desktop) / fade-up (mobile)
const getAboutVariants = (isMobile) => ({
  offscreen: { opacity: 0, x: isMobile ? 0 : -48, y: isMobile ? 18 : 0 },
  onscreen: {
    opacity: 1, x: 0, y: 0,
    transition: isMobile ? MOBILE_EASE : { type: "spring", stiffness: 70, damping: 18 }
  },
  exit: { opacity: 0, x: isMobile ? 0 : 48, y: isMobile ? -12 : 0, transition: isMobile ? MOBILE_EXIT : { ease: "easeInOut", duration: 0.4 } }
});

// 3. Skills: 3D fold (desktop) / fade-up (mobile)
const getSkillsVariants = (isMobile) => ({
  offscreen: { opacity: 0, rotateX: isMobile ? 0 : -22, y: isMobile ? 18 : 45 },
  onscreen: {
    opacity: 1, rotateX: 0, y: 0,
    transition: isMobile ? MOBILE_EASE : { type: "spring", stiffness: 60, damping: 15 }
  },
  exit: { opacity: 0, rotateX: isMobile ? 0 : 22, y: isMobile ? -12 : -45, transition: isMobile ? MOBILE_EXIT : { ease: "easeInOut", duration: 0.4 } }
});

// 4. Projects: Bounce zoom (desktop) / fade-up (mobile)
const getProjectsVariants = (isMobile) => ({
  offscreen: { opacity: 0, scale: isMobile ? 1 : 0.9, rotate: isMobile ? 0 : -2, y: isMobile ? 18 : 0 },
  onscreen: {
    opacity: 1, scale: 1, rotate: 0, y: 0,
    transition: isMobile ? MOBILE_EASE : { type: "spring", stiffness: 90, damping: 20 }
  },
  exit: { opacity: 0, scale: isMobile ? 1 : 0.9, rotate: isMobile ? 0 : 2, y: isMobile ? -12 : 0, transition: isMobile ? MOBILE_EXIT : { ease: "easeInOut", duration: 0.4 } }
});

// 5. Contact: Skew slide (desktop) / fade-up (mobile)
const getContactVariants = (isMobile) => ({
  offscreen: { opacity: 0, skewY: isMobile ? 0 : 2.5, y: isMobile ? 18 : 55 },
  onscreen: {
    opacity: 1, skewY: 0, y: 0,
    transition: isMobile ? MOBILE_EASE : { type: "spring", stiffness: 65, damping: 16 }
  },
  exit: { opacity: 0, skewY: isMobile ? 0 : -2.5, y: isMobile ? -12 : -55, transition: isMobile ? MOBILE_EXIT : { ease: "easeInOut", duration: 0.4 } }
});

/* ==========================================================================
   HERO SECTION
   ========================================================================== */

const CODE_LINES = [
  [
    { type: "keyword", text: "const " },
    { type: "property", text: "developer " },
    { type: "plain", text: "= {" }
  ],
  [
    { type: "plain", text: "  name: " },
    { type: "string", text: "'Arijeet Das'" },
    { type: "plain", text: "," }
  ],
  [
    { type: "plain", text: "  focus: " },
    { type: "string", text: "'Mobile & Cross-Platform'" },
    { type: "plain", text: "," }
  ],
  [
    { type: "plain", text: "  craft: [" },
    { type: "string", text: "'Flutter'" },
    { type: "plain", text: ", " },
    { type: "string", text: "'Android'" },
    { type: "plain", text: "]," }
  ],
  [
    { type: "plain", text: "  mission: " },
    { type: "string", text: "'Build optimised apps'" },
    { type: "plain", text: "," }
  ],
  [
    { type: "plain", text: "  stability: " },
    { type: "value", text: "99.9" },
    { type: "plain", text: "%" }
  ],
  [
    { type: "plain", text: "};" }
  ]
];

function HeroSection({ onNavigate }) {
  const isMobile = useIsMobile();
  const [downloadState, setDownloadState] = useState("idle");
  const [progressWidth, setProgressWidth] = useState(0);

  const totalChars = useMemo(() => {
    return CODE_LINES.reduce((sum, line) => {
      return sum + line.reduce((lSum, token) => lSum + token.text.length, 0);
    }, 0);
  }, []);

  const flattenedChars = useMemo(() => {
    const chars = [];
    CODE_LINES.forEach((line) => {
      line.forEach((token) => {
        for (let i = 0; i < token.text.length; i++) {
          chars.push({
            char: token.text[i],
            type: token.type,
            isTokenEnd: i === token.text.length - 1
          });
        }
      });
    });
    return chars;
  }, []);

  const lineStartIndices = useMemo(() => {
    const indices = new Set();
    let currentIdx = 0;
    CODE_LINES.forEach((line) => {
      indices.add(currentIdx);
      const lineLen = line.reduce((sum, token) => sum + token.text.length, 0);
      currentIdx += lineLen;
    });
    return indices;
  }, []);

  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    let timeoutId;

    const typeNextChar = (currentCount) => {
      if (currentCount >= totalChars) {
        setVisibleChars(totalChars);
        return;
      }

      setVisibleChars(currentCount);

      const nextCharObj = flattenedChars[currentCount];
      const nextChar = nextCharObj ? nextCharObj.char : "";

      let delay = Math.random() * 30 + 35; // Keystroke jitter: 35ms to 65ms

      if (lineStartIndices.has(currentCount)) {
        // Pauses at the start of a new line (Enter key / line planning)
        delay = Math.random() * 200 + 400; // 400ms to 600ms
      } else if (nextChar === " ") {
        // Spaces are typed slightly faster
        delay = Math.random() * 15 + 15; // 15ms to 30ms
      } else if (nextChar === "," || nextChar === ";" || nextChar === "{" || nextChar === "}" || nextChar === "[" || nextChar === "]") {
        // Pauses after structural punctuation symbols
        delay = Math.random() * 100 + 250; // 250ms to 350ms
      } else if (nextCharObj && nextCharObj.type === "keyword" && nextCharObj.isTokenEnd) {
        // Hesitation after finishing typing keywords like "const"
        delay = 200;
      }

      timeoutId = setTimeout(() => {
        typeNextChar(currentCount + 1);
      }, delay);
    };

    const startTimeout = setTimeout(() => {
      typeNextChar(0);
    }, 800);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, [totalChars, flattenedChars, lineStartIndices]);

  const triggerDownload = () => {
    if (downloadState !== "idle") return;
    setDownloadState("preparing");
    setProgressWidth(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          const link = document.createElement("a");
          link.href = "assets/resume/Arijeet_Das_Resume.pdf";
          link.download = "Arijeet_Das_Resume.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloadState("done");
          setTimeout(() => setDownloadState("idle"), 3000);
        }, 300);
      }
      setProgressWidth(progress);
    }, 120);
  };

  const currentVariants = useMemo(() => getHeroVariants(isMobile), [isMobile]);

  return h(
    motion.section,
    {
      id: "home",
      className: "hero-section",
      initial: "offscreen",
      whileInView: "onscreen",
      exit: "exit",
      viewport: { once: false, amount: isMobile ? 0.08 : 0.2 },
      variants: currentVariants
    },
    h(CanvasParticles),
    /* Transparent centered wrapper */
    h(
      "div",
      { className: "hero-card-wrapper" },
      h(
        "div",
        { className: "hero-grid" },
        /* LEFT: Text content */
        h(
          "div",
          { className: "hero-text-block" },
          h("div", { className: "kicker-badge" }, "⚡ CSE Undergraduate & Mobile App Developer"),
          h(
            "h1",
            { className: "hero-title section-title" },
            "Building seamless ",
            h("span", { className: "gradient-text" }, "software experiences.")
          ),
          h(
            "p",
            { className: "section-lead" },
            "I'm a CSE undergraduate obsessed with building high-performance mobile applications and AI-powered developer tools. I currently specialize in Flutter and native Android, and I spend most nights either debugging widget trees or exploring new API integrations."
          ),
          h(
            "div",
            { className: "actions-row" },
            h(
              "button",
              {
                className: `premium-btn primary ${downloadState !== "idle" ? "loading" : ""}`,
                onClick: triggerDownload
              },
              downloadState === "idle" && "Download Resume",
              downloadState === "preparing" && [
                h("span", { key: "spinner", className: "btn-loader" }),
                "Preparing..."
              ],
              downloadState === "done" && "✓ Downloaded!",
              h("div", { className: "download-progress-bar", style: { width: `${progressWidth}%` } })
            ),
            h(
              "button",
              { className: "premium-btn secondary", onClick: () => onNavigate("projects") },
              "Explore Projects"
            )
          )
        ),
        /* RIGHT: Terminal Visual Console */
        h(
          "div",
          { className: "hero-visual" },
          h(
            "div",
            { className: "glass-terminal" },
            h(
              "div",
              { className: "terminal-header" },
              h("span", { className: "terminal-dot dot-red" }),
              h("span", { className: "terminal-dot dot-yellow" }),
              h("span", { className: "terminal-dot dot-green" }),
              h("span", { className: "terminal-tab" }, "arijeet_das.dart")
            ),
            h(
              "div",
              { className: "terminal-body" },
              /* Circular portrait inside the code card */
              h("div", { className: "terminal-profile-wrap" },
                h("img", { className: "terminal-portrait", src: "assets/profile.png", alt: "Arijeet Das" })
              ),
              (() => {
                let charCounter = 0;
                return CODE_LINES.map((line, lineIdx) => {
                  const lineNum = String(lineIdx + 1).padStart(2, "0");
                  const lineElements = [];
                  let isLineBeingTyped = false;
                  let hasContent = false;

                  for (const token of line) {
                    const tokenLen = token.text.length;
                    if (charCounter >= visibleChars) {
                      break;
                    }

                    hasContent = true;
                    const visibleTokenChars = Math.min(tokenLen, visibleChars - charCounter);
                    const textToShow = token.text.slice(0, visibleTokenChars);

                    const className = token.type === "plain" ? "" : `code-${token.type}`;
                    lineElements.push(h("span", { key: token.text, className }, textToShow));

                    if (charCounter + visibleTokenChars === visibleChars && visibleChars < totalChars) {
                      isLineBeingTyped = true;
                    }

                    charCounter += tokenLen;
                  }

                  if (isLineBeingTyped || (visibleChars === totalChars && lineIdx === CODE_LINES.length - 1)) {
                    lineElements.push(h("span", { key: "cursor", className: "terminal-cursor" }));
                  }

                  return h("div", { key: lineIdx, className: "terminal-code-line" }, [
                    h("span", { className: "terminal-code-num" }, lineNum),
                    h("span", { className: "terminal-code-content" }, hasContent ? lineElements : "")
                  ]);
                });
              })()
            )
          )
        )
      )
    )
  );
}

/* ==========================================================================
   ABOUT SECTION
   ========================================================================== */

function AboutSection() {
  const isMobile = useIsMobile();
  const currentVariants = useMemo(() => getAboutVariants(isMobile), [isMobile]);

  return h(
    motion.section,
    {
      id: "about",
      className: "section-wrapper",
      initial: "offscreen",
      whileInView: "onscreen",
      exit: "exit",
      viewport: { once: false, amount: isMobile ? 0.08 : 0.2 },
      variants: currentVariants
    },
    h(
      "div",
      { className: "glass-card" },
      h("div", { className: "kicker-badge" }, "🧩 Focus"),
      h("h2", { className: "section-title" }, "CS Fundamentals & Practical Apps."),
      h(
        "p",
        { className: "section-lead" },
        "I am a Computer Science Engineering student at Dr. Sudhir Chandra Sur Institute of Technology (CGPA 7.98) focused on bridging core CS concepts with hands-on app development and AI-augmented software engineering practices."
      ),
      h(
        "div",
        { className: "bento-grid" },
        /* Formal CS Education - spans 2 cols */
        h(
          "div",
          { className: "bento-cell col-2" },
          h("div", { className: "bento-cell-header" },
            h("div", { className: "bento-cell-icon" }, "🎓"),
            h("h3", { className: "bento-cell-title" }, "Computer Science & Engineering (B.Tech)")
          ),
          h("p", { className: "bento-cell-body" },
            "Dr. Sudhir Chandra Sur Institute Of Technology And Sports Complex, MAKAUT, Kolkata (2023 - 2027). Current CGPA: 7.98 (up to 6th semester). Deepening understanding of key academic principles: Data Structures & Algorithms, OOP, Networking, and DBMS."
          )
        ),
        /* Highlights Metrics - spans 2 rows */
        h(
          "div",
          { className: "bento-cell row-2" },
          h("div", { className: "bento-cell-header" },
            h("div", { className: "bento-cell-icon" }, "📈"),
            h("h3", { className: "bento-cell-title" }, "By The Numbers")
          ),
          h("div", { className: "bento-metrics" },
            h("div", { className: "bento-metric-item" }, [
              h("div", { className: "bento-metric-val", key: "v" }, "7.98"),
              h("div", { className: "bento-metric-label", key: "l" }, "B.Tech CGPA")
            ]),
            h("div", { className: "bento-metric-item" }, [
              h("div", { className: "bento-metric-val", key: "v" }, "3 Mos"),
              h("div", { className: "bento-metric-label", key: "l" }, "Google Android Intern")
            ]),
            h("div", { className: "bento-metric-item" }, [
              h("div", { className: "bento-metric-val", key: "v" }, "100%"),
              h("div", { className: "bento-metric-label", key: "l" }, "Offline P2P Speed")
            ]),
            h("div", { className: "bento-metric-item" }, [
              h("div", { className: "bento-metric-val", key: "v" }, "60fps"),
              h("div", { className: "bento-metric-label", key: "l" }, "Fluid UI Target")
            ])
          )
        ),
        /* Android Developer Internship - spans 2 cols */
        h(
          "div",
          { className: "bento-cell col-2" },
          h("div", { className: "bento-cell-header" },
            h("div", { className: "bento-cell-icon" }, "💼"),
            h("h3", { className: "bento-cell-title" }, "Android Developer Internship")
          ),
          h("p", { className: "bento-cell-body" },
            "Completed a Google developer program supported Android development internship through EduSkills (Jan 2026 – Mar 2026), gaining hands-on exposure to Kotlin, Jetpack Compose, Android fundamentals, networking and mobile UI development."
          )
        ),
        /* Architecture Core Pillars - spans 2 cols */
        h(
          "div",
          { className: "bento-cell col-2" },
          h("div", { className: "bento-cell-header" },
            h("div", { className: "bento-cell-icon" }, "🏛️"),
            h("h3", { className: "bento-cell-title" }, "Engineering Pillars")
          ),
          h("div", { className: "bento-cell-body" },
            h("div", { className: "bento-pillars-list" }, [
              h("div", { className: "bento-pillar-item", key: "p1" }, [
                h("span", { className: "bento-pillar-bullet" }),
                h("div", null, [
                  h("strong", null, "Fluid UI/UX & Material Design"),
                  h("span", null, "Crafting intuitive layouts with fluid animations and responsive mobile behaviors (such as DropNet's local pair-only security dashboard).")
                ])
              ]),
              h("div", { className: "bento-pillar-item", key: "p2" }, [
                h("span", { className: "bento-pillar-bullet" }),
                h("div", null, [
                  h("strong", null, "Clean State Management"),
                  h("span", null, "Implementing reactive data flows and state architectures using modern mobile paradigms like BLoC, Provider, and StateFlow.")
                ])
              ]),
              h("div", { className: "bento-pillar-item", key: "p3" }, [
                h("span", { className: "bento-pillar-bullet" }),
                h("div", null, [
                  h("strong", null, "Performance & Local Networking"),
                  h("span", null, "Optimizing mobile rendering pathways for high fps targets, managing local databases, and structuring secure, temporary socket network layers.")
                ])
              ])
            ])
          )
        ),
        /* AI & Productivity - spans 1 col */
        h(
          "div",
          { className: "bento-cell" },
          h("div", { className: "bento-cell-header" },
            h("div", { className: "bento-cell-icon" }, "🤖"),
            h("h3", { className: "bento-cell-title" }, "AI-Augmented Engineering")
          ),
          h("p", { className: "bento-cell-body" },
            "I actively leverage state-of-the-art AI tools (GitHub Copilot, Claude, GPT) across my academic research, coding workflows, and software projects to expedite debugging, write robust unit tests, and design smart features."
          )
        )
      )
    )
  );
}

/* ==========================================================================
   SKILLS SECTION
   ========================================================================== */

function SkillPod({ category }) {
  const isMobile = useIsMobile();
  const touch = isTouch();
  const podRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    // Disable 3D tilt on any touch/mobile device
    if (isMobile || touch) return;
    const card = podRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(mouseY / (rect.height / 2)) * 7,
      y: (mouseX / (rect.width / 2)) * 7
    });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const tiltStyle = (isMobile || touch)
    ? {}
    : { transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(4px)` };

  return h(
    "div",
    {
      ref: podRef,
      className: "skills-pod",
      style: tiltStyle,
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave
    },
    h("div", { className: "skills-pod-header" },
      h("div", { className: `skills-pod-title skills-pod-accent-${category.accent}` }, category.title),
      h("span", { className: "skills-pod-badge" }, `${category.items.length} Skills`)
    ),
    h("div", { className: "skills-pod-content" },
      category.items.map((skill) =>
        h("span", { key: skill, className: `skill-badge highlight-${category.accent}` }, skill)
      )
    )
  );
}

function SkillsSection() {
  const isMobile = useIsMobile();
  const currentVariants = useMemo(() => getSkillsVariants(isMobile), [isMobile]);

  return h(
    motion.section,
    {
      id: "skills",
      className: "section-wrapper",
      initial: "offscreen",
      whileInView: "onscreen",
      exit: "exit",
      viewport: { once: false, amount: isMobile ? 0.08 : 0.2 },
      variants: currentVariants
    },
    h("div", { className: "glass-card" },
      h("div", { className: "kicker-badge" }, "🔧 Toolkit"),
      h("h2", { className: "section-title" }, "Fluid stack. Specialized toolbelt."),
      h("p", { className: "section-lead" },
        "My technical kit covers mobile architectures, native interface ecosystems, relational/non-relational database structures, and responsive layouts."
      ),
      h("div", { className: "skills-matrix-grid" },
        SKILL_CATEGORIES.map((cat) => h(SkillPod, { key: cat.id, category: cat }))
      )
    )
  );
}

/* ==========================================================================
   PROJECTS SECTION
   ========================================================================== */

function ProjectCard({ project, onSelect }) {
  return h(
    "div",
    { className: "project-thumbnail", onClick: () => onSelect(project) },
    h("div", { className: "project-thumb-header" },
      h("div", { className: "project-thumb-tag" }, project.tag),
      h("h3", { className: "project-thumb-title" }, project.title),
      h("p", { className: "project-thumb-desc" }, project.shortDesc)
    ),
    h("div", { className: "project-thumb-footer" },
      h("div", { className: "project-thumb-tech" },
        project.tech.map((t) => h("span", { key: t, className: "project-tech-pill" }, t))
      ),
      h("button", { className: "project-details-btn" },
        "View more",
        h("span", null, " →")
      )
    )
  );
}

function ProjectPopup({ project, onClose }) {
  const [redirecting, setRedirecting] = useState(null); // null | 'github' | 'live'

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-active");
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-active");
    };
  }, []);

  if (!project) return null;

  const handleRedirect = (url, type) => {
    if (redirecting) return;
    setRedirecting(type);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setRedirecting(null);
    }, 1200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return h(
    "div",
    { className: "modal-backdrop open", onClick: handleBackdropClick },
    h(
      "div",
      { className: "project-small-popup", onClick: (e) => e.stopPropagation() },
      h("h3", { className: "popup-title" }, project.title),
      h("p", { className: "popup-subtitle" }, project.tag),
      h(
        "div",
        { className: "popup-buttons-stack" },
        /* GitHub Button */
        h(
          "button",
          {
            className: "premium-btn primary popup-action-btn",
            disabled: redirecting !== null,
            onClick: () => handleRedirect(project.github, "github")
          },
          redirecting === "github" && h("span", { className: "btn-loader" }),
          redirecting === "github" ? "Redirecting..." : "View in GitHub"
        ),
        /* Live Project Button */
        h(
          "button",
          {
            className: "premium-btn primary popup-action-btn",
            disabled: redirecting !== null,
            onClick: () => handleRedirect(project.live, "live")
          },
          redirecting === "live" && h("span", { className: "btn-loader" }),
          redirecting === "live" ? "Redirecting..." : "View Live Project"
        ),
        h("div", { className: "popup-divider" }),
        /* Close Button */
        h(
          "button",
          {
            className: "premium-btn secondary popup-close-btn",
            onClick: onClose
          },
          "Close"
        )
      )
    )
  );
}

function ProjectsSection({ onSelectProject }) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });
  const navRef = useRef(null);

  const filteredProjects = useMemo(() => {
    if (filter === "all") return PROJECTS_DATA;
    return PROJECTS_DATA.filter((p) => p.category === filter);
  }, [filter]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector(`.filter-tab-btn[data-filter="${filter}"]`);
    if (activeBtn) {
      setPillStyle({ width: activeBtn.offsetWidth, left: activeBtn.offsetLeft });
    }
  }, [filter]);

  const currentVariants = useMemo(() => getProjectsVariants(isMobile), [isMobile]);

  return h(
    motion.section,
    {
      id: "projects",
      className: "section-wrapper",
      initial: "offscreen",
      whileInView: "onscreen",
      exit: "exit",
      viewport: { once: false, amount: isMobile ? 0.08 : 0.2 },
      variants: currentVariants
    },
    h("div", { className: "glass-card" },
      h("div", { className: "kicker-badge" }, "📁 Showcase"),
      h("h2", { className: "section-title" }, "Practical apps. Quiet polish."),
      h("p", { className: "section-lead" },
        "A selection of production-ready builds. Real mobile frameworks, scalable databases, clean architectures, and interfaces designed to scale beautifully."
      ),
      h("div", { className: "filter-tabs-container" },
        h("div", { ref: navRef, className: "filter-tabs-nav" },
          h("div", { className: "filter-active-pill", style: pillStyle }),
          ["all", "mobile", "web"].map((cat) =>
            h(
              "button",
              {
                key: cat,
                className: `filter-tab-btn ${filter === cat ? "active" : ""}`,
                "data-filter": cat,
                onClick: () => setFilter(cat)
              },
              cat === "all" ? "ALL" : cat === "mobile" ? "MOBILE" : "AI STUDIO"
            )
          )
        )
      ),
      h(
        motion.div,
        { className: "projects-grid" },
        h(
          AnimatePresence,
          { mode: "popLayout" },
          filteredProjects.map((project) =>
            h(
              motion.div,
              {
                layout: true,
                key: project.id,
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 },
                transition: { duration: 0.35, ease: "easeOut" }
              },
              h(ProjectCard, { project, onSelect: onSelectProject })
            )
          )
        )
      )
    )
  );
}

/* ==========================================================================
   CONTACT SECTION
   ========================================================================== */

function ContactSection() {
  const isMobile = useIsMobile();
  const currentVariants = useMemo(() => getContactVariants(isMobile), [isMobile]);

  return h(
    motion.section,
    {
      id: "contact",
      className: "section-wrapper",
      initial: "offscreen",
      whileInView: "onscreen",
      exit: "exit",
      viewport: { once: false, amount: isMobile ? 0.08 : 0.2 },
      variants: currentVariants
    },
    h("div", { className: "glass-card" },
      h("div", { className: "kicker-badge" }, "📮 Connection"),
      h("h2", { className: "section-title" }, "Let's build something crisp."),
      h("p", { className: "section-lead", style: { textAlign: "center", margin: "0 auto 32px auto" } },
        "Open to internships, junior developer placements, or app-building partnerships. Connect through the channels below."
      ),
      h("div", { className: "contact-channels-centered" },
        /* GitHub */
        h(
          "a",
          { href: "https://github.arijeet.in", className: "social-channel-card github", target: "_blank", rel: "noopener noreferrer" },
          h("div", { className: "social-icon-wrapper" },
            h("img", { src: "assets/icons/github.svg", alt: "Github", width: 20, height: 20 })
          ),
          h("div", { className: "social-channel-details" },
            h("span", { className: "social-channel-label" }, "GitHub"),
            h("span", { className: "social-channel-val" }, "arijeetdas")
          )
        ),
        /* LinkedIn */
        h(
          "a",
          { href: "https://linkedin.arijeet.in", className: "social-channel-card linkedin", target: "_blank", rel: "noopener noreferrer" },
          h("div", { className: "social-icon-wrapper" },
            h("img", { src: "assets/icons/linkedin.svg", alt: "LinkedIn", width: 20, height: 20 })
          ),
          h("div", { className: "social-channel-details" },
            h("span", { className: "social-channel-label" }, "LinkedIn"),
            h("span", { className: "social-channel-val" }, "arijeetdas-dev")
          )
        ),
        /* WhatsApp */
        h(
          "a",
          { href: "https://whatsapp.arijeet.in", className: "social-channel-card whatsapp", target: "_blank", rel: "noopener noreferrer" },
          h("div", { className: "social-icon-wrapper" },
            h("img", { src: "assets/icons/whatsapp.svg", alt: "WhatsApp", width: 20, height: 20 })
          ),
          h("div", { className: "social-channel-details" },
            h("span", { className: "social-channel-label" }, "WhatsApp"),
            h("span", { className: "social-channel-val" }, "@arijeetdas.in")
          )
        ),
        /* Email */
        h(
          "a",
          { href: "mailto:contact@arijeet.in", className: "social-channel-card email" },
          h("div", { className: "social-icon-wrapper" },
            h("img", { src: "assets/icons/mail.svg", alt: "Email", width: 20, height: 20 })
          ),
          h("div", { className: "social-channel-details" },
            h("span", { className: "social-channel-label" }, "Email"),
            h("span", { className: "social-channel-val" }, "contact@arijeet.in")
          )
        ),
        /* Phone */
        h(
          "a",
          { href: "tel:+916290724324", className: "social-channel-card phone" },
          h("div", { className: "social-icon-wrapper" },
            h(
              "svg",
              { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
              h("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" })
            )
          ),
          h("div", { className: "social-channel-details" },
            h("span", { className: "social-channel-label" }, "Phone"),
            h("span", { className: "social-channel-val" }, "+91 6290724324")
          )
        )
      )
    )
  );
}

/* ==========================================================================
   COLOR PALETTES CONFIGURATIONS
   ========================================================================== */

const PALETTES = [
  {
    name: "cosmic-blue",
    cyan: "56, 189, 248",
    indigo: "99, 102, 241",
    emerald: "16, 185, 129",
    pink: "244, 114, 182"
  },
  {
    name: "cyber-neon",
    cyan: "168, 85, 247",
    indigo: "217, 70, 239",
    emerald: "59, 130, 246",
    pink: "244, 63, 94"
  },
  {
    name: "solar-amber",
    cyan: "245, 158, 11",
    indigo: "244, 63, 94",
    emerald: "234, 179, 8",
    pink: "239, 68, 68"
  },
  {
    name: "emerald-aurora",
    cyan: "16, 185, 129",
    indigo: "20, 184, 166",
    emerald: "132, 204, 22",
    pink: "56, 189, 248"
  },
  {
    name: "crimson-eclipse",
    cyan: "244, 63, 94",
    indigo: "245, 158, 11",
    emerald: "139, 92, 246",
    pink: "249, 115, 22"
  },
  {
    name: "toxic-matrix",
    cyan: "34, 197, 94",
    indigo: "6, 182, 212",
    emerald: "99, 102, 241",
    pink: "234, 179, 8"
  },
  {
    name: "ocean-abyss",
    cyan: "20, 184, 166",
    indigo: "14, 165, 233",
    emerald: "16, 185, 129",
    pink: "168, 85, 247"
  },
  {
    name: "electric-tangerine",
    cyan: "249, 115, 22",
    indigo: "236, 72, 153",
    emerald: "14, 165, 233",
    pink: "234, 179, 8"
  },
  {
    name: "pastel-velvet",
    cyan: "196, 181, 253",
    indigo: "251, 182, 206",
    emerald: "165, 243, 252",
    pink: "253, 186, 116"
  },
  {
    name: "obsidian-frost",
    cyan: "186, 230, 253",
    indigo: "148, 163, 184",
    emerald: "45, 212, 191",
    pink: "129, 140, 248"
  },
  {
    name: "sakura-blossom",
    cyan: "244, 143, 177",
    indigo: "206, 147, 216",
    emerald: "165, 214, 167",
    pink: "224, 242, 241"
  },
  {
    name: "retro-arcade",
    cyan: "0, 242, 254",
    indigo: "253, 0, 150",
    emerald: "142, 68, 173",
    pink: "186, 255, 41"
  },
  {
    name: "nordic-forest",
    cyan: "165, 214, 233",
    indigo: "46, 125, 50",
    emerald: "216, 112, 147",
    pink: "255, 215, 0"
  },
  {
    name: "neon-ultraviolet",
    cyan: "138, 43, 226",
    indigo: "0, 191, 255",
    emerald: "218, 255, 0",
    pink: "255, 20, 147"
  },
  {
    name: "copper-sunset",
    cyan: "211, 84, 0",
    indigo: "241, 196, 15",
    emerald: "192, 57, 43",
    pink: "230, 126, 34"
  }
];

/* ==========================================================================
   APP MAIN ENTRY POINT
   ========================================================================== */

function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEngramOpen, setIsEngramOpen] = useState(false);
  const [EngramComponent, setEngramComponent] = useState(null);
  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const selected = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--accent-cyan", selected.cyan);
    rootStyle.setProperty("--accent-indigo", selected.indigo);
    rootStyle.setProperty("--accent-emerald", selected.emerald);
    rootStyle.setProperty("--accent-pink", selected.pink);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { root: null, rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );

    sections.forEach((sec) => { if (sec) observer.observe(sec); });
    return () => { sections.forEach((sec) => { if (sec) observer.unobserve(sec); }); };
  }, []);

  const navigateToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  const openEngram = async () => {
    if (!EngramComponent) {
      try {
        const module = await import("./engram.js");
        setEngramComponent(() => module.default);
      } catch (err) {
        console.error("Failed to load Engram Mode:", err);
        return;
      }
    }
    setIsEngramOpen(true);
  };

  const engramActions = useMemo(() => ({
    scrollToSection: (id) => navigateToSection(id),
    downloadResume: () => {
      const btn = document.querySelector(".hero-section .premium-btn.primary");
      if (btn) btn.click();
    },
    openProject: (id) => {
      const project = PROJECTS_DATA.find((p) => p.id === id);
      if (project) setSelectedProject(project);
    },
    changeAccentColor: (paletteName) => {
      let found;
      if (!paletteName) {
        found = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      } else {
        found = PALETTES.find(
          (p) => p.name === paletteName || p.name.includes(paletteName)
        );
      }
      if (found) {
        const rootStyle = document.documentElement.style;
        rootStyle.setProperty("--accent-cyan", found.cyan);
        rootStyle.setProperty("--accent-indigo", found.indigo);
        rootStyle.setProperty("--accent-emerald", found.emerald);
        rootStyle.setProperty("--accent-pink", found.pink);
        return found.name;
      }
      return null;
    }
  }), [selectedProject]);

  return h(
    React.Fragment,
    null,
    h(MouseFollower),
    h(AmbientBackground, { activeSection }),
    h(Navbar, { activeSection, onNavigate: navigateToSection }),
    h(
      "button",
      {
        className: "engram-trigger-btn",
        onClick: openEngram,
        "aria-label": "Open Engram Mode (ArijeetOS)"
      },
      h("span", { className: "engram-trigger-icon", style: { display: "flex", alignItems: "center" } }, "🧠"),
      h("span", { className: "engram-trigger-text" }, "ArijeetOS")
    ),
    h(
      "main",
      { className: "app-shell" },
      h(HeroSection, { onNavigate: navigateToSection }),
      h(AboutSection),
      h(SkillsSection),
      h(ProjectsSection, { onSelectProject: setSelectedProject }),
      h(ContactSection)
    ),
    h(
      "footer",
      null,
      h("div", { className: "footer-content" },
        h("span", null, `© ${year} Arijeet Das. All Rights Reserved.`),
        h("span", { className: "footer-logo" }, "Arijeet.")
      )
    ),
    h(
      AnimatePresence,
      null,
      selectedProject && h(ProjectPopup, { project: selectedProject, onClose: () => setSelectedProject(null) })
    ),
    h(
      AnimatePresence,
      null,
      isEngramOpen && EngramComponent && h(EngramComponent, {
        isOpen: isEngramOpen,
        onClose: () => setIsEngramOpen(false),
        actions: engramActions
      })
    )
  );
}

createRoot(document.getElementById("root")).render(h(App));
