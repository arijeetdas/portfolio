const filterButtons = document.querySelectorAll(".filter-btn");
const appCards = document.querySelectorAll(".app-card");
const searchInput = document.getElementById("search-input");
const searchToggle = document.getElementById("search-toggle");
const searchBar = document.getElementById("search-bar");

let activeFilter = "all";

/* APPLY FILTERS */
function applyFilters() {
  const query = searchInput.value.toLowerCase();

  appCards.forEach(card => {
    const platform = card.dataset.platform;
    const name = card.dataset.name;

    const matchesPlatform =
      activeFilter === "all" || platform === activeFilter;
    const matchesSearch = name.includes(query);

    card.style.display =
      matchesPlatform && matchesSearch ? "flex" : "none";
  });
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
searchInput.addEventListener("input", applyFilters);

/* Mobile search toggle */
searchToggle.addEventListener("click", () => {
  searchBar.classList.toggle("show");

  if (searchBar.classList.contains("show")) {
    searchInput.focus();
  }
});