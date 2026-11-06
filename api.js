// ------------------------------------------------------------
// OMDb API helper
// Docs: https://www.omdbapi.com/
// ------------------------------------------------------------
(function () {
  const cfg = window.APP_CONFIG;

  function hasKey() {
    return Boolean(cfg.OMDB_API_KEY) && cfg.OMDB_API_KEY !== "YOUR_API_KEY_HERE";
  }

  async function request(params) {
    if (!hasKey()) {
      const err = new Error("Missing OMDb API key.");
      err.code = "NO_KEY";
      throw err;
    }

    const query = new URLSearchParams({ apikey: cfg.OMDB_API_KEY });
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });

    let response;
    try {
      response = await fetch(cfg.OMDB_BASE_URL + "?" + query.toString());
    } catch (e) {
      const err = new Error("Network error. Check your internet connection.");
      err.code = "NETWORK";
      throw err;
    }

    if (!response.ok) {
      const err = new Error("The movie service returned an error (" + response.status + ").");
      err.code = response.status === 401 ? "BAD_KEY" : "HTTP";
      throw err;
    }
    return response.json();
  }

  // Search by title. Returns { items: [...], total: number }
  async function searchMovies(query, options) {
    const opts = options || {};
    const data = await request({
      s: query,
      page: opts.page || 1,
      type: opts.type,
      y: opts.year
    });

    if (data.Response === "False") {
      if (/not found/i.test(data.Error || "")) {
        return { items: [], total: 0 };
      }
      const err = new Error(data.Error || "Something went wrong.");
      err.code = /api key/i.test(data.Error || "") ? "BAD_KEY" : "API";
      throw err;
    }

    return {
      items: data.Search || [],
      total: parseInt(data.totalResults, 10) || 0
    };
  }

  // Full details for one title by IMDb id (e.g. "tt0133093")
  async function getMovie(imdbID) {
    const data = await request({ i: imdbID, plot: "full" });
    if (data.Response === "False") {
      const err = new Error(data.Error || "Movie not found.");
      err.code = "API";
      throw err;
    }
    return data;
  }

  window.MovieAPI = { hasKey, searchMovies, getMovie };
})();
