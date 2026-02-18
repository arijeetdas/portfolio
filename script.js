const body = document.body;
const toggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

const menuBtn = document.getElementById("menu-btn");
const nav = document.getElementById("nav") || document.querySelector("nav");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id]");
const revealItems = document.querySelectorAll(".reveal");

const setThemeIcon = (isDark) => {
  if (!themeIcon) return;
  themeIcon.src = isDark ? "assets/icons/sun-white.svg" : "assets/icons/moon.svg";
};

const initTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = savedTheme === "dark" || (!savedTheme && prefersDark);

  body.classList.toggle("dark", useDark);
  setThemeIcon(useDark);
};

initTheme();

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark");
    const isDark = body.classList.contains("dark");
    setThemeIcon(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

if (menuBtn && nav) {
  menuBtn.setAttribute("aria-expanded", "false");

  const closeMobileMenu = () => {
    nav.classList.remove("open");
    menuBtn.classList.remove("open");
    body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.classList.toggle("open", isOpen);
    body.classList.toggle("menu-open", isOpen);
    menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    const clickInsideMenu = nav.contains(event.target) || menuBtn.contains(event.target);
    if (!clickInsideMenu) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMobileMenu();
    }
  });
}

if (navLinks.length && nav) {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      if (menuBtn) {
        menuBtn.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
      body.classList.remove("menu-open");
    });
  });
}

if (sections.length && navLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const targetId = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${targetId}`);
        });
      });
    },
    {
      root: null,
      threshold: 0.45
    }
  );

  sections.forEach((section) => observer.observe(section));
}

if (revealItems.length) {
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 60, 220)}ms`;
  });

  const revealObserver = new IntersectionObserver(
    (entries, revealHandle) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("show");
        revealHandle.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}