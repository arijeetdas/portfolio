import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform
} from "framer-motion";

const h = React.createElement;

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" }
];

const sections = [
  {
    id: "home",
    kicker: "Software Engineer / App Developer",
    title: "Arijeet Das",
    lead:
      "I design and ship polished mobile and cross-platform products with clean architecture, good performance, and user-friendly interfaces.",
    image: "assets/profile.png",
    imageAlt: "Arijeet Das",
    tone: "hero"
  },
  {
    id: "about",
    kicker: "About",
    title: "Engineering with product taste.",
    lead:
      "I am a Computer Science Engineering student focused on app development across Flutter and native ecosystems. I enjoy turning product requirements into reliable, maintainable applications that feel fast and natural.",
    image: "assets/images/about.svg",
    imageAlt: "About illustration",
    tone: "aurora",
    points: ["Full lifecycle ownership", "Performance-minded UI", "Strong fundamentals"]
  },
  {
    id: "skills",
    kicker: "Skills",
    title: "A compact stack for useful software.",
    lead:
      "My toolkit blends mobile engineering, platform APIs, data fundamentals, and frontend craft so products can move from idea to release without losing polish.",
    image: "assets/images/skills.svg",
    imageAlt: "Skills illustration",
    tone: "ember",
    skills: [
      "Java",
      "C",
      "Python",
      "Dart / Flutter",
      "Kotlin / Android",
      "SQL / MongoDB",
      "HTML",
      "CSS",
      "JavaScript",
      "Git & GitHub"
    ]
  },
  {
    id: "projects",
    kicker: "Projects",
    title: "Practical apps with quiet polish.",
    lead:
      "The work centers on real product experiences: responsive Flutter applications, platform-ready builds, clean state handling, and interfaces that stay readable under everyday use.",
    image: "assets/images/projects.svg",
    imageAlt: "Projects illustration",
    tone: "violet"
  },
  {
    id: "contact",
    kicker: "Contact",
    title: "Let's build something crisp.",
    lead:
      "Open to internships and app development roles where product quality, reliable delivery, and user impact matter.",
    image: "assets/images/contact.svg",
    imageAlt: "Contact illustration",
    tone: "mint",
    links: [
      ["GitHub", "https://github.com/arijeetdas", "assets/icons/github.svg", "github"],
      ["LinkedIn", "https://linkedin.com/in/arijeetdas-dev", "assets/icons/linkedin.svg", "linkedin"],
      ["Email", "mailto:arijeetdas900@gmail.com", "assets/icons/mail.svg", "email"]
    ]
  }
];

const scrollStops = sections.map((_, index) => index / (sections.length - 1));

const backgroundThemes = {
  glowA: [
    "rgba(56, 189, 248, 0.55)",
    "rgba(45, 212, 191, 0.48)",
    "rgba(251, 146, 60, 0.42)",
    "rgba(168, 85, 247, 0.48)",
    "rgba(16, 185, 129, 0.44)"
  ],
  glowB: [
    "rgba(45, 212, 191, 0.34)",
    "rgba(14, 165, 233, 0.42)",
    "rgba(250, 204, 21, 0.28)",
    "rgba(244, 114, 182, 0.34)",
    "rgba(125, 211, 252, 0.28)"
  ],
  glowC: [
    "rgba(249, 168, 212, 0.22)",
    "rgba(167, 243, 208, 0.2)",
    "rgba(244, 114, 182, 0.18)",
    "rgba(125, 211, 252, 0.2)",
    "rgba(167, 243, 208, 0.22)"
  ],
  baseA: ["#020617", "#021216", "#080b12", "#080711", "#021011"],
  baseB: ["#071a2d", "#063044", "#2a1608", "#261347", "#0e3a26"],
  baseC: ["#03151b", "#08111f", "#060914", "#07111f", "#030712"],
  xA: ["18%", "26%", "20%", "21%", "18%"],
  yA: ["20%", "28%", "78%", "22%", "22%"],
  xB: ["82%", "76%", "80%", "78%", "82%"],
  yB: ["74%", "64%", "20%", "72%", "70%"],
  angle: ["135deg", "140deg", "145deg", "135deg", "140deg"]
};

