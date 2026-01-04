import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import OffersReceived from "../../components/offers/OffersReceived";
import MyOffers from "../../components/offers/MyOffers";
import ProductMessageBox from "../../components/marketplace/ProductMessageBox";
import Conversations from "./Conversations";
import CategoryPreferences from "../../utils/categoryPreferences";
import "./marketplace.css";

// Components
import ProductCard from "./components/ProductCard";
import CreateProductForm from "./components/CreateProductForm";
import MarketplaceFilters from "./components/MarketplaceFilters";

export default function Marketplace() {
  const { user } = useContext(AuthContext);
  const [activeChatProduct, setActiveChatProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  const [trackedSearches, setTrackedSearches] = useState(() => {
    try {
      const raw = localStorage.getItem("trackedSearches");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === "browse") {
      fetchProducts();
      if (sortBy === "relevance") {
        fetchRecommendations();
      }
    }
  }, [selectedCategory, selectedType, activeTab, sortBy]);

  // Persist tracked searches
  useEffect(() => {
    try {
      localStorage.setItem("trackedSearches", JSON.stringify(trackedSearches));
    } catch { }
  }, [trackedSearches]);

  // Recompute highlighted products whenever products or tracked terms change
  const highlightedIds = useMemo(() => {
    const next = new Set();
    if (Array.isArray(products) && Array.isArray(trackedSearches)) {
      products.forEach((p) => {
        const name = (p.productName || "").toLowerCase();
        const category = (p.productCategory || "").toLowerCase();
        const type = (p.productType || "").toLowerCase();
        const location = (p.location || "").toLowerCase();
        const createdAt = new Date(p.createdAt || 0).getTime();
        for (const t of trackedSearches) {
          const term = (t.term || "").toLowerCase();
          if (!term) continue;
          const matches = name.includes(term) || category.includes(term) || type.includes(term) || location.includes(term);
          if (matches && createdAt >= (t.startedAt || 0)) {
            next.add(p._id);
            break;
          }
        }
      });
    }
    return next;
  }, [products, trackedSearches]);

  // Poll for new products while tracking searches
  useEffect(() => {
    if (activeTab !== "browse" || !trackedSearches.length) return;
    const id = setInterval(() => {
      if (!loading) {
        fetchProducts();
      }
    }, 30000);
    return () => clearInterval(id);
  }, [activeTab, trackedSearches, loading]);

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const res = await apiClient.get("/products/recommendations?limit=5");
      setRecommendations(res.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  // Track user activity
  const trackActivity = useCallback(async (productId, activityType, metadata = {}) => {
    try {
      await apiClient.post("/productActivities/track", {
        productId,
        userId: user._id,
        activityType,
        metadata
      });
    } catch (error) {
      console.error("Error tracking activity:", error);
    }
  }, [user._id]);

  const handleChatOpen = useCallback((product) => {
    setActiveChatProduct(product);
  }, []);

  const handleChatClose = useCallback(() => {
    setActiveChatProduct(null);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = "/products";
      const params = new URLSearchParams();

      if (sortBy) {
        params.append("sortBy", sortBy);
      }

      // Include preferred categories for personalized sorting
      if (sortBy === "relevance") {
        const preferredCats = CategoryPreferences.getPreferencesQueryParam();
        if (preferredCats) {
          params.append("preferredCategories", preferredCats);
        }
      }

      if (selectedCategory !== "All") {
        url = `/products/category/${selectedCategory}`;
      } else if (selectedType !== "All") {
        url = `/products/type/${selectedType}`;
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await apiClient.get(url);

      setProducts(prevProducts => {
        if (JSON.stringify(prevProducts) !== JSON.stringify(res.data)) {
          return res.data;
        }
        return prevProducts;
      });
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTrackedSearch = () => {
    const term = (searchQuery || "").trim();
    if (!term) return;
    const lower = term.toLowerCase();
    if (trackedSearches.some((t) => (t.term || "").toLowerCase() === lower)) return;
    setTrackedSearches((prev) => [...prev, { term, startedAt: Date.now() }]);
  };

  const removeTrackedSearch = (termToRemove) => {
    setTrackedSearches((prev) => prev.filter((t) => (t.term || "") !== termToRemove));
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const q = debouncedSearchQuery.toLowerCase();
      if (!q) return true;
      const name = (p.productName || "").toLowerCase();
      const category = (p.productCategory || "").toLowerCase();
      const type = (p.productType || "").toLowerCase();
      const location = (p.location || "").toLowerCase();
      return name.includes(q) || category.includes(q) || type.includes(q) || location.includes(q);
    });
  }, [products, debouncedSearchQuery]);

  return (
    <Layout>
      <div className="marketplacePageContent">
        <div className="marketplaceWrapper">
          <div className="marketplaceHeader">
            <div>
              <h2>Marketplace</h2>
              <h6>Buy, sell, and connect with your community</h6>
            </div>

            <div className="headerActions">
              <div className="marketplaceTabs">
                <button
                  className={`tabButton ${activeTab === "browse" ? "active" : ""}`}
                  onClick={() => setActiveTab("browse")}
                >
                  Browse
                </button>
                <button
                  className={`tabButton ${activeTab === "received" ? "active" : ""}`}
                  onClick={() => setActiveTab("received")}
                >
                  Offers Received
                </button>
                <button
                  className={`tabButton ${activeTab === "myOffers" ? "active" : ""}`}
                  onClick={() => setActiveTab("myOffers")}
                >
                  My Offers
                </button>
                <button
                  className={`tabButton ${activeTab === "conversations" ? "active" : ""}`}
                  onClick={() => setActiveTab("conversations")}
                >
                  Conversations
                </button>
              </div>

              {activeTab === "browse" && (
                <button
                  className="createProductBtn"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  {showCreateForm ? "Close Form" : "+ Create Product"}
                </button>
              )}
            </div>
          </div>

          <div className="marketplaceContent">
            {activeTab === "browse" && (
              <>
                <MarketplaceFilters
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  addTrackedSearch={addTrackedSearch}
                  showRecommendations={showRecommendations}
                  setShowRecommendations={setShowRecommendations}
                  recommendationsCount={recommendations.length}
                  onRecommendationsClick={() => setShowRecommendations(!showRecommendations)}
                />

                {trackedSearches.length > 0 && (
                  <div className="trackedSearches">
                    {trackedSearches.map((t) => (
                      <span key={t.term} className="trackedBadge">
                        {t.term}
                        <button className="removeBadge" onClick={() => removeTrackedSearch(t.term)}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                {showCreateForm && (
                  <CreateProductForm
                    user={user}
                    onProductCreated={() => {
                      fetchProducts();
                      setShowCreateForm(false);
                    }}
                    onCancel={() => setShowCreateForm(false)}
                  />
                )}

                {showRecommendations && recommendations.length > 0 && (
                  <div className="recommendationsSection">
                    <div className="recommendationsHeader">
                      <h3>🎯 Top Picks Based on Community Activity</h3>
                      <p>Products with highest engagement from views, clicks, and offers</p>
                    </div>
                    <div className="productsList">
                      {recommendations.map((product) => (
                        <ProductCard
                          key={`rec-${product._id}`}
                          product={product}
                          user={user}
                          isHighlighted={false}
                          onTrackActivity={trackActivity}
                          onProductUpdate={fetchProducts}
                          onChatOpen={handleChatOpen}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="font-medium animate-pulse">Loading amazing items...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="text-4xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <div className="productsList">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={`${product._id}-${product.updatedAt || product.createdAt}`}
                        product={product}
                        user={user}
                        isHighlighted={highlightedIds.has(product._id)}
                        onTrackActivity={trackActivity}
                        onProductUpdate={fetchProducts}
                        onChatOpen={handleChatOpen}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "received" && <OffersReceived />}
            {activeTab === "myOffers" && <MyOffers />}
            {activeTab === "conversations" && <Conversations embedded />}
          </div>
        </div>
      </div>

      {activeChatProduct && (
        <div className="floatingChatWidget">
          <ProductMessageBox
            product={activeChatProduct}
            otherUser={activeChatProduct.userId}
            currentUser={user}
            isOpen={true}
            onClose={handleChatClose}
          />
        </div>
      )}
    </Layout>
  );
}
