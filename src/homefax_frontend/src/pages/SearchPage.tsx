import React, { useState } from "react";
import { Property } from "../types";
import { PropertyCard } from "../components/PropertyCard";

interface SearchPageProps {
  backend: any;
}

export function SearchPage({ backend }: SearchPageProps) {
  const [zipCode, setZipCode] = useState("");
  const [results, setResults] = useState<Property[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) return;
    if (!backend) {
      setError("Backend not connected. Please refresh.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const props = await backend.searchProperties(zipCode.trim());
      setResults(props);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header center">
        <h1>Search Property Records</h1>
        <p>Find verified maintenance history for any public HomeFax property.</p>
      </div>

      <div className="search-form-wrapper">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code (e.g. 94105)"
            className="search-input"
            maxLength={10}
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {searched && (
        <div className="search-results">
          <h2>
            {results.length > 0
              ? `${results.length} propert${results.length === 1 ? "y" : "ies"} found in ${zipCode}`
              : `No public properties found in ${zipCode}`}
          </h2>
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No public HomeFax properties registered in this ZIP code yet.</p>
            </div>
          ) : (
            <div className="properties-grid">
              {results.map((p) => (
                <PropertyCard key={p.id.toString()} property={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="search-placeholder">
          <div className="placeholder-icon">🏘️</div>
          <p>Enter a ZIP code to search for properties with public HomeFax records.</p>
        </div>
      )}
    </div>
  );
}