function goToSection(id) {
  const section = document.getElementById(id);
  if (!section) return;

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

function createSectionTimeline(index, total) {
  const step = 1 / (total - 1);
  const center = index * step;

  if (index === 0) {
    return {
      input: [0, step * 0.22, step * 0.72],
      opacity: [1, 1, 0],
      y: [0, 0, -42],
      scale: [1, 1, 0.985],
      imageY: [0, 0, -16]
    };
  }

  if (index === total - 1) {
    return {
      input: [1 - step * 0.72, 1 - step * 0.22, 1],
      opacity: [0, 1, 1],
      y: [42, 0, 0],
      scale: [0.985, 1, 1],
      imageY: [16, 0, 0]
    };
  }

  return {
    input: [center - step * 0.58, center - step * 0.16, center + step * 0.16, center + step * 0.58],
    opacity: [0, 1, 1, 0],
    y: [42, 0, 0, -42],
    scale: [0.985, 1, 1, 0.985],
    imageY: [16, 0, 0, -16]
  };
}

function ScrollBackground({ progress }) {
  // One smoothed global scroll value drives every color stop, so fast scrolling
  // morphs directly to the target theme instead of stepping section-by-section.
  const glowA = useTransform(progress, scrollStops, backgroundThemes.glowA);
  const glowB = useTransform(progress, scrollStops, backgroundThemes.glowB);
  const glowC = useTransform(progress, scrollStops, backgroundThemes.glowC);
  const baseA = useTransform(progress, scrollStops, backgroundThemes.baseA);
  const baseB = useTransform(progress, scrollStops, backgroundThemes.baseB);
  const baseC = useTransform(progress, scrollStops, backgroundThemes.baseC);
  const xA = useTransform(progress, scrollStops, backgroundThemes.xA);
  const yA = useTransform(progress, scrollStops, backgroundThemes.yA);
  const xB = useTransform(progress, scrollStops, backgroundThemes.xB);
  const yB = useTransform(progress, scrollStops, backgroundThemes.yB);
  const angle = useTransform(progress, scrollStops, backgroundThemes.angle);
  const drift = useTransform(progress, [0, 1], ["0%", "100%"]);

  const background = useMotionTemplate`
    radial-gradient(circle at ${xA} ${yA}, ${glowA}, transparent 31%),
    radial-gradient(circle at ${xB} ${yB}, ${glowB}, transparent 34%),
    radial-gradient(circle at 50% 82%, ${glowC}, transparent 38%),
    linear-gradient(${angle}, ${baseA}, ${baseB} 52%, ${baseC})
  `;

  return h(
    motion.div,
    {
      className: "scroll-background",
      style: {
        background,
        backgroundPositionX: drift
      },
      "aria-hidden": "true"
    },
    h("div", { className: "background-aura aura-one" }),
    h("div", { className: "background-aura aura-two" }),
    h("div", { className: "background-aura aura-three" }),
    h("div", { className: "background-noise" }),
    // Floating elements - optimized for performance
    h(motion.div, { className: "floating-element", style: { left: "8%", top: "15%" }, animate: { y: [0, -20, 0], rotate: [0, 2, 0] }, transition: { duration: 12, repeat: Infinity, ease: "easeInOut" } }, "</>"),
    h(motion.div, { className: "floating-element", style: { right: "12%", top: "25%" }, animate: { y: [0, -25, 0], rotate: [0, -1, 0] }, transition: { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 } }, "{}"),
    h(motion.div, { className: "floating-element", style: { left: "20%", top: "40%" }, animate: { y: [0, -15, 0], rotate: [0, 3, 0] }, transition: { duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 } }, "⚡"),
    h(motion.div, { className: "floating-element", style: { right: "15%", top: "55%" }, animate: { y: [0, -20, 0], rotate: [0, -2, 0] }, transition: { duration: 13, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }, "🚀"),
    h(motion.div, { className: "floating-element", style: { left: "25%", top: "70%" }, animate: { y: [0, -18, 0], rotate: [0, 1, 0] }, transition: { duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }, "💻"),
    h(motion.div, { className: "floating-element", style: { right: "8%", top: "35%" }, animate: { y: [0, -22, 0], rotate: [0, -3, 0] }, transition: { duration: 12.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 } }, "◆"),
    h(motion.div, { className: "floating-element", style: { left: "35%", top: "20%" }, animate: { y: [0, -16, 0], rotate: [0, 2, 0] }, transition: { duration: 13.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 } }, "◇"),
    h(motion.div, { className: "floating-element", style: { right: "25%", top: "75%" }, animate: { y: [0, -19, 0], rotate: [0, -1, 0] }, transition: { duration: 11.5, repeat: Infinity, ease: "easeInOut", delay: 2.2 } }, "✦"),
    h(motion.div, { className: "floating-element", style: { left: "45%", top: "50%" }, animate: { y: [0, -21, 0], rotate: [0, 3, 0] }, transition: { duration: 14.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 } }, "∞"),
    h(motion.div, { className: "floating-element", style: { right: "35%", top: "85%" }, animate: { y: [0, -17, 0], rotate: [0, -2, 0] }, transition: { duration: 12.8, repeat: Infinity, ease: "easeInOut", delay: 1.8 } }, "▪")
  );
}

function LoadingButton({
  children,
  href,
  download,
  external,
  variant = "primary",
  delay = 1700
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);

    window.setTimeout(() => {
      const anchor = document.createElement("a");
      anchor.href = href;
      if (download) anchor.download = "";
      if (external) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setLoading(false);
    }, delay);
  };

  return h(
    motion.button,
    {
      type: "button",
      className: `premium-btn ${variant} ${loading ? "loading" : ""}`,
      "data-cursor": loading ? "loading" : "button",
      onClick: handleClick,
      disabled: loading,
      whileHover: loading ? {} : { scale: 1.035, y: -2 },
      whileTap: loading ? {} : { scale: 0.98 }
    },
    loading && h("span", { className: "spinner", "aria-hidden": "true" }),
    h("span", null, loading ? "Preparing..." : children)
  );
}

function ProjectModal({ open, stage, onClose, onProceed }) {
  if (!open) return null;

  return h(
    "div",
    { className: "modal-overlay", "aria-modal": "true", role: "dialog" },
    h(
      "div",
      { className: "modal-panel" },
      h(
        "button",
        {
          type: "button",
          className: "modal-close",
          onClick: onClose,
          "aria-label": "Close project modal"
        },
        "×"
      ),
      stage === "preview"
        ? h(
            React.Fragment,
            null,
            h("p", { className: "modal-eyebrow" }, "Projects are live"),
            h("h2", null, "All projects are available on Vibe Labs Store and GitHub"),
            h(
              "p",
              { className: "modal-copy" },
              "All the projects of Arijeet Das are listed and updated regularly on Vibe Labs Store and GitHub. Explore app releases, projects, and source repositories in one central place."
            ),
            h(
              motion.button,
              {
                type: "button",
                className: "premium-btn",
                onClick: onProceed,
                whileHover: { scale: 1.035, y: -2 },
                whileTap: { scale: 0.98 }
              },
              "Proceed"
            )
          )
        : h(
            React.Fragment,
            null,
            h("p", { className: "modal-eyebrow" }, "Choose a destination"),
            h("h2", null, "Browse the project hub"),
            h(
              "p",
              { className: "modal-copy" },
              "Continue to the platform you prefer." 
            ),
            h(
              "div",
              { className: "modal-link-row" },
              h(
                LoadingButton,
                {
                  href: "https://github.com/arijeetdas",
                  external: true,
                  variant: "primary",
                  delay: 850
                },
                "GitHub"
              ),
              h(
                LoadingButton,
                {
                  href: "https://vibe-labs.netlify.app/apps.html",
                  external: true,
                  variant: "primary",
                  delay: 850
                },
                "Vibe Store"
              )
            )
          )
    )
  );
}

function CustomCursor() {
  const [point, setPoint] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState([]);
  const [mode, setMode] = useState("default");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!hasFinePointer) return undefined;

    const getMode = (target) => {
      const element = target.closest?.("[data-cursor], button, a");
      if (!element) return "default";
      if (element.disabled || element.getAttribute("aria-disabled") === "true") return "loading";
      return element.dataset.cursor || "button";
    };

    const onMove = (event) => {
      const newPoint = { x: event.clientX, y: event.clientY, timestamp: Date.now() };
      setPoint(newPoint);
      setMode(getMode(event.target));
      setVisible(true);

      // Add trail point
      setTrail(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 8 points for performance
        return updated.slice(-8);
      });
    };

    const onOver = (event) => setMode(getMode(event.target));
    const onLeave = () => {
      setVisible(false);
      setPoint({ x: -100, y: -100 }); // Reset position when leaving
      setTrail([]); // Clear trail when cursor leaves
      setMode("default");
    };
    const onDown = () => setMode((current) => (current === "loading" ? "loading" : "press"));
    const onUp = (event) => setMode(getMode(event.target));
    const onWindowOut = (event) => {
      if (!event.relatedTarget && !event.toElement) {
        onLeave();
      }
    };
    const onBlur = () => onLeave();

    // Listen on document instead of window for better mouse leave detection
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("mouseout", onWindowOut);
    window.addEventListener("blur", onBlur);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mouseout", onWindowOut);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    const modes = ["default", "button", "loading", "press"];
    body.classList.toggle("custom-cursor-active", visible);
    modes.forEach((modeName) => {
      body.classList.toggle(`cursor-${modeName}`, visible && mode === modeName);
    });

    return () => {
      body.classList.remove("custom-cursor-active", ...modes.map((modeName) => `cursor-${modeName}`));
    };
  }, [mode, visible]);

  return h(
    "div",
    { className: `cursor-system ${visible ? "visible" : ""} ${mode}`, "aria-hidden": "true" },
    // Trail particles
    trail.map((trailPoint, index) => {
      const age = Date.now() - trailPoint.timestamp;
      const opacity = Math.max(0, 1 - age / 600); // Fade over 600ms
      const scale = Math.max(0.1, 1 - age / 800); // Shrink over 800ms

      return h(motion.div, {
        key: trailPoint.timestamp + index,
        className: "cursor-trail",
        style: {
          opacity: opacity * 0.6,
          transform: `scale(${scale})`
        },
        animate: {
          x: trailPoint.x - 3,
          y: trailPoint.y - 3
        },
        transition: { type: "spring", stiffness: 300, damping: 25, mass: 0.1 }
      });
    }),
    h(motion.div, {
      className: "cursor-ring",
      animate: {
        x: point.x - 21,
        y: point.y - 21,
        scale: mode === "button" ? 1.65 : mode === "press" ? 0.82 : mode === "loading" ? 1.45 : 1
      },
      transition: { type: "spring", stiffness: 480, damping: 32, mass: 0.4 }
    }),
    h(motion.div, {
      className: "cursor-dot",
      animate: { x: point.x - 5, y: point.y - 5 },
      transition: { type: "spring", stiffness: 850, damping: 30, mass: 0.25 }
    })
  );
}

