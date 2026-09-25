import { useState } from "react";

function App() {
  const [searchType, setSearchType] = useState("term");
  const [query, setQuery] = useState("");
  const [nearDistance, setNearDistance] = useState(3);
  const [searched, setSearched] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    setSearched(true);
  };

  const getPlaceholder = () => {
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
  };

  return (
    <div className="app">

      {/* Header */}

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
            Backend connection — Step 3
          </div>

        </div>
      </header>


      {/* Main */}

      <main className="main">

        {/* Hero */}

        <section className="hero">

          <h1>
            Search Hindi Documents
          </h1>

          <p>
            Explore a 10,000-document Hindi corpus using
            a positional inverted index built in Java.
          </p>

        </section>


        {/* Search */}

        <section className="search-panel">

          <form onSubmit={handleSearch}>

            <div className="search-row">

              <select
                className="search-type"
                value={searchType}
                onChange={(event) =>
                  setSearchType(event.target.value)
                }
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
              >
                Search
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


        {/* Stats */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-label">
              Documents
            </div>

            <div className="stat-value">
              10,000
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Index
            </div>

            <div className="stat-value">
              Positional
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Language
            </div>

            <div className="stat-value">
              हिन्दी
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Search Types
            </div>

            <div className="stat-value">
              5
            </div>

          </div>

        </section>


        {/* Results + Info */}

        <section className="content-grid">

          <div className="results-panel">

            <div className="panel-header">

              <h2>
                Search Results
              </h2>

              <span className="result-count">
                {searched ? "Backend connection in Step 3" : "No search yet"}
              </span>

            </div>


            {!searched ? (

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

            ) : (

              <div className="empty-state">

                <div className="empty-icon">
                  ⚡
                </div>

                <h3>
                  Search UI is ready
                </h3>

                <p>
                  The Java backend will be connected
                  to this interface in Step 3.
                </p>

              </div>

            )}

          </div>


          {/* Information panel */}

          <aside className="info-panel">

            <div className="panel-header">

              <h2>
                About the Index
              </h2>

            </div>


            <div className="info-content">

              <h3>
                Positional Inverted Index
              </h3>

              <p>
                Each term is associated with the documents
                in which it occurs and the positions where
                it occurs.
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

            </div>

          </aside>

        </section>

      </main>


      {/* Footer */}

      <footer className="footer">

        Hindi Information Retrieval System ·
        Java Positional Index + React

      </footer>

    </div>
  );
}

export default App;