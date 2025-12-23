import { useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Person, Description, Store } from "@material-ui/icons";
import { getImageUrl, getProfileImageUrl } from "../../utils/imageUtils";
import "./searchResults.css";

export default function SearchResults({
  results,
  loading,
  searchQuery,
  show,
  onClose,
  onResultClick
}) {
  const resultsRef = useRef(null);
  const history = useHistory();
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [show, onClose]);

  // Don't render if not shown
  if (!show) {
    return null;
  }

  // Show loading or results even if query is empty (handled by parent)
  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      if (result.type === "user") {
        history.push(`/profile/${result.username}`);
      } else if (result.type === "post") {
        // Navigate to post detail page or feed
        history.push(`/`);
      } else if (result.type === "product") {
        history.push(`/marketplace/product/${result._id}`);
      }
      onClose();
    }
  };

  const renderResult = (result, index) => {
    if (result.type === "user") {
      return (
        <div
          key={`user-${result._id}-${index}`}
          className="searchResultItem userResult"
          onClick={() => handleResultClick(result)}
        >
          <div className="resultIconWrapper userIcon">
            {result.profilePicture ? (
              <img
                src={getProfileImageUrl(result.profilePicture)}
                alt={result.username}
                className="resultAvatar"
                onError={(e) => {
                  e.target.src = getProfileImageUrl("person/noAvatar.png");
                }}
              />
            ) : (
              <Person className="resultIcon" />
            )}
          </div>
          <div className="resultContent">
            <div className="resultTitle">{result.fullName || result.username}</div>
            <div className="resultSubtitle">@{result.username}</div>
            {result.bio && (
              <div className="resultDescription">{result.bio.substring(0, 60)}{result.bio.length > 60 ? "..." : ""}</div>
            )}
          </div>
          <div className="resultTypeBadge userBadge">User</div>
        </div>
      );
    }

    if (result.type === "post") {
      const author = result.userId?.fullName || result.userId?.username || result.userId || "Unknown";
      return (
        <div
          key={`post-${result._id}-${index}`}
          className="searchResultItem postResult"
          onClick={() => handleResultClick(result)}
        >
          <div className="resultIconWrapper postIcon">
            <Description className="resultIcon" />
          </div>
          <div className="resultContent">
            <div className="resultTitle">
              {result.desc ? result.desc.substring(0, 80) : "Post"}
              {result.desc && result.desc.length > 80 ? "..." : ""}
            </div>
            <div className="resultSubtitle">By {author}</div>
            {result.tags && result.tags.length > 0 && (
              <div className="resultTags">
                {result.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
          {result.img && (
            <img
              src={getImageUrl(result.img)}
              alt="Post"
              className="resultPostImage"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div className="resultTypeBadge postBadge">Post</div>
        </div>
      );
    }

    if (result.type === "product") {
      const seller = result.userId?.fullName || result.userId?.username || "Unknown";
      return (
        <div
          key={`product-${result._id}-${index}`}
          className="searchResultItem productResult"
          onClick={() => handleResultClick(result)}
        >
          <div className="resultIconWrapper productIcon">
            <Store className="resultIcon" />
          </div>
          <div className="resultContent">
            <div className="resultTitle">{result.productName}</div>
            <div className="resultSubtitle">By {seller}</div>
            {result.productDescription && (
              <div className="resultDescription">
                {result.productDescription.substring(0, 60)}
                {result.productDescription.length > 60 ? "..." : ""}
              </div>
            )}
          </div>
          {result.productImages && result.productImages[0] && (
            <img
              src={getImageUrl(result.productImages[0])}
              alt={result.productName}
              className="resultProductImage"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div className="resultTypeBadge productBadge">Product</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="searchResultsDropdown" ref={resultsRef}>
      {loading ? (
        <div className="searchResultsLoading">
          <div className="loadingSpinner"></div>
          <span>Searching...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="searchResultsEmpty">
          <p>No results found for "{searchQuery}"</p>
        </div>
      ) : (
        <>
          <div className="searchResultsHeader">
            <span>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
          </div>
          <div className="searchResultsList">
            {results.map((result, index) => renderResult(result, index))}
          </div>
          {results.length >= 5 && (
            <div className="searchResultsFooter">
              <button
                className="viewAllButton"
                onClick={(e) => {
                  e.stopPropagation();
                  history.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                  onClose();
                }}
              >
                View all results
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
