// ------------------------------------------------------------
// Root app: simple hash router + shared filter state
//   #/                -> home
//   #/search/<query>  -> search results
//   #/movie/<imdbID>  -> movie details
// ------------------------------------------------------------
function parseRoute(hash) {
  const path = (hash || "").replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "search" && parts[1]) {
    return { name: "search", query: decodeURIComponent(parts.slice(1).join("/")) };
  }
  if (parts[0] === "movie" && parts[1]) {
    return { name: "movie", id: parts[1] };
  }
  return { name: "home" };
}

function useRoute() {
  const [route, setRoute] = useState(parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

function App() {
  const route = useRoute();
  const [filters, setFilters] = useState({ type: "", year: "", sort: "relevance" });

  // Jump to top when moving between list pages
  useEffect(() => {
    if (route.name !== "movie") window.scrollTo(0, 0);
  }, [route.name, route.query]);

  const goSearch = (q) => { window.location.hash = "#/search/" + encodeURIComponent(q); };

  const goType = (type) => {
    setFilters((f) => ({ ...f, type }));
    window.location.hash = "#/";
  };

  let page;
  if (route.name === "search") {
    page = html`<${SearchPage} query=${route.query} filters=${filters} onFilters=${setFilters} />`;
  } else if (route.name === "movie") {
    page = html`<${DetailsPage} id=${route.id} />`;
  } else {
    page = html`<${HomePage} filters=${filters} onFilters=${setFilters} />`;
  }

  return html`
    <div className="app">
      <${Navbar}
        query=${route.name === "search" ? route.query : ""}
        onSearch=${goSearch}
        onNavType=${goType}
        activeType=${route.name === "home" ? filters.type : null}
      />
      ${page}
      <${Footer} />
    </div>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
