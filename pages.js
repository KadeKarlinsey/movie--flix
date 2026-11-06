// ------------------------------------------------------------
// Pages: Home, Search results, Movie details
// ------------------------------------------------------------

// ---------- Hero banner (random featured title) ----------
function Hero() {
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    if (!MovieAPI.hasKey()) return;
    let cancelled = false;
    const ids = window.APP_CONFIG.FEATURED_IDS;
    const id = ids[Math.floor(Math.random() * ids.length)];
    MovieAPI.getMovie(id)
      .then((m) => { if (!cancelled) setMovie(m); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!movie) {
    return html`<section className="hero hero-empty"><div className="hero-content">
      <h1>Unlimited movies, series and more.</h1>
      <p>Search any title or browse the rows below.</p>
    </div></section>`;
  }

  const bg = bigPoster(movie.Poster, 1200);
  return html`
    <section className="hero">
      ${bg ? html`<div className="hero-bg" style=${{ backgroundImage: "url(" + bg + ")" }}></div>` : null}
      <div className="hero-shade"></div>
      <div className="hero-content">
        <h1>${movie.Title}</h1>
        <p className="hero-meta">${movie.Year} · ${movie.Rated} · ${movie.Runtime} · IMDb ${movie.imdbRating}</p>
        <p className="hero-plot">${movie.Plot}</p>
        <a className="btn btn-primary" href=${"#/movie/" + movie.imdbID}>More Info</a>
      </div>
    </section>
  `;
}

// ---------- One homepage row (fetches its own data) ----------
function HomeRow({ row, filters }) {
  const [state, setState] = useState({ loading: true, items: [], error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, items: [], error: null });
    MovieAPI.searchMovies(row.query, { type: filters.type, year: filters.year })
      .then((res) => { if (!cancelled) setState({ loading: false, items: res.items, error: null }); })
      .catch((err) => { if (!cancelled) setState({ loading: false, items: [], error: err }); });
    return () => { cancelled = true; };
  }, [row.query, filters.type, filters.year]);

  if (state.error && state.error.code === "NO_KEY") return null; // banner covers this
  if (state.loading) {
    return html`<section className="row"><h2 className="row-title">${row.title}</h2><${Spinner} /></section>`;
  }
  if (state.error) {
    return html`<section className="row"><h2 className="row-title">${row.title}</h2><p className="row-error">${errorText(state.error)}</p></section>`;
  }
  if (state.items.length === 0) return null;

  return html`<${MovieRow} title=${row.title} items=${sortItems(state.items, filters.sort)} />`;
}

// ---------- Home ----------
function HomePage({ filters, onFilters }) {
  return html`
    <main>
      <${Hero} />
      <div className="content">
        ${MovieAPI.hasKey() ? null : html`<${KeyBanner} />`}
        <${FilterBar} filters=${filters} onChange=${onFilters} />
        ${window.APP_CONFIG.HOME_ROWS.map((row) => html`<${HomeRow} key=${row.query} row=${row} filters=${filters} />`)}
      </div>
    </main>
  `;
}

