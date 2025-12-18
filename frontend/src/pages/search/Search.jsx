import React, { useState, useEffect } from "react";
import { useLocation, useHistory, Link } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { Person, Description, Store } from "@material-ui/icons";
import Layout from "../../components/layout/Layout";
import "./search.css";

export default function Search() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const location = useLocation();
  const history = useHistory();
  const query = new URLSearchParams(location.search).get("q");
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

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
          <p>Enter a search query to find users, posts, and products</p>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="noResults">
          <div className="noResultsIcon">🔍</div>
          <h3>No results found</h3>
          <p>No results found for "{query}"</p>
          <p className="noResultsHint">Try different keywords or check your spelling</p>
        </div>
      );
    }

    const users = searchResults.filter(r => r.type === "user");
    const posts = searchResults.filter(r => r.type === "post");
    const products = searchResults.filter(r => r.type === "product");

    return (
      <div className="searchResultsContainer">
        {activeTab === "all" && (
          <>
            {users.length > 0 && (
              <div className="resultsSection">
                <h2 className="sectionTitle">Users ({users.length})</h2>
                <div className="resultsGrid">
                  {users.map((user) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user.username}`}
                      className="searchResultCard userCard"
                    >
                      <div className="cardImage">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture.startsWith("http") ? user.profilePicture : PF + user.profilePicture}
                            alt={user.username}
                            onError={(e) => {
                              e.target.src = PF + "person/noAvatar.png";
                            }}
                          />
                        ) : (
                          <Person className="cardIcon" />
                        )}
                      </div>
                      <div className="cardContent">
                        <h3>{user.fullName || user.username}</h3>
                        <p className="cardSubtitle">@{user.username}</p>
                        {user.bio && <p className="cardDescription">{user.bio}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div className="resultsSection">
                <h2 className="sectionTitle">Posts ({posts.length})</h2>
                <div className="resultsGrid">
                  {posts.map((post) => (
                    <Link
                      key={post._id}
                      to={`/`}
                      className="searchResultCard postCard"
                    >
                      {post.img && (
                        <div className="cardImage">
                          <img
                            src={post.img.startsWith("http") ? post.img : PF + post.img}
                            alt="Post"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="cardContent">
                        {post.desc ? (
                          <p className="cardDescription">{post.desc}</p>
                        ) : (
                          <p className="cardDescription">Post</p>
                        )}
                        <div className="cardMeta">
                          <span>
                            By {post.userId?.fullName || post.userId?.username || "Unknown"}
                          </span>
                          {post.tags && post.tags.length > 0 && (
                            <div className="cardTags">
                              {post.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="tag">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {products.length > 0 && (
              <div className="resultsSection">
                <h2 className="sectionTitle">Products ({products.length})</h2>
                <div className="resultsGrid">
                  {products.map((product) => (
                    <Link
                      key={product._id}
                      to={`/marketplace/product/${product._id}`}
                      className="searchResultCard productCard"
                    >
                      {product.productImages && product.productImages[0] && (
                        <div className="cardImage">
                          <img
                            src={product.productImages[0].startsWith("http") ? product.productImages[0] : PF + product.productImages[0]}
                            alt={product.productName}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="cardContent">
                        <h3>{product.productName}</h3>
                        {product.productDescription && (
                          <p className="cardDescription">{product.productDescription}</p>
                        )}
                        <div className="cardMeta">
                          <span>
                            By {product.userId?.fullName || product.userId?.username || "Unknown"}
                          </span>
                          {product.productPrice && (
                            <span className="cardPrice">NRs. {product.productPrice}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "users" && users.length > 0 && (
          <div className="resultsSection">
            <div className="resultsGrid">
              {users.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user.username}`}
                  className="searchResultCard userCard"
                >
                  <div className="cardImage">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture.startsWith("http") ? user.profilePicture : PF + user.profilePicture}
                        alt={user.username}
                        onError={(e) => {
                          e.target.src = PF + "person/noAvatar.png";
                        }}
                      />
                    ) : (
                      <Person className="cardIcon" />
                    )}
                  </div>
                  <div className="cardContent">
                    <h3>{user.fullName || user.username}</h3>
                    <p className="cardSubtitle">@{user.username}</p>
                    {user.bio && <p className="cardDescription">{user.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === "posts" && posts.length > 0 && (
          <div className="resultsSection">
            <div className="resultsGrid">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/`}
                  className="searchResultCard postCard"
                >
                  {post.img && (
                    <div className="cardImage">
                      <img
                        src={post.img.startsWith("http") ? post.img : PF + post.img}
                        alt="Post"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="cardContent">
                    {post.desc ? (
                      <p className="cardDescription">{post.desc}</p>
                    ) : (
                      <p className="cardDescription">Post</p>
                    )}
                    <div className="cardMeta">
                      <span>
                        By {post.userId?.fullName || post.userId?.username || "Unknown"}
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="cardTags">
                          {post.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === "products" && products.length > 0 && (
          <div className="resultsSection">
            <div className="resultsGrid">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/marketplace/product/${product._id}`}
                  className="searchResultCard productCard"
                >
                  {product.productImages && product.productImages[0] && (
                    <div className="cardImage">
                      <img
                        src={product.productImages[0].startsWith("http") ? product.productImages[0] : PF + product.productImages[0]}
                        alt={product.productName}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="cardContent">
                    <h3>{product.productName}</h3>
                    {product.productDescription && (
                      <p className="cardDescription">{product.productDescription}</p>
                    )}
                    <div className="cardMeta">
                      <span>
                        By {product.userId?.fullName || product.userId?.username || "Unknown"}
                      </span>
                      {product.productPrice && (
                        <span className="cardPrice">NRs. {product.productPrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && users.length === 0 && !loading && (
          <div className="noResults">
            <p>No users found for "{query}"</p>
          </div>
        )}

        {activeTab === "posts" && posts.length === 0 && !loading && (
          <div className="noResults">
            <p>No posts found for "{query}"</p>
          </div>
        )}

        {activeTab === "products" && products.length === 0 && !loading && (
          <div className="noResults">
            <p>No products found for "{query}"</p>
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
          {query && <p className="searchQuery">Showing results for: "{query}"</p>}
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
            Users
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
            Products
          </button>
        </div>

        {renderSearchResults()}
      </div>
    </Layout>
  );
}
