import { useEffect, useState } from "react";

import {
  searchTerm,
  searchAnd,
  searchOr,
  searchPhrase,
  searchNear,
  getStats,
} from "./api";

function App() {
  const [searchType, setSearchType] = useState("term");

  const [query, setQuery] = useState("");

  const [nearDistance, setNearDistance] = useState(3);

  const [results, setResults] = useState([]);

  const [resultCount, setResultCount] = useState(0);

  const [searchTime, setSearchTime] = useState(null);

  const [searched, setSearched] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    documents: 0,
    uniqueTerms: 0,
    totalPositions: 0,
    indexingTimeMs: 0,
  });


  /*
   * Load backend statistics
   * when the React application starts.
   */

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();

        setStats(data);

      } catch (err) {
        console.error("Could not load backend stats:", err);
      }
    }

    loadStats();
  }, []);


  /*
   * Split input for AND / OR / NEAR searches.
   *
   * Example:
   *
   * भारत, हिंदी
   *
   * becomes:
   *
   * ["भारत", "हिंदी"]
   */

  function getTwoTerms() {
    const parts = query
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length !== 2) {
      throw new Error(
        "Enter exactly two terms separated by a comma."
      );
    }

    return parts;
  }


  /*
   * Perform search.
   */

  async function handleSearch(event) {
    event.preventDefault();

    setError("");

    setResults([]);

    setSearched(false);

    if (!query.trim()) {
      setError("Please enter a search query.");

      return;
    }

    setLoading(true);

    try {
      let data;


      if (searchType === "term") {

        data = await searchTerm(query.trim());

      }


      else if (searchType === "and") {

        const [term1, term2] = getTwoTerms();

        data = await searchAnd(term1, term2);

      }


      else if (searchType === "or") {

        const [term1, term2] = getTwoTerms();

        data = await searchOr(term1, term2);

      }


      else if (searchType === "phrase") {

        data = await searchPhrase(query.trim());

      }


      else if (searchType === "near") {

        const [term1, term2] = getTwoTerms();

        data = await searchNear(
          term1,
          term2,
          nearDistance
        );

      }


      setResults(data.results || []);

      setResultCount(data.count || 0);

      setSearchTime(data.searchTimeMs);

      setSearched(true);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }


  function getPlaceholder() {

    switch (searchType) {

      case "and":
        return "भारत, हिंदी";

      case "or":
        return "भारत, हिंदी";

      case "phrase":
        return "भारत की राजधानी";

      case "near":
        return "भारत, दिल्ली";

      default:
        return "भारत";
    }
  }


  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="header-inner">

          <div className="logo-section">

            <div className="logo">
              IR
            </div>

            <div>

              <h1 className="logo-title">
                Hindi IR Search
              </h1>

              <p className="logo-subtitle">
                Positional Inverted Index
              </p>

            </div>

          </div>


          <div className="backend-status">

            <span className="status-dot"></span>

            Java Backend :8080

          </div>

        </div>

      </header>


      {/* MAIN */}

      <main className="main">

        {/* HERO */}

        <section className="hero">

          <h1>
            Search Hindi Documents
          </h1>

          <p>
            Search a 10,000-document Hindi corpus
            using a positional inverted index built
            from scratch in Java.
          </p>

        </section>


        {/* SEARCH */}

        <section className="search-panel">

          <form onSubmit={handleSearch}>

            <div className="search-row">

              <select
                className="search-type"
                value={searchType}
                onChange={(event) => {
                  setSearchType(event.target.value);
                  setResults([]);
                  setError("");
                  setSearched(false);
                }}
              >

                <option value="term">
                  Term
                </option>

                <option value="and">
                  AND
                </option>

                <option value="or">
                  OR
                </option>

                <option value="phrase">
                  Phrase
                </option>

                <option value="near">
                  NEAR
                </option>

              </select>


              <input
                className="search-input"
                type="text"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder={getPlaceholder()}
                lang="hi"
              />


              <button
                className="search-button"
                type="submit"
                disabled={loading}
              >

                {loading ? "Searching..." : "Search"}

              </button>

            </div>


            {searchType === "near" && (

              <div className="near-controls">

                <span>
                  Maximum distance:
                </span>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={nearDistance}
                  onChange={(event) =>
                    setNearDistance(event.target.value)
                  }
                />

                <span>
                  positions
                </span>

              </div>

            )}

          </form>

        </section>


        {/* ERROR */}

        {error && (

          <div
            style={{
              marginTop: "15px",
              padding: "13px 15px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >

            {error}

          </div>

        )}


        {/* STATS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-label">
              Documents
            </div>

            <div className="stat-value">
              {stats.documents.toLocaleString()}
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Unique Terms
            </div>

            <div className="stat-value">
              {stats.uniqueTerms.toLocaleString()}
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Total Positions
            </div>

            <div className="stat-value">
              {stats.totalPositions.toLocaleString()}
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Index Time
            </div>

            <div className="stat-value">
              {stats.indexingTimeMs} ms
            </div>

          </div>

        </section>


        {/* RESULTS + INFO */}

        <section className="content-grid">

          <div className="results-panel">

            <div className="panel-header">

              <h2>
                Search Results
              </h2>

              <span className="result-count">

                {searched
                  ? `${resultCount.toLocaleString()} documents`
                  : "No search yet"}

              </span>

            </div>


            {!searched && (

              <div className="empty-state">

                <div className="empty-icon">
                  🔎
                </div>

                <h3>
                  Start searching
                </h3>

                <p>
                  Enter a Hindi term, phrase, or
                  proximity query to search the corpus.
                </p>

              </div>

            )}


            {searched && results.length === 0 && !error && (

              <div className="empty-state">

                <div className="empty-icon">
                  🔍
                </div>

                <h3>
                  No results found
                </h3>

                <p>
                  No documents matched your query.
                </p>

              </div>

            )}


            {results.map((result) => (

              <article
                className="result-card"
                key={result.docId}
              >

                <div className="result-top">

                  <span className="doc-id">
                    DOC {result.docId}
                  </span>

                  <span className="position-badge">

                    Positions:{" "}
                    {result.positions.join(", ")}

                  </span>

                </div>


                <p
                  className="result-text"
                  lang="hi"
                >
                  {result.text}
                </p>

              </article>

            ))}

          </div>


          {/* INFORMATION */}

          <aside className="info-panel">

            <div className="panel-header">

              <h2>
                Search Information
              </h2>

            </div>


            <div className="info-content">

              {searched ? (

                <>
                  <h3>
                    Query Details
                  </h3>

                  <p>
                    Type: <strong>{searchType}</strong>
                  </p>

                  <p>
                    Query: <strong>{query}</strong>
                  </p>

                  {searchTime !== null && (

                    <p>
                      Search time:{" "}
                      <strong>
                        {searchTime} ms
                      </strong>
                    </p>

                  )}

                  <div className="search-types">

                    <span className="type-badge">
                      {resultCount} Results
                    </span>

                    <span className="type-badge">
                      Positional
                    </span>

                  </div>
                </>

              ) : (

                <>
                  <h3>
                    Positional Inverted Index
                  </h3>

                  <p>
                    Each term is associated with the
                    documents in which it occurs and
                    the positions where it occurs.
                  </p>

                  <div className="search-types">

                    <span className="type-badge">
                      Term
                    </span>

                    <span className="type-badge">
                      AND
                    </span>

                    <span className="type-badge">
                      OR
                    </span>

                    <span className="type-badge">
                      Phrase
                    </span>

                    <span className="type-badge">
                      NEAR
                    </span>

                  </div>
                </>

              )}

            </div>

          </aside>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="footer">

        Hindi Information Retrieval System ·
        Java Positional Index + React

      </footer>

    </div>
  );
}

export default App;