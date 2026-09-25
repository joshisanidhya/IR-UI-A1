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

const RESULTS_PER_PAGE = 5;

const HINDI_SUGGESTIONS = [
  "भारत",
  "हिंदी",
  "दिल्ली",
  "सरकार",
  "शिक्षा",
  "स्वास्थ्य",
  "जलवायु",
  "विज्ञान",
  "तकनीक",
  "अर्थव्यवस्था",
  "कृषि",
  "पर्यावरण",
  "समाचार",
  "खेल",
  "कोरोना",
  "प्रौद्योगिकी",
  "विश्वविद्यालय",
  "राष्ट्र",
  "समाज",
  "विकास",
];

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

  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1);

      addToHistory({
        type: SEARCH_TYPES[searchType],
        query: query.trim(),
        count: data.count || 0,
        time: data.searchTimeMs || 0,
      });
    } catch (err) {
      setResults([]);
      setCurrentPage(1);
      setError(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  function addToHistory(item) {
    setHistory((previous) => {
      const updated = [item, ...previous];

      return updated.slice(0, 8);
    });
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
    setCurrentPage(1);
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

    setError("");
  }

  function useSuggestion(suggestion) {
    setQuery(suggestion);
    setSearchType("term");
    setError("");
    setSearched(false);
    setResults([]);
    setCurrentPage(1);
  }

  function getPreview(text, maxLength = 280) {
    if (!text) {
      return "";
    }

    if (text.length <= maxLength) {
      return text;
    }

    return text.slice(0, maxLength).trim() + "...";
  }

  const totalPages = Math.ceil(
    results.length / RESULTS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) * RESULTS_PER_PAGE;

  const paginatedResults = results.slice(
    startIndex,
    startIndex + RESULTS_PER_PAGE
  );

  function getVisiblePages() {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages = new Set([
      1,
      2,
      totalPages - 1,
      totalPages,
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ]);

    return Array.from(pages)
      .filter(
        (page) => page >= 1 && page <= totalPages
      )
      .sort((a, b) => a - b);
  }

  const visiblePages = getVisiblePages();

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
            <p className="eyebrow">
              INFORMATION RETRIEVAL
            </p>

            <h1>
              Search Hindi documents
              <br />
              using a positional index.
            </h1>

            <p className="hero-description">
              Search through 10,000 Hindi documents using
              term, Boolean, phrase and proximity queries.
            </p>
          </div>

        </section>


        {/* SEARCH CARD */}
        <section className="search-card">

          <div className="search-header">

            <div>
              <h2>Search</h2>

              <p>
                Choose a retrieval operation and enter
                your query.
              </p>
            </div>

            {searched && (
              <button
                className="clear-button"
                onClick={clearSearch}
                type="button"
              >
                Clear
              </button>
            )}

          </div>


          <form onSubmit={handleSearch}>

            <div className="search-controls">

              <div className="control-group">

                <label>
                  Search Type
                </label>

                <select
                  value={searchType}
                  onChange={(event) => {
                    setSearchType(event.target.value);
                    setError("");
                  }}
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

                  <label>
                    Distance
                  </label>

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
                {loading
                  ? "Searching..."
                  : "Search"}
              </button>

            </div>

          </form>


          {/* HINDI SUGGESTIONS */}
          <div className="suggestions">

            <span className="suggestions-label">
              Hindi suggestions — click a word to search:
            </span>

            <div className="suggestion-list">

              {HINDI_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  className="suggestion-chip"
                  onClick={() =>
                    useSuggestion(suggestion)
                  }
                  type="button"
                >
                  {suggestion}
                </button>
              ))}

            </div>

          </div>


          <div className="query-help">

            {searchType === "term" &&
              "Find documents containing one term."}

            {searchType === "and" &&
              "Find documents containing both terms. Separate them with a comma."}

            {searchType === "or" &&
              "Find documents containing either term. Separate them with a comma."}

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

              <h2>
                Search Results
              </h2>

              <p>
                {searched
                  ? `${results.length} matching documents${
                      results.length > 0
                        ? ` · showing ${
                            startIndex + 1
                          }–${Math.min(
                            startIndex +
                              RESULTS_PER_PAGE,
                            results.length
                          )}`
                        : ""
                    }`
                  : "Results will appear here"}
              </p>

            </div>

            {searched && results.length > 0 && (
              <div className="result-time">
                {results.length} total results
              </div>
            )}

          </div>


          {/* LOADING */}
          {loading && (
            <div className="state-card">

              <div className="loader"></div>

              <p>
                Searching the positional index...
              </p>

            </div>
          )}


          {/* INITIAL STATE */}
          {!loading && !searched && (
            <div className="state-card">

              <div className="state-icon">
                ⌕
              </div>

              <h3>
                Ready to search
              </h3>

              <p>
                Enter a Hindi term or click one of the
                suggestions above to search the indexed
                documents.
              </p>

            </div>
          )}


          {/* NO RESULTS */}
          {!loading &&
            searched &&
            results.length === 0 &&
            !error && (
              <div className="state-card">

                <div className="state-icon">
                  ∅
                </div>

                <h3>
                  No results found
                </h3>

                <p>
                  Try another term, phrase or search
                  operation.
                </p>

              </div>
            )}


          {/* RESULT LIST */}
          {!loading && results.length > 0 && (
            <>
              <div className="results-list">

                {paginatedResults.map((result) => (
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
                        type="button"
                      >
                        View Document
                      </button>

                    </div>


                    <p className="result-text">
                      {getPreview(result.text)}
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
                            +
                            {result.positions.length - 20}
                            {" "}more
                          </span>
                        )}

                      </div>

                    </div>

                  </article>
                ))}

              </div>


              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination">

                  <button
                    className="page-button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage(
                        (page) => page - 1
                      )
                    }
                    type="button"
                  >
                    ← Previous
                  </button>


                  <div className="page-numbers">

                    {visiblePages.map(
                      (page, index) => {

                        const previousPage =
                          visiblePages[index - 1];

                        const needsDots =
                          previousPage &&
                          page - previousPage > 1;

                        return (
                          <span
                            key={page}
                            className="page-group"
                          >

                            {needsDots && (
                              <span className="page-dots">
                                ...
                              </span>
                            )}

                            <button
                              className={`page-number ${
                                currentPage === page
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() =>
                                setCurrentPage(page)
                              }
                              type="button"
                            >
                              {page}
                            </button>

                          </span>
                        );
                      }
                    )}

                  </div>


                  <button
                    className="page-button"
                    disabled={
                      currentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) => page + 1
                      )
                    }
                    type="button"
                  >
                    Next →
                  </button>

                </div>
              )}

            </>
          )}

        </section>


        {/* SEARCH HISTORY */}
        {history.length > 0 && (
          <section className="history-section">

            <div className="section-heading">

              <div>

                <h2>
                  Recent Searches
                </h2>

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
                  onClick={() =>
                    useHistoryItem(item)
                  }
                  type="button"
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

            <p className="eyebrow">
              HOW IT WORKS
            </p>

            <h2>
              Positional Inverted Index
            </h2>

            <p>
              Every document is tokenized and each term
              is stored together with the document IDs and
              the positions where the term occurs.
            </p>

          </div>


          <div className="index-flow">

            <div className="flow-step">
              <span>01</span>
              <strong>Documents</strong>
              <small>Hindi corpus</small>
            </div>

            <div className="flow-arrow">
              →
            </div>

            <div className="flow-step">
              <span>02</span>
              <strong>Tokenizer</strong>
              <small>Terms + positions</small>
            </div>

            <div className="flow-arrow">
              →
            </div>

            <div className="flow-step">
              <span>03</span>
              <strong>Index</strong>
              <small>Inverted structure</small>
            </div>

            <div className="flow-arrow">
              →
            </div>

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

                <h2>
                  Document Viewer
                </h2>

              </div>

              <button
                className="close-button"
                onClick={closeDocument}
                type="button"
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