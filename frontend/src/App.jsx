import { useEffect, useState } from "react";

import {
  searchTerm,
  searchAnd,
  searchOr,
  searchPhrase,
  searchNear,
  getStats,
  getDocument,
} from "./api";

const SEARCH_TYPES = {
  term: "Single Term",
  and: "AND",
  or: "OR",
  phrase: "Exact Phrase",
  near: "NEAR",
};

function App() {
  const [searchType, setSearchType] = useState("term");
  const [query, setQuery] = useState("");
  const [nearDistance, setNearDistance] = useState(3);

  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  async function handleSearch(event) {
    event?.preventDefault();

    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      let data;

      if (searchType === "term") {
        data = await searchTerm(query.trim());
      } else if (searchType === "phrase") {
        data = await searchPhrase(query.trim());
      } else {
        const parts = query
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        if (parts.length !== 2) {
          throw new Error(
            "Enter exactly two terms separated by a comma. Example: भारत, हिंदी"
          );
        }

        if (searchType === "and") {
          data = await searchAnd(parts[0], parts[1]);
        } else if (searchType === "or") {
          data = await searchOr(parts[0], parts[1]);
        } else if (searchType === "near") {
          data = await searchNear(
            parts[0],
            parts[1],
            Number(nearDistance)
          );
        }
      }

      setResults(data.results || []);

      addToHistory({
        type: SEARCH_TYPES[searchType],
        query: query.trim(),
        count: data.count || 0,
        time: data.searchTimeMs || 0,
      });
    } catch (err) {
      setResults([]);
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function addToHistory(item) {
    setHistory((previous) => {
      const updated = [item, ...previous];

      // Keep only the latest 8 searches.
      return updated.slice(0, 8);
    });
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
  }

  async function openDocument(docId) {
    setDocumentLoading(true);
    setError("");

    try {
      const data = await getDocument(docId);
      setSelectedDocument(data);
    } catch (err) {
      setError(err.message || "Failed to load document.");
    } finally {
      setDocumentLoading(false);
    }
  }

  function closeDocument() {
    setSelectedDocument(null);
  }

  function useHistoryItem(item) {
    setQuery(item.query);

    if (item.type === "Single Term") {
      setSearchType("term");
    } else if (item.type === "AND") {
      setSearchType("and");
    } else if (item.type === "OR") {
      setSearchType("or");
    } else if (item.type === "Exact Phrase") {
      setSearchType("phrase");
    } else if (item.type === "NEAR") {
      setSearchType("near");
    }
  }

  return (
    <div className="app-shell">

      {/* HEADER */}
      <header className="topbar">
        <div>
          <div className="brand">
            Hindi<span>IR</span>
          </div>

          <p className="subtitle">
            Positional Inverted Index Search Engine
          </p>
        </div>

        <div className="header-badge">
          Java + React
        </div>
      </header>


      <main className="main-container">

        {/* HERO */}
        <section className="hero-section">
          <div>
            <p className="eyebrow">INFORMATION RETRIEVAL</p>

            <h1>
              Search Hindi documents
              <br />
              using a positional index.
            </h1>

            <p className="hero-description">
              Search through 10,000 Hindi documents using term,
              Boolean, phrase and proximity queries.
            </p>
          </div>
        </section>


        {/* SEARCH CARD */}
        <section className="search-card">

          <div className="search-header">
            <div>
              <h2>Search</h2>

              <p>
                Choose a retrieval operation and enter your query.
              </p>
            </div>

            {searched && (
              <button
                className="clear-button"
                onClick={clearSearch}
              >
                Clear
              </button>
            )}
          </div>


          <form onSubmit={handleSearch}>

            <div className="search-controls">

              <div className="control-group">
                <label>Search Type</label>

                <select
                  value={searchType}
                  onChange={(event) =>
                    setSearchType(event.target.value)
                  }
                >
                  <option value="term">
                    Single Term
                  </option>

                  <option value="and">
                    AND
                  </option>

                  <option value="or">
                    OR
                  </option>

                  <option value="phrase">
                    Exact Phrase
                  </option>

                  <option value="near">
                    NEAR
                  </option>
                </select>
              </div>


              <div className="control-group query-control">
                <label>
                  {searchType === "phrase"
                    ? "Phrase"
                    : searchType === "term"
                    ? "Term"
                    : "Two terms"}
                </label>

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder={
                    searchType === "term"
                      ? "Example: भारत"
                      : searchType === "phrase"
                      ? "Example: भारत की राजधानी"
                      : "Example: भारत, हिंदी"
                  }
                />
              </div>


              {searchType === "near" && (
                <div className="control-group distance-control">
                  <label>Distance</label>

                  <input
                    type="number"
                    min="1"
                    value={nearDistance}
                    onChange={(event) =>
                      setNearDistance(event.target.value)
                    }
                  />
                </div>
              )}


              <button
                className="search-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </button>

            </div>

          </form>


          <div className="query-help">
            {searchType === "term" &&
              "Find documents containing one term."}

            {searchType === "and" &&
              "Find documents containing both terms."}

            {searchType === "or" &&
              "Find documents containing either term."}

            {searchType === "phrase" &&
              "Find an exact sequence of terms."}

            {searchType === "near" &&
              `Find terms occurring within ${nearDistance} positions.`}
          </div>

        </section>


        {/* ERROR */}
        {error && (
          <div className="error-box">
            <strong>Error:</strong> {error}
          </div>
        )}


        {/* STATISTICS */}
        <section className="stats-grid">

          <StatCard
            label="Documents"
            value={stats?.documents ?? "—"}
          />

          <StatCard
            label="Unique Terms"
            value={stats?.uniqueTerms ?? "—"}
          />

          <StatCard
            label="Indexed Positions"
            value={stats?.totalPositions ?? "—"}
          />

          <StatCard
            label="Indexing Time"
            value={
              stats
                ? `${stats.indexingTimeMs} ms`
                : "—"
            }
          />

        </section>


        {/* RESULTS */}
        <section className="results-section">

          <div className="section-heading">

            <div>
              <h2>Search Results</h2>

              <p>
                {searched
                  ? `${results.length} matching documents`
                  : "Results will appear here"}
              </p>
            </div>

            {searched && results.length > 0 && (
              <div className="result-time">
                Search completed
              </div>
            )}

          </div>


          {loading && (
            <div className="state-card">
              <div className="loader"></div>
              <p>Searching the positional index...</p>
            </div>
          )}


          {!loading && !searched && (
            <div className="state-card">
              <div className="state-icon">⌕</div>

              <h3>Ready to search</h3>

              <p>
                Enter a Hindi term or query above to search
                the indexed documents.
              </p>
            </div>
          )}


          {!loading &&
            searched &&
            results.length === 0 &&
            !error && (
              <div className="state-card">
                <div className="state-icon">∅</div>

                <h3>No results found</h3>

                <p>
                  Try another term, phrase or search operation.
                </p>
              </div>
            )}


          {!loading && results.length > 0 && (
            <div className="results-list">

              {results.map((result) => (
                <article
                  className="result-card"
                  key={result.docId}
                >

                  <div className="result-top">

                    <div>
                      <span className="doc-badge">
                        DOC {result.docId}
                      </span>

                      <span className="position-badge">
                        {result.positions.length}{" "}
                        position
                        {result.positions.length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    <button
                      className="view-button"
                      onClick={() =>
                        openDocument(result.docId)
                      }
                    >
                      View Document
                    </button>

                  </div>


                  <p className="result-text">
                    {result.text}
                  </p>


                  <div className="positions-row">

                    <span className="positions-label">
                      Positions:
                    </span>

                    <div className="position-list">
                      {result.positions
                        .slice(0, 20)
                        .map((position) => (
                          <span
                            className="position-chip"
                            key={position}
                          >
                            {position}
                          </span>
                        ))}

                      {result.positions.length > 20 && (
                        <span className="more-positions">
                          +{result.positions.length - 20} more
                        </span>
                      )}
                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>


        {/* SEARCH HISTORY */}
        {history.length > 0 && (
          <section className="history-section">

            <div className="section-heading">

              <div>
                <h2>Recent Searches</h2>

                <p>
                  Your latest queries from this session.
                </p>
              </div>

            </div>


            <div className="history-list">

              {history.map((item, index) => (
                <button
                  className="history-item"
                  key={`${item.query}-${index}`}
                  onClick={() => useHistoryItem(item)}
                >
                  <div>
                    <span className="history-type">
                      {item.type}
                    </span>

                    <span className="history-query">
                      {item.query}
                    </span>
                  </div>

                  <span className="history-count">
                    {item.count} results
                  </span>
                </button>
              ))}

            </div>

          </section>
        )}


        {/* ABOUT INDEX */}
        <section className="about-section">

          <div>
            <p className="eyebrow">HOW IT WORKS</p>

            <h2>
              Positional Inverted Index
            </h2>

            <p>
              Every document is tokenized and each term is
              stored together with the document IDs and the
              positions where the term occurs.
            </p>
          </div>


          <div className="index-flow">

            <div className="flow-step">
              <span>01</span>
              <strong>Documents</strong>
              <small>Hindi corpus</small>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <span>02</span>
              <strong>Tokenizer</strong>
              <small>Terms + positions</small>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <span>03</span>
              <strong>Index</strong>
              <small>Inverted structure</small>
            </div>

            <div className="flow-arrow">→</div>

            <div className="flow-step">
              <span>04</span>
              <strong>Search</strong>
              <small>IR operations</small>
            </div>

          </div>

        </section>

      </main>


      {/* DOCUMENT MODAL */}
      {selectedDocument && (
        <div
          className="modal-overlay"
          onClick={closeDocument}
        >

          <div
            className="document-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="doc-badge">
                  DOC {selectedDocument.docId}
                </span>

                <h2>Document Viewer</h2>
              </div>

              <button
                className="close-button"
                onClick={closeDocument}
              >
                ×
              </button>

            </div>


            {documentLoading ? (
              <div className="modal-loading">
                Loading document...
              </div>
            ) : (
              <div className="document-content">
                {selectedDocument.text}
              </div>
            )}

          </div>

        </div>
      )}


      {/* FOOTER */}
      <footer className="footer">

        <span>
          Hindi Information Retrieval System
        </span>

        <span>
          Positional Inverted Index · Java · React
        </span>

      </footer>

    </div>
  );
}


function StatCard({ label, value }) {
  return (
    <div className="stat-card">

      <span className="stat-label">
        {label}
      </span>

      <strong className="stat-value">
        {value}
      </strong>

    </div>
  );
}


export default App;