import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { Person, ArrowForward } from "@material-ui/icons";
import Layout from "../../components/layout/Layout";
import { getProfileImageUrl, getImageUrl } from "../../utils/imageUtils";
import "./search.css";

export default function Search() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search).get("q");

  useEffect(() => {
    if (query && query.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [query, activeTab]);

  const performSearch = async () => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      let endpoint = `/search?q=${encodeURIComponent(query.trim())}`;

      if (activeTab !== "all") {
        endpoint += `&type=${activeTab}`;
      }

      const res = await apiClient.get(endpoint);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error performing search:", err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (path) => {
    history.push(path);
  };

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className="searchLoading">
          <div className="loadingSpinner"></div>
          <p>Searching...</p>
        </div>
      );
    }

    if (!query || !query.trim()) {
      return (
        <div className="noSearchQuery">
          <div className="emptyStateIcon">items</div>
          <h3>Start your search</h3>
          <p>Find friends, posts, or products in the marketplace</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="noResults">
          <div className="noResultsIcon">🔍</div>
          <h3>No results found</h3>
          <p>We couldn't find anything for "{query}"</p>
          <p className="noResultsHint">Try searching for people, keywords, or item names</p>
        </div>
      );
    }

    const users = searchResults.filter(r => r.type === "user");
    const posts = searchResults.filter(r => r.type === "post");
    const products = searchResults.filter(r => r.type === "product");

    return (
      <div className="searchResultsContainer">
        {(activeTab === "all" || activeTab === "users") && users.length > 0 && (
          <div className="resultsSection fade-in">
            <h2 className="sectionTitle">
              People <span className="count-badge">{users.length}</span>
            </h2>
            <div className="resultsGrid usersGrid">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="searchResultCard userCard"
                  onClick={() => handleCardClick(`/profile/${user.username}`)}
                >
                  <div className="cardImage">
                    <img
                      src={getProfileImageUrl(user.profilePicture)}
                      alt={user.username}
                      onError={(e) => { e.target.src = getProfileImageUrl(null); }}
                    />
                  </div>
                  <div className="cardContent">
                    <h3>{user.fullName || user.username}</h3>
                    <p className="cardSubtitle">@{user.username}</p>
                    {user.bio && <p className="cardDescription">{user.bio}</p>}
                  </div>
                  <button className="viewBtn">View</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
          <div className="resultsSection fade-in">
            <h2 className="sectionTitle">
              Marketplace <span className="count-badge">{products.length}</span>
            </h2>
            <div className="resultsGrid productsGrid">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="searchResultCard productCard"
                  onClick={() => handleCardClick(`/marketplace/product/${product._id}`)}
                >
                  <div className="cardImage">
                    <img
                      src={product.productImages && product.productImages[0] ? getImageUrl(product.productImages[0]) : getImageUrl(null)}
                      alt={product.productName}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="priceTag">NRs. {product.productPrice}</div>
                  </div>
                  <div className="cardContent">
                    <h3>{product.productName}</h3>
                    <div className="mini-meta">
                      <span className="location-icon">📍</span>
                      {product.location || "Kathmandu"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "all" || activeTab === "posts") && posts.length > 0 && (
          <div className="resultsSection fade-in">
            <h2 className="sectionTitle">
              Posts <span className="count-badge">{posts.length}</span>
            </h2>
            <div className="resultsGrid postsGrid">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="searchResultCard postCard"
                  onClick={() => handleCardClick(`/`)}
                >
                  {/* Note: Linking to feed for now as single post view might not exist or be different */}
                  <div className="postHeader">
                    <img
                      src={getProfileImageUrl(post.userId?.profilePicture)}
                      alt=""
                      className="postAvatar"
                    />
                    <div className="postMetaInfo">
                      <span className="postAuthor">{post.userId?.fullName || post.userId?.username}</span>
                      <span className="postDate">Recent</span>
                    </div>
                  </div>

                  {post.desc && <p className="postText">{post.desc}</p>}

                  {post.img && (
                    <div className="postImageContainer">
                      <img
                        src={getImageUrl(post.img)}
                        alt="Post"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="postFooter">
                    <span className="readMore">View full post <ArrowForward style={{ fontSize: 14 }} /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="searchPage">
        <div className="searchHeader">
          <h1>Search Results</h1>
          {query && <p className="searchQuery">Found results for &quot;{query}&quot;</p>}
        </div>

        <div className="searchTabs">
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            People
          </button>
          <button
            className={`tab ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button
            className={`tab ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Marketplace
          </button>
        </div>

        {renderSearchResults()}
      </div>
    </Layout>
  );
}
