import { useState, useEffect, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Search } from "@material-ui/icons";
import apiClient from "../../utils/apiClient";
import SearchResults from "../search/SearchResults";
import "./header.css";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchBarRef = useRef(null);
  const history = useHistory();
  const debounceTimer = useRef(null);

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setShowResults(true); // Show dropdown when loading starts
      const response = await apiClient.get(`/search?q=${encodeURIComponent(query.trim())}`);
      
      // Ensure response.data is an array
      const results = Array.isArray(response.data) ? response.data : [];
      
      console.log("Search results received:", results); // Debug log
      
      // Limit results in dropdown
      const limitedResults = results.slice(0, 5);
      setSearchResults(limitedResults);
      setShowResults(true); // Keep dropdown open after results load
    } catch (error) {
      console.error("Search error:", error);
      console.error("Search error details:", error.response?.data || error.message);
      setSearchResults([]);
      setShowResults(true); // Show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce input changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length >= 1) {
      debounceTimer.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setLoading(false);
      setShowResults(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    if (showResults || isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showResults, isFocused]);

  const handleSearch = (e) => {
    if (e) {
      e.preventDefault();
    }
    if (searchQuery.trim()) {
      history.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
      setIsFocused(false);
    }
  };

  const handleSearchIconClick = () => {
    handleSearch(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    } else if (e.key === "Escape") {
      setShowResults(false);
      setIsFocused(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Don't set showResults here - let it be controlled by performSearch and focus
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (searchQuery.trim().length >= 1) {
      // If there's a query and results exist, show dropdown
      if (searchResults.length > 0 || loading) {
        setShowResults(true);
      } else {
        // If there's a query but no results yet, trigger search
        performSearch(searchQuery);
      }
    }
  };

  const handleResultClick = (result) => {
    if (result.type === "user") {
      history.push(`/profile/${result.username}`);
    } else if (result.type === "post") {
      history.push(`/`);
      // Scroll to post if on home page
      setTimeout(() => {
        window.location.hash = `post-${result._id}`;
      }, 100);
    } else if (result.type === "product") {
      history.push(`/marketplace/product/${result._id}`);
    }
    setShowResults(false);
    setIsFocused(false);
    setSearchQuery("");
  };

  const shouldShowDropdown = showResults && searchQuery.trim().length >= 1;

  return (
    <div className="searchBarContainer" ref={searchBarRef}>
      <form onSubmit={handleSearch} className={`searchBar ${isFocused ? "focused" : ""}`}>
        <div className="searchIconWrapper" onClick={handleSearchIconClick}>
          <Search className="searchIcon" />
        </div>
        <input
          type="text"
          placeholder="Search for users, posts, or products..."
          className="searchInput"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
        />
      </form>

      {shouldShowDropdown && (
        <SearchResults
          results={searchResults}
          loading={loading}
          searchQuery={searchQuery}
          show={showResults}
          onClose={() => {
            setShowResults(false);
            setIsFocused(false);
          }}
          onResultClick={handleResultClick}
        />
      )}
    </div>
  );
}
