// ------------------------------------------------------------
// Reusable React components
// ------------------------------------------------------------
const html = htm.bind(React.createElement);
const { useState, useEffect, useRef } = React;

// ---------- helpers ----------
function hasPoster(poster) {
  return poster && poster !== "N/A";
}

// OMDb posters come as ..._SX300.jpg; ask for a bigger version when we can.
function bigPoster(poster, size) {
  if (!hasPoster(poster)) return null;
  return poster.replace(/_SX\d+/, "_SX" + (size || 700));
}

function sortItems(items, sort) {
  const list = items.slice();
  const year = (m) => parseInt(m.Year, 10) || 0;
  switch (sort) {
    case "year-desc": return list.sort((a, b) => year(b) - year(a));
    case "year-asc":  return list.sort((a, b) => year(a) - year(b));
    case "title-asc": return list.sort((a, b) => a.Title.localeCompare(b.Title));
    case "title-desc": return list.sort((a, b) => b.Title.localeCompare(a.Title));
    default: return list;
  }
}

function errorText(err) {
  if (err && err.code === "NO_KEY") {
    return "Add your free OMDb API key in config.js to load movies.";
  }
  if (err && err.code === "BAD_KEY") {
    return "The OMDb API key looks invalid. Check the key in config.js.";
  }
  return (err && err.message) || "Something went wrong.";
}

// ---------- Navbar ----------
function Navbar({ query, onSearch, onNavType, activeType }) {
  const [text, setText] = useState(query || "");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setText(query || ""), [query]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const q = text.trim();
    if (q) onSearch(q);
  };

  const link = (label, type) => html`
    <button
      className=${"nav-link" + (activeType === type ? " active" : "")}
      onClick=${() => onNavType(type)}
    >${label}</button>
  `;

  return html`
    <header className=${"navbar" + (scrolled ? " navbar-solid" : "")}>
      <div className="navbar-inner">
        <a className="logo" href="#/">${window.APP_CONFIG.SITE_NAME}</a>

        <nav className="nav-links" aria-label="Main">
          ${link("Home", "")}
          ${link("Movies", "movie")}
          ${link("TV Series", "series")}
        </nav>

        <form className="search" onSubmit=${submit} role="search">
          <input
            type="search"
            placeholder="Search titles..."
            value=${text}
            onChange=${(e) => setText(e.target.value)}
            aria-label="Search movies"
          />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
        </form>
      </div>
    </header>
  `;
}

// ---------- Footer ----------
function Footer() {
  return html`
    <footer className="footer">
      <div className="footer-inner">
        <a className="logo logo-small" href="#/">${window.APP_CONFIG.SITE_NAME}</a>
        <p>Movie data provided by <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">OMDb API</a>. This is a student project and is not affiliated with Netflix.</p>
        <p className="footer-copy">© ${new Date().getFullYear()} MovieFlix</p>
      </div>
    </footer>
  `;
}

// ---------- Small UI pieces ----------
function Spinner({ label }) {
  return html`
    <div className="spinner-wrap" role="status">
      <div className="spinner"></div>
      <span>${label || "Loading..."}</span>
    </div>
  `;
}

function Message({ title, children, action }) {
  return html`
    <div className="message">
      <h2>${title}</h2>
      <p>${children}</p>
      ${action}
    </div>
  `;
}

function KeyBanner() {
  return html`
    <div className="key-banner">
      <strong>One quick step:</strong> open <code>config.js</code> and paste your free key from
      <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer">omdbapi.com/apikey.aspx</a>.
    </div>
  `;
}

// ---------- Movie card ----------
function MovieCard({ movie }) {
  const poster = hasPoster(movie.Poster) ? movie.Poster : null;
  return html`
    <a className="card" href=${"#/movie/" + movie.imdbID} title=${movie.Title}>
      ${poster
        ? html`<img src=${poster} alt=${movie.Title + " poster"} loading="lazy" />`
        : html`<div className="card-noposter"><span>${movie.Title}</span></div>`}
      <div className="card-overlay">
        <h3>${movie.Title}</h3>
        <p>${movie.Year} · ${movie.Type}</p>
      </div>
    </a>
  `;
}

// ---------- Horizontal row (Netflix style) ----------
function MovieRow({ title, items }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return html`
    <section className="row">
      <h2 className="row-title">${title}</h2>
      <div className="row-wrap">
        <button className="row-arrow left" onClick=${() => scroll(-1)} aria-label="Scroll left">‹</button>
        <div className="row-track" ref=${trackRef}>
          ${items.map((m) => html`<${MovieCard} key=${m.imdbID} movie=${m} />`)}
        </div>
        <button className="row-arrow right" onClick=${() => scroll(1)} aria-label="Scroll right">›</button>
      </div>
    </section>
  `;
}

// ---------- Filter / sort bar ----------
function FilterBar({ filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return html`
    <div className="filters" role="group" aria-label="Filter and sort">
      <label>
        <span>Type</span>
        <select value=${filters.type} onChange=${set("type")}>
          <option value="">All</option>
          <option value="movie">Movies</option>
          <option value="series">TV Series</option>
          <option value="episode">Episodes</option>
        </select>
      </label>

      <label>
        <span>Year</span>
        <input
          type="number"
          min="1900"
          max="2100"
          placeholder="Any"
          value=${filters.year}
          onChange=${set("year")}
        />
      </label>

      <label>
        <span>Sort by</span>
        <select value=${filters.sort} onChange=${set("sort")}>
          <option value="relevance">Relevance</option>
          <option value="year-desc">Year: newest first</option>
          <option value="year-asc">Year: oldest first</option>
          <option value="title-asc">Title: A to Z</option>
          <option value="title-desc">Title: Z to A</option>
        </select>
      </label>

      <button
        className="btn btn-ghost"
        onClick=${() => onChange({ type: "", year: "", sort: "relevance" })}
      >Reset</button>
    </div>
  `;
}