// ---------- Search results ----------
function SearchPage({ query, filters, onFilters }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New query or filters: start again at page 1
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(1);
    MovieAPI.searchMovies(query, { type: filters.type, year: filters.year, page: 1 })
      .then((res) => { if (!cancelled) { setItems(res.items); setTotal(res.total); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setItems([]); setTotal(0); setError(err); setLoading(false); } });
    return () => { cancelled = true; };
  }, [query, filters.type, filters.year]);

  const loadMore = () => {
    const next = page + 1;
    setLoading(true);
    MovieAPI.searchMovies(query, { type: filters.type, year: filters.year, page: next })
      .then((res) => {
        // avoid duplicate ids if the API repeats an item
        setItems((prev) => {
          const seen = new Set(prev.map((m) => m.imdbID));
          return prev.concat(res.items.filter((m) => !seen.has(m.imdbID)));
        });
        setPage(next);
        setLoading(false);
      })
      .catch((err) => { setError(err); setLoading(false); });
  };

  const sorted = sortItems(items, filters.sort);
  const canLoadMore = items.length < total && !loading;

  return html`
    <main className="content page-top">
      <h1 className="page-title">Results for “${query}”</h1>
      ${total > 0 ? html`<p className="page-sub">${total} titles found</p>` : null}
      <${FilterBar} filters=${filters} onChange=${onFilters} />

      ${error && error.code === "NO_KEY" ? html`<${KeyBanner} />` : null}
      ${error && error.code !== "NO_KEY"
        ? html`<${Message} title="Oops">${errorText(error)}<//>`
        : null}

      ${!error && !loading && items.length === 0
        ? html`<${Message} title="No results">We couldn't find anything for “${query}”. Try a different title or clear the filters.<//>`
        : null}

      <div className="grid">
        ${sorted.map((m) => html`<${MovieCard} key=${m.imdbID} movie=${m} />`)}
      </div>

      ${loading ? html`<${Spinner} />` : null}
      ${canLoadMore
        ? html`<div className="center"><button className="btn btn-primary" onClick=${loadMore}>Load more</button></div>`
        : null}
    </main>
  `;
}

// ---------- Movie details ----------
function DetailsPage({ id }) {
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setMovie(null);
    setError(null);
    window.scrollTo(0, 0);
    MovieAPI.getMovie(id)
      .then((m) => { if (!cancelled) setMovie(m); })
      .catch((err) => { if (!cancelled) setError(err); });
    return () => { cancelled = true; };
  }, [id]);

  if (error) {
    return html`<main className="content page-top"><${Message}
      title="Couldn't load this title"
      action=${html`<a className="btn btn-primary" href="#/">Back to home</a>`}
    >${errorText(error)}<//></main>`;
  }
  if (!movie) return html`<main className="content page-top"><${Spinner} label="Loading details..." /></main>`;

  const poster = bigPoster(movie.Poster, 700);
  const genres = (movie.Genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const facts = [
    ["Director", movie.Director],
    ["Writer", movie.Writer],
    ["Cast", movie.Actors],
    ["Language", movie.Language],
    ["Country", movie.Country],
    ["Awards", movie.Awards],
    ["Box office", movie.BoxOffice]
  ].filter(([, v]) => v && v !== "N/A");

  return html`
    <main className="details">
      ${poster ? html`<div className="details-bg" style=${{ backgroundImage: "url(" + poster + ")" }}></div>` : null}
      <div className="details-shade"></div>

      <div className="details-inner">
        <button className="btn btn-ghost back" onClick=${() => (window.history.length > 1 ? window.history.back() : (window.location.hash = "#/"))}>← Back</button>

        <div className="details-layout">
          <div className="details-poster">
            ${poster
              ? html`<img src=${poster} alt=${movie.Title + " poster"} />`
              : html`<div className="card-noposter big"><span>${movie.Title}</span></div>`}
          </div>

          <div className="details-info">
            <h1>${movie.Title}</h1>
            <p className="details-meta">
              ${[movie.Year, movie.Rated, movie.Runtime].filter((v) => v && v !== "N/A").join(" · ")}
            </p>

            <div className="chips">
              ${genres.map((g) => html`<span className="chip" key=${g}>${g}</span>`)}
            </div>

            <div className="ratings">
              ${movie.imdbRating && movie.imdbRating !== "N/A"
                ? html`<div className="rating"><strong>★ ${movie.imdbRating}</strong><span>IMDb</span></div>`
                : null}
              ${(movie.Ratings || [])
                .filter((r) => r.Source !== "Internet Movie Database")
                .map((r) => html`<div className="rating" key=${r.Source}><strong>${r.Value}</strong><span>${r.Source}</span></div>`)}
            </div>

            <p className="details-plot">${movie.Plot !== "N/A" ? movie.Plot : "No plot available."}</p>

            <dl className="facts">
              ${facts.map(([k, v]) => html`<div key=${k}><dt>${k}</dt><dd>${v}</dd></div>`)}
            </dl>

            <a className="btn btn-primary" href=${"https://www.imdb.com/title/" + movie.imdbID + "/"} target="_blank" rel="noopener noreferrer">View on IMDb</a>
          </div>
        </div>
      </div>
    </main>
  `;
}