function Navbar({ progress }) {
  const scaleX = useSpring(progress, { stiffness: 120, damping: 24, mass: 0.3 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const [hidden, setHidden] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  const scrollToSection = (id) => {
    setMenuOpen(false);
    setHidden(false);
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    goToSection(id);
  };

  useEffect(() => {
    setHidden(false);
    if (hideTimeout) clearTimeout(hideTimeout);
    setHideTimeout(null);
  }, [activeId]);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const updateNav = () => {
      frame = 0;
      const currentY = window.scrollY;
      const active = navItems.slice().reverse().find(item => {
        const section = document.getElementById(item.id);
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= 0;
      })?.id || "home";

      setActiveId(active);

      if (currentY < lastY) { // upwards
        if (hideTimeout) clearTimeout(hideTimeout);
        setHideTimeout(setTimeout(() => setHidden(true), 3000));
      } else { // downwards
        if (hideTimeout) clearTimeout(hideTimeout);
        setHideTimeout(null);
        setHidden(currentY > window.innerHeight * 0.35 && !menuOpen);
      }

      lastY = Math.max(currentY, 0);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateNav);
    };

    updateNav();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (hideTimeout) clearTimeout(hideTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [menuOpen, hideTimeout]);

  return h(
    "header",
    { className: `site-nav ${hidden ? "hidden" : ""}` },
    h(
      "button",
      {
        type: "button",
        className: "brand",
        onClick: () => scrollToSection("home"),
        "aria-label": "Go to hero section"
      },
      "Arijeet."
    ),
    h(
      "button",
      {
        type: "button",
        className: `menu-toggle ${menuOpen ? "open" : ""}`,
        onClick: () => setMenuOpen((open) => !open),
        "aria-label": "Toggle navigation menu",
        "aria-expanded": menuOpen
      },
      h("span", null),
      h("span", null),
      h("span", null)
    ),
    h(
      "nav",
      { className: `nav-pill ${menuOpen ? "open" : ""}`, "aria-label": "Portfolio sections" },
      navItems.map((item) =>
        h(
          "button",
          {
            key: item.id,
            type: "button",
            className: activeId === item.id ? "active" : "",
            "aria-current": activeId === item.id ? "page" : undefined,
            onClick: () => scrollToSection(item.id)
          },
          item.label
        )
      )
    ),
    h(motion.div, {
      className: "scroll-progress",
      style: { scaleX },
      "aria-hidden": "true"
    })
  );
}

function AnimatedCard({ children, index, progress }) {
  // Each card maps the same global progress to enter, hold, and exit ranges.
  // Because this is purely scroll-derived, the animation reverses naturally.
  const timeline = createSectionTimeline(index, sections.length);
  const opacity = useTransform(progress, timeline.input, timeline.opacity);
  const y = useTransform(progress, timeline.input, timeline.y);
  const scale = useTransform(progress, timeline.input, timeline.scale);

  return h(
    motion.div,
    {
      className: "section-stage",
      style: { opacity, y, scale }
    },
    children
  );
}

function AnimatedSection({ section, index, progress, onOpenProjects }) {
  const timeline = createSectionTimeline(index, sections.length);
  const imageY = useTransform(progress, timeline.input, timeline.imageY);

  return h(
    "section",
    {
      id: section.id,
      className: `story-section ${section.tone}`,
      style: { zIndex: index + 1 },
      "data-section-index": index
    },
    h(
      AnimatedCard,
      { index, progress },
      h(
        motion.div,
        { className: "section-copy" },
        h(motion.p, { className: "kicker" }, section.kicker),
        h(motion.h1, null, section.title),
        h(motion.p, { className: "lead" }, section.lead),
        h(SectionActions, { section, onOpenProjects }),
        h(SectionDetails, { section })
      ),
      h(
        motion.div,
        { className: "visual-wrap", style: { y: imageY }, variants: itemVariants },
        h("div", { className: "glass-ring" }),
        h("img", {
          src: section.image,
          alt: section.imageAlt,
          className: section.id === "home" ? "portrait visual" : "visual"
        })
      )
    )
  );
}

function SectionActions({ section, onOpenProjects }) {
  if (section.id === "home") {
    return h(
      motion.div,
      { className: "actions", variants: itemVariants },
      h(
        LoadingButton,
        { href: "assets/resume/Arijeet_Das_Resume.pdf", download: true },
        "Download Resume"
      ),
      h(
        motion.a,
        {
          href: "#projects",
          className: "premium-btn ghost",
          onClick: (event) => {
            event.preventDefault();
            goToSection("projects");
          },
          whileHover: { scale: 1.035, y: -2 },
          whileTap: { scale: 0.98 }
        },
        "Explore Projects"
      )
    );
  }

  if (section.id === "projects") {
    return h(
      motion.div,
      { className: "actions", variants: itemVariants },
      h(
        motion.button,
        {
          type: "button",
          className: "premium-btn",
          onClick: onOpenProjects,
          whileHover: { scale: 1.035, y: -2 },
          whileTap: { scale: 0.98 }
        },
        "View Projects"
      )
    );
  }

  return null;
}

function SectionDetails({ section }) {
  if (section.points) {
    return h(
      motion.div,
      { className: "point-row", variants: itemVariants },
      section.points.map((point) => h("span", { key: point }, point))
    );
  }

  if (section.skills) {
    return h(
      motion.div,
      { className: "skill-cloud", variants: itemVariants },
      section.skills.map((skill) =>
        h(motion.span, { key: skill, whileHover: { y: -4, scale: 1.04 } }, skill)
      )
    );
  }

  if (section.projects) {
    return h(
      motion.div,
      { className: "project-stack", variants: itemVariants },
      section.projects.map(([name, meta, href]) =>
        h(
          motion.a,
          {
            href,
            key: name,
            className: "project-card",
            whileHover: { y: -6, rotateX: 2, rotateY: -2 },
            target: href.startsWith("http") ? "_blank" : undefined,
            rel: href.startsWith("http") ? "noopener noreferrer" : undefined
          },
          h("span", null, name),
          h("small", null, meta)
        )
      )
    );
  }

  if (section.links) {
    return h(
      motion.div,
      { className: "contact-row", variants: itemVariants },
      section.links.map(([label, href, icon, kind]) =>
        h(
          motion.a,
          {
            href,
            key: label,
            className: `contact-button ${kind}`,
            target: href.startsWith("http") ? "_blank" : undefined,
            rel: href.startsWith("http") ? "noopener noreferrer" : undefined,
            whileHover: { y: -4, scale: 1.035 },
            whileTap: { scale: 0.98 }
          },
          h("img", { src: icon, alt: "", "aria-hidden": "true" }),
          label
        )
      )
    );
  }

  return null;
}

function App() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 92,
    damping: 28,
    mass: 0.35
  });
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [projectModalStage, setProjectModalStage] = useState("preview");

  useEffect(() => {
    document.body.classList.toggle("modal-open", showProjectsModal);
    return () => document.body.classList.remove("modal-open");
  }, [showProjectsModal]);

  const openProjectsModal = () => setShowProjectsModal(true);
  const closeProjectsModal = () => {
    setShowProjectsModal(false);
    setProjectModalStage("preview");
  };

  return h(
    React.Fragment,
    null,
    h(CustomCursor),
    h(ScrollBackground, { progress: smoothProgress }),
    h(Navbar, { progress: smoothProgress }),
    h(
      "main",
      { className: "story-scroll" },
      sections.map((section, index) =>
        h(AnimatedSection, {
          key: section.id,
          section,
          index,
          progress: smoothProgress,
          onOpenProjects: openProjectsModal
        })
      )
    ),
    h(
      ProjectModal,
      {
        open: showProjectsModal,
        stage: projectModalStage,
        onClose: closeProjectsModal,
        onProceed: () => setProjectModalStage("links")
      }
    ),
    h("footer", null, `Copyright ${currentYear} Arijeet Das`)
  );
}

createRoot(document.getElementById("root")).render(h(App));
