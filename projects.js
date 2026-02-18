const filterButtons = document.querySelectorAll(".filter-btn");
const appCards = document.querySelectorAll(".app-card");
const searchInput = document.getElementById("search-input");
const searchToggle = document.getElementById("search-toggle");
const searchBar = document.getElementById("search-bar");
const projectsContainer = document.querySelector(".projects-container");

let activeFilter = "all";

const noResultsElement = document.createElement("p");
noResultsElement.className = "meta";
noResultsElement.style.display = "none";
noResultsElement.textContent = "No projects found for the current search/filter.";
if (projectsContainer) {
  projectsContainer.after(noResultsElement);
}

/* APPLY FILTERS */
function applyFilters() {
  const query = (searchInput?.value || "").toLowerCase().trim();
  let visibleCount = 0;

  appCards.forEach(card => {
    const platform = card.dataset.platform;
    const name = card.dataset.name;

    const matchesPlatform =
      activeFilter === "all" || platform === activeFilter;
    const matchesSearch = name.includes(query);

    const isVisible = matchesPlatform && matchesSearch;
    card.style.display = isVisible ? "flex" : "none";
    if (isVisible) visibleCount += 1;
  });

  if (noResultsElement) {
    noResultsElement.style.display = visibleCount === 0 ? "block" : "none";
  }
}

/* Filter buttons */
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

/* Search input */
if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

/* Mobile search toggle */
if (searchToggle && searchBar) {
  searchToggle.addEventListener("click", () => {
    searchBar.classList.toggle("show");

    if (searchBar.classList.contains("show") && searchInput) {
      searchInput.focus();
    }
  });
}

applyFilters();