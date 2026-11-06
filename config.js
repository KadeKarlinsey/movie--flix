// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------
window.APP_CONFIG = {
  OMDB_API_KEY: "62d0f8d5",
  OMDB_BASE_URL: "https://www.omdbapi.com/",
  SITE_NAME: "MOVIEFLIX",

  // Movies shown as rows on the homepage //
  HOME_ROWS: [
    { title: "Superhero Blockbusters", query: "avengers" },
    { title: "A Galaxy Far, Far Away", query: "star wars" },
    { title: "The Dark Knight Universe", query: "batman" },
    { title: "Wizarding World", query: "harry potter" },
    { title: "Epic Adventures", query: "lord of the rings" },
    { title: "Sci-Fi Favorites", query: "matrix" },
  ],

  // Featured titles for the hero banner (random one is picked on load).
  FEATURED_IDS: [
    "tt0816692",
    "tt1375666",
    "tt0468569",
    "tt0133093",
    "tt0120737",
    "tt4154796",
  ],
};
