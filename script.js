/* THEME */
const body = document.body;
const toggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  body.classList.add("dark");
  themeIcon.src = "assets/icons/sun.svg";
}

toggleBtn.addEventListener("click", () => {
  body.classList.toggle("dark");
  const isDark = body.classList.contains("dark");
  themeIcon.src = isDark ? "assets/icons/sun.svg" : "assets/icons/moon.svg";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

/* MOBILE MENU */
const menuBtn = document.getElementById("menu-btn");
const nav = document.querySelector("nav");

menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});

/* CLOSE MENU ON LINK CLICK */
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
  });
});

/* ACTIVE LINK + REVEAL */
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-link");
const reveals = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach(sec => {
    if (scrollY >= sec.offsetTop - 120) {
      current = sec.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });

  reveals.forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 120) {
      el.classList.add("show");
    }
  });
});

window.addEventListener("load", () => {
  const homeSection = document.querySelector("#home");
  homeSection.classList.add("show");
});