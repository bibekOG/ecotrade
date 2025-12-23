import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import Rightbar from "../../components/rightbar/Rightbar";
import OffersReceived from "../../components/offers/OffersReceived";
import MyOffers from "../../components/offers/MyOffers";
import ProductMessageBox from "../../components/marketplace/ProductMessageBox";
import Conversations from "./Conversations";
import { getImageUrl, getImageBaseUrl } from "../../utils/imageUtils";
import "./marketplace.css";

export default function Marketplace() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("relevance");
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [trackedSearches, setTrackedSearches] = useState(() => {
    try {
      const raw = localStorage.getItem("trackedSearches");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  // highlightedIds is now computed with useMemo below

  // Form state
  const [formData, setFormData] = useState({
    productName: "",
    productCategory: "Electronics",
    productType: "Brandnew",
    usedFor: "",
    issues: "",
    warranty: "",
    productFor: "Sale",
    productPrice: "",
    minimumPrice: "",
    paymentMethod: "",
    desiredProduct: "",
    exchangeFor: "",
    claimThrough: "Online Delivery",
    location: "Kathmandu Valley",
    validTill: "",
    contactDetails: "",
    productImages: [],
  });

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
      // Only fetch if we're not already loading
      if (!loading) {
        fetchProducts();
      }
    }, 30000); // Increased from 15000 to 30000 to reduce frequency
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
  const trackActivity = async (productId, activityType, metadata = {}) => {
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
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = "/products";
      const params = new URLSearchParams();

      if (sortBy) {
        params.append("sortBy", sortBy);
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

      // Only update products if the data has actually changed
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
    // Avoid duplicates
    if (trackedSearches.some((t) => (t.term || "").toLowerCase() === lower)) return;
    setTrackedSearches((prev) => [...prev, { term, startedAt: Date.now() }]);
  };

  const removeTrackedSearch = (termToRemove) => {
    setTrackedSearches((prev) => prev.filter((t) => (t.term || "") !== termToRemove));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadedImages = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file. Please select image files only.`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

          const res = await apiClient.post("/upload", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          console.log("Upload response:", res.data);

          if (res.status === 200 && res.data?.filename) {
            // Use the filename returned from the backend
            const imagePath = `/images/${res.data.filename}`;
            uploadedImages.push(imagePath);
            console.log("✅ Image uploaded successfully:", {
              originalName: file.name,
              savedFilename: res.data.filename,
              imagePath: imagePath,
              fullUrl: getImageUrl(imagePath)
            });
          } else {
            console.error("❌ Upload response error - no filename:", res);
            alert(`Failed to upload ${file.name}. Server did not return a filename.`);
          }
        } catch (uploadErr) {
          console.error(`❌ Error uploading ${file.name}:`, {
            error: uploadErr,
            response: uploadErr.response?.data,
            status: uploadErr.response?.status,
            message: uploadErr.message
          });
          alert(`Failed to upload ${file.name}: ${uploadErr.response?.data || uploadErr.message || 'Unknown error'}`);
        }
      }

      if (uploadedImages.length > 0) {
        setFormData(prev => ({
          ...prev,
          productImages: [...prev.productImages, ...uploadedImages]
        }));
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      alert("Error uploading images. Please try again.");
    } finally {
      setUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that at least one image is uploaded
    if (!formData.productImages || formData.productImages.length === 0) {
      alert("Please upload at least one product image.");
      return;
    }

    try {
      console.log("Creating product with data:", {
        ...formData,
        userId: user._id,
        productImagesCount: formData.productImages?.length || 0,
        productImages: formData.productImages
      });

      const res = await apiClient.post("/products", {
        ...formData,
        userId: user._id,
        validTill: new Date(formData.validTill).toISOString(),
      });

      console.log("Product created successfully:", res.data);

      if (res.data) {
        setShowCreateForm(false);
        setFormData({
          productName: "",
          productCategory: "Electronics",
          productType: "Brandnew",
          usedFor: "",
          issues: "",
          warranty: "",
          productFor: "Sale",
          productPrice: "",
          minimumPrice: "",
          paymentMethod: "",
          desiredProduct: "",
          exchangeFor: "",
          claimThrough: "Online Delivery",
          location: "Kathmandu Valley",
          validTill: "",
          contactDetails: "",
          productImages: [],
        });
        fetchProducts();
        alert("Product created successfully!");
      }
    } catch (err) {
      console.error("Error creating product:", {
        error: err,
        response: err.response?.data,
        status: err.response?.status
      });
      alert(`Failed to create product: ${err.response?.data || err.message || 'Unknown error'}`);
    }
  };

  const categories = ["All", "Electronics", "Clothing", "Books", "Home", "Sports", "Other"];
  const types = ["All", "Sale", "Giveaway", "Exchange"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "browse":
        return (
          <>
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row items-center gap-4 sticky top-[70px] z-30">
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[120px]"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[100px]"
                >
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer min-w-[140px]"
                  title="Sort products"
                >
                  <option value="relevance">🎯 Relevant</option>
                  <option value="newest">🆕 Newest</option>
                  <option value="oldest">⏰ Oldest</option>
                  <option value="name">📝 Name A-Z</option>
                  <option value="price-low">💰 Price: Low</option>
                  <option value="price-high">💰 Price: High</option>
                </select>
              </div>

              <div className="relative flex-1 w-full">
                <input
                  type="search"
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                {searchQuery !== debouncedSearchQuery && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={addTrackedSearch}
                  disabled={!searchQuery.trim()}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  title="Track this search"
                >
                  + Track
                </button>
                {sortBy === "relevance" && recommendations.length > 0 && (
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${showRecommendations ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setShowRecommendations(!showRecommendations)}
                  >
                    🎯 Top {recommendations.length}
                  </button>
                )}
              </div>
            </div>

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

            {/* Create Product Form */}
            {showCreateForm && (
              <div className="createProductForm">
                <div className="formHeader">
                  <h3>Add New Product</h3>
                  <p>Fill in the details below to create your product listing</p>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="formGrid">
                    {/* Left Column */}
                    <div className="formColumn">
                      <div className="formSection">
                        <h4>Basic Information</h4>
                        <div className="formGroup">
                          <label>Product Name *</label>
                          <input
                            type="text"
                            name="productName"
                            placeholder="Enter product name"
                            value={formData.productName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="formGroup">
                          <label>Category *</label>
                          <select
                            name="productCategory"
                            value={formData.productCategory}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="Electronics">Electronics</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Books">Books</option>
                            <option value="Home">Home</option>
                            <option value="Sports">Sports</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="formGroup">
                          <label>Product Condition *</label>
                          <select
                            name="productType"
                            value={formData.productType}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="Brandnew">Brand New</option>
                            <option value="Like New">Like New</option>
                            <option value="Good">Good</option>
                            <option value="Working">Working</option>
                          </select>
                        </div>

                        <div className="formGroup">
                          <label>Location *</label>
                          <select
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="Kathmandu Valley">Kathmandu Valley</option>
                            <option value="Butwal">Butwal</option>
                            <option value="Pokhara">Pokhara</option>
                            <option value="Dang">Dang</option>
                            <option value="Kohalpur">Kohalpur</option>
                            <option value="Biratnagar">Biratnagar</option>
                          </select>
                        </div>

                        {formData.productType !== "Brandnew" && (
                          <div className="formSection">
                            <h4>Product Details</h4>
                            <div className="formGroup">
                              <label>Used For *</label>
                              <input
                                type="text"
                                name="usedFor"
                                placeholder="e.g., 2 years, 6 months"
                                value={formData.usedFor}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="formGroup">
                              <label>Issues (if any) *</label>
                              <input
                                type="text"
                                name="issues"
                                placeholder="Describe any issues"
                                value={formData.issues}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="formGroup">
                              <label>Warranty *</label>
                              <input
                                type="text"
                                name="warranty"
                                placeholder="Warranty details"
                                value={formData.warranty}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="formColumn">
                      <div className="formSection">
                        <h4>Listing Details</h4>
                        <div className="formGroup">
                          <label>Listing Type *</label>
                          <select
                            name="productFor"
                            value={formData.productFor}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="Sale">Sale</option>
                            <option value="Giveaway">Giveaway</option>
                            <option value="Exchange">Exchange</option>
                          </select>
                        </div>

                        {formData.productFor === "Sale" && (
                          <div className="formSection">
                            <h4>Pricing Information</h4>
                            <div className="formGroup">
                              <label>Product Price (NPR) *</label>
                              <input
                                type="number"
                                name="productPrice"
                                placeholder="Enter price"
                                value={formData.productPrice}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="formGroup">
                              <label>Minimum Price (NPR) *</label>
                              <input
                                type="number"
                                name="minimumPrice"
                                placeholder="Enter minimum price"
                                value={formData.minimumPrice}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="formGroup">
                              <label>Payment Method *</label>
                              <input
                                type="text"
                                name="paymentMethod"
                                placeholder="e.g., Cash, Bank Transfer"
                                value={formData.paymentMethod}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                        )}

                        {formData.productFor === "Giveaway" && (
                          <div className="formGroup">
                            <label>Desired Product *</label>
                            <input
                              type="text"
                              name="desiredProduct"
                              placeholder="What would you like in return?"
                              value={formData.desiredProduct}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        )}

                        {formData.productFor === "Exchange" && (
                          <div className="formGroup">
                            <label>Exchange For *</label>
                            <input
                              type="text"
                              name="exchangeFor"
                              placeholder="What would you like to exchange for?"
                              value={formData.exchangeFor}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        )}

                        <div className="formGroup">
                          <label>Claim Method *</label>
                          <select
                            name="claimThrough"
                            value={formData.claimThrough}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="Online Delivery">Online Delivery</option>
                            <option value="Visit Store">Visit Store</option>
                          </select>
                        </div>

                        <div className="formGroup">
                          <label>Valid Till *</label>
                          <input
                            type="datetime-local"
                            name="validTill"
                            value={formData.validTill}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="formGroup">
                          <label>Contact Details *</label>
                          <textarea
                            name="contactDetails"
                            placeholder="Phone number, email, or other contact information"
                            value={formData.contactDetails}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Section - Full Width */}
                  <div className="formSection fullWidth">
                    <h4>Product Images</h4>
                    <div className="formGroup">
                      <label className="imageUploadLabel">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        <span className="uploadButton">
                          {uploading ? "Uploading..." : "📷 Upload Product Images"}
                        </span>
                      </label>
                    </div>

                    {/* Display uploaded images */}
                    {formData.productImages.length > 0 && (
                      <div className="uploadedImages">
                        <h5>Uploaded Images ({formData.productImages.length}):</h5>
                        <div className="imageGrid">
                          {formData.productImages.map((image, index) => {
                            // Construct proper image URL
                            const imageUrl = getImageUrl(image);
                            return (
                              <div key={index} className="imagePreview">
                                <img
                                  src={imageUrl}
                                  alt={`Product ${index + 1}`}
                                  onError={(e) => {
                                    console.error("Failed to load image:", image, "URL:", imageUrl);
                                    // Try the raw path as fallback
                                    if (e.target.src !== image) {
                                      e.target.src = image.startsWith('http') ? image :
                                        `${process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800"}${image}`;
                                    } else {
                                      // Last resort: show error message instead of default image
                                      e.target.style.display = 'none';
                                      const errorDiv = document.createElement('div');
                                      errorDiv.textContent = 'Image failed to load';
                                      errorDiv.style.cssText = 'color: red; padding: 10px; text-align: center;';
                                      e.target.parentElement.appendChild(errorDiv);
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log("Image loaded successfully:", imageUrl);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="removeImageBtn"
                                  title="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="formActions">
                    <button type="submit" className="submitBtn">
                      ✨ Create Product
                    </button>
                    <button
                      type="button"
                      className="cancelBtn"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recommendations Section */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="recommendationsSection">
                <div className="recommendationsHeader">
                  <h3>🎯 Top Picks Based on Community Activity</h3>
                  <p>Products with highest engagement from views, clicks, and offers</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                  {recommendations.map(product => (
                    <ProductCard
                      key={`rec-${product._id}`}
                      product={product}
                      user={user}
                      isHighlighted={false}
                      onTrackActivity={trackActivity}
                      onProductUpdate={fetchProducts}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Products List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">Loading amazing items...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(products.filter((p) => {
                  const q = debouncedSearchQuery.toLowerCase();
                  if (!q) return true;
                  const name = (p.productName || "").toLowerCase();
                  const category = (p.productCategory || "").toLowerCase();
                  const type = (p.productType || "").toLowerCase();
                  const location = (p.location || "").toLowerCase();
                  return name.includes(q) || category.includes(q) || type.includes(q) || location.includes(q);
                })).map(product => (
                  <ProductCard
                    key={`${product._id}-${product.updatedAt || product.createdAt}`}
                    product={product}
                    user={user}
                    isHighlighted={highlightedIds.has(product._id)}
                    onTrackActivity={trackActivity}
                    onProductUpdate={fetchProducts}
                  />
                ))}
              </div>
            )}
          </>
        );
      case "received":
        return <OffersReceived />;
      case "myOffers":
        return <MyOffers />;
      case "conversations":
        return <Conversations embedded />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-50px)] bg-[#f0f2f5]">
        <div className="flex-[4.5] p-5">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 m-0">Marketplace</h2>
                <h6 className="text-sm font-medium text-gray-500 m-0 mt-1">Build Your Own Trust</h6>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "browse" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("browse")}
                  >
                    Browse
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "received" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("received")}
                  >
                    Offers Received
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "myOffers" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("myOffers")}
                  >
                    My Offers
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === "conversations" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("conversations")}
                  >
                    Conversations
                  </button>
                </div>
                {activeTab === "browse" && (
                  <button
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ml-auto md:ml-0"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                  >
                    {showCreateForm ? "Cancel" : "+ Create Product"}
                  </button>
                )}
              </div>
            </div>

            {renderTabContent()}
          </div>
        </div>
        <Rightbar />
      </div>
    </Layout>
  );
}

// Product Card Component
const ProductCard = React.memo(({ product, user, isHighlighted, onTrackActivity, onProductUpdate }) => {
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  // Track view activity when component mounts
  useEffect(() => {
    if (product && user && onTrackActivity) {
      onTrackActivity(product._id, "view", {
        productName: product.productName,
        productFor: product.productFor,
        timestamp: Date.now()
      });
    }
  }, [product._id, user._id, onTrackActivity]);

  const handleMessageSent = useCallback((message) => {
    // You can add any logic here when a message is sent
    console.log("Message sent:", message);
  }, []);

  const handleModalClose = useCallback((e) => {
    e.stopPropagation();
    setShowDetails(false);
  }, []);

  const handleModalContentClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleViewDetails = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    // Track click activity
    if (onTrackActivity) {
      onTrackActivity(product._id, "click", {
        productName: product.productName,
        action: "view_details",
        timestamp: Date.now()
      });
    }

    setShowDetails(true);
  }, [product._id, product.productName, onTrackActivity]);

  const handleMessageBoxToggle = useCallback(() => {
    // Track click activity for messaging
    if (onTrackActivity && !showMessageBox) {
      onTrackActivity(product._id, "click", {
        productName: product.productName,
        action: "message_seller",
        timestamp: Date.now()
      });
    }

    setShowMessageBox(prev => !prev);
  }, [product._id, product.productName, onTrackActivity, showMessageBox]);

  const handleDeleteProduct = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete "${product.productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await apiClient.delete(`/products/${product._id}`, {
        data: { userId: user._id }
      });

      alert("Product deleted successfully");
      setShowDetails(false);

      // Refresh products list if callback provided
      if (onProductUpdate) {
        onProductUpdate();
      } else {
        // Fallback: reload page
        window.location.reload();
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(err.response?.data || "Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [product._id, product.productName, user._id, onProductUpdate]);

  const handleEditProduct = useCallback(async (e) => {
    e.preventDefault();

    if (!editFormData) return;

    try {
      setEditing(true);

      const updateData = {
        ...editFormData,
        userId: user._id,
      };

      // Only update validTill if it's provided
      if (editFormData.validTill) {
        updateData.validTill = new Date(editFormData.validTill).toISOString();
      }

      await apiClient.put(`/products/${product._id}`, updateData);

      alert("Product updated successfully");
      setShowEditForm(false);
      setShowDetails(false);
      setEditFormData(null);

      // Refresh products list if callback provided
      if (onProductUpdate) {
        onProductUpdate();
      } else {
        // Fallback: reload page
        window.location.reload();
      }
    } catch (err) {
      console.error("Error updating product:", err);
      alert(err.response?.data || "Failed to update product. Please try again.");
    } finally {
      setEditing(false);
    }
  }, [editFormData, product._id, user._id, onProductUpdate]);

  const handleEditImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadedImages = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file.`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await apiClient.post("/upload", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.status === 200 && res.data?.filename) {
          uploadedImages.push(`/images/${res.data.filename}`);
        }
      }

      if (uploadedImages.length > 0) {
        setEditFormData(prev => ({
          ...prev,
          productImages: [...(prev.productImages || []), ...uploadedImages]
        }));
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      alert("Error uploading images. Please try again.");
    } finally {
      e.target.value = '';
    }
  }, []);

  const removeEditImage = useCallback((index) => {
    setEditFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  }, []);

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Helper function to get relevance score class
  const getRelevanceScoreClass = (score) => {
    if (score >= 20) return "high-score";
    if (score >= 10) return "medium-score";
    if (score >= 1) return "low-score";
    return "";
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "#28a745";
      case "Booked": return "#ffc107";
      case "Sold": return "#dc3545";
      default: return "#6c757d";
    }
  };

  // Helper function to format price
  const formatPrice = (price) => {
    if (!price) return "Not specified";
    return `NPR ${parseInt(price).toLocaleString()}`;
  };

  // Helper function to get product type icon
  const getProductTypeIcon = (type) => {
    switch (type) {
      case "Brandnew": return "🆕";
      case "Like New": return "✨";
      case "Good": return "👍";
      case "Working": return "🔧";
      default: return "📦";
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Electronics": return "📱";
      case "Clothing": return "👕";
      case "Books": return "📚";
      case "Home": return "🏠";
      case "Sports": return "⚽";
      default: return "📦";
    }
  };

  return (
    <div>
      {/* Product Details Modal */}
      {showDetails && (
        <div className="productDetailsModal" onClick={handleModalClose}>
          <div className="modalContent" onClick={handleModalContentClick}>
            <div>  <button className="closeModal" onClick={handleModalClose}>×</button></div>

            {/* Modal Header */}
            <div className="modalHeader">
              <h2>
                {getCategoryIcon(product.productCategory)} {product.productName}
                {product.productFor === "Sale" && product.productPrice && (
                  <span className="modalPriceInTitle"> - {formatPrice(product.productPrice)}</span>
                )}
                {product.productFor === "Giveaway" && product.desiredProduct && (
                  <span className="modalDesiredInTitle"> - Want: {product.desiredProduct}</span>
                )}
                {product.productFor === "Exchange" && product.exchangeFor && (
                  <span className="modalExchangeInTitle"> - For: {product.exchangeFor}</span>
                )}
              </h2>
              <div className="modalProductMeta">
                <span className="modalProductBadge">{product.productFor}</span>
                <span className={`modalProductBadge statusValue ${product.status?.toLowerCase()}`}>
                  {product.status || "Active"}
                </span>
                <span className="modalProductBadge">{product.productCategory}</span>
                <span className="modalProductBadge">{product.location}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modalBody">
              {/* Large Image Gallery */}
              {product.productImages && product.productImages.length > 0 && (
                <div className="modalImageGallery">
                  {product.productImages.map((image, index) => {
                    const imageUrl = getImageUrl(image);
                    console.log(`Product image ${index + 1}:`, {
                      original: image,
                      constructed: imageUrl,
                      productId: product._id
                    });
                    return (
                      <div key={index} className="modalImageContainer">
                        <img
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          className="modalImage"
                          onError={(e) => {
                            console.error(`❌ Failed to load product image ${index + 1}:`, {
                              originalPath: image,
                              attemptedUrl: imageUrl,
                              productId: product._id,
                              productName: product.productName,
                              baseUrl: process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800"
                            });

                            // Try alternative URL constructions
                            const baseUrl = getImageBaseUrl();
                            let altUrl;

                            if (image.startsWith('http')) {
                              altUrl = image;
                            } else if (image.startsWith('/images/')) {
                              altUrl = `${baseUrl}${image}`;
                            } else if (image.startsWith('/')) {
                              altUrl = `${baseUrl}/images${image}`;
                            } else {
                              altUrl = `${baseUrl}/images/${image}`;
                            }

                            if (e.target.src !== altUrl && altUrl !== imageUrl) {
                              console.log(`🔄 Trying alternative URL:`, altUrl);
                              e.target.src = altUrl;
                            } else {
                              // Final fallback - use default image
                              console.warn(`⚠️ All URL attempts failed, using default image`);
                              e.target.src = getImageUrl("post/1.jpeg");
                              e.target.onerror = null; // Prevent infinite loop
                            }
                          }}
                          onLoad={() => {
                            console.log(`✅ Product image ${index + 1} loaded successfully:`, imageUrl);
                          }}
                        />
                        <div className="imageOverlay">
                          Image {index + 1} of {product.productImages.length}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="modalProductInfo">
                <div className="infoSection">
                  <h3>📋 Product Details</h3>
                  {/*<div className="infoRow">
                    <span className="infoLabel">Category</span>
                    <span className="infoValue">{product.productCategory}</span>
                  </div>
                    <div className="infoRow">
                    <span className="infoLabel">Location</span>
                    <span className="infoValue">{product.location}</span>
                  </div>
                  
                    <div className="infoRow">
                    <span className="infoLabel">Status</span>
                    <span className={`infoValue statusValue ${product.status?.toLowerCase()}`}>
                      {product.status || "Active"}
                    </span>
                  </div>*/}
                  <div className="infoRow">
                    <span className="infoLabel">Condition</span>
                    <span className="infoValue">{product.productType}</span>
                  </div>
                  <div className="infoRow">
                    <span className="infoLabel">Listing Type</span>
                    <span className="infoValue">{product.productFor}</span>
                  </div>



                  {product.productType !== "Brandnew" && (
                    <>
                      <div className="infoRow">
                        <span className="infoLabel">Used For</span>
                        <span className="infoValue">{product.usedFor || "Not specified"}</span>
                      </div>
                      <div className="infoRow">
                        <span className="infoLabel">Known Issues</span>
                        <span className="infoValue">{product.issues || "No issues reported"}</span>
                      </div>
                      <div className="infoRow">
                        <span className="infoLabel">Warranty Status</span>
                        <span className="infoValue">{product.warranty || "No warranty"}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="infoSection">
                  <h3>💰 Pricing & Exchange</h3>
                  {product.productFor === "Sale" && (
                    <>
                      <div className="infoRow">
                        <span className="infoLabel">Listed Price</span>
                        <span className="infoValue priceValue">{formatPrice(product.productPrice)}</span>
                      </div>
                      <div className="infoRow">
                        <span className="infoLabel">Minimum Price</span>
                        <span className="infoValue priceValue">{formatPrice(product.minimumPrice)}</span>
                      </div>
                      <div className="infoRow">
                        <span className="infoLabel">Payment Method</span>
                        <span className="infoValue">{product.paymentMethod}</span>
                      </div>
                    </>
                  )}

                  {product.productFor === "Giveaway" && (
                    <div className="infoRow">
                      <span className="infoLabel">Desired in Return</span>
                      <span className="infoValue">{product.desiredProduct}</span>
                    </div>
                  )}

                  {product.productFor === "Exchange" && (
                    <div className="infoRow">
                      <span className="infoLabel">Looking to Exchange For</span>
                      <span className="infoValue">{product.exchangeFor}</span>
                    </div>
                  )}

                  <div className="infoRow">
                    <span className="infoLabel">Claim Method</span>
                    <span className="infoValue">{product.claimThrough}</span>
                  </div>
                </div>

                <div className="infoSection">
                  <h3>📞 Contact & Timeline</h3>
                  <div className="infoRow">
                    <span className="infoLabel">Valid Until</span>
                    <span className="infoValue">{new Date(product.validTill).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="infoRow">
                    <span className="infoLabel">Posted On</span>
                    <span className="infoValue">{new Date(product.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="infoRow">
                    <span className="infoLabel">Contact Details</span>
                    <span className="infoValue">{product.contactDetails}</span>
                  </div>
                  <div className="infoRow">
                    <span className="infoLabel">Seller</span>
                    <span className="infoValue">{product.userId?.username || "Anonymous User"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modalFooter">
              <div className="modalActions">
                {/* Owner Actions */}
                {product.userId?._id === user._id && (
                  <>
                    <button
                      className="editBtn"
                      onClick={() => {
                        setShowEditForm(true);
                        // Populate edit form with current product data
                        setEditFormData({
                          productName: product.productName,
                          productCategory: product.productCategory,
                          productType: product.productType,
                          usedFor: product.usedFor || "",
                          issues: product.issues || "",
                          warranty: product.warranty || "",
                          productFor: product.productFor,
                          productPrice: product.productPrice || "",
                          minimumPrice: product.minimumPrice || "",
                          paymentMethod: product.paymentMethod || "",
                          desiredProduct: product.desiredProduct || "",
                          exchangeFor: product.exchangeFor || "",
                          claimThrough: product.claimThrough || "Online Delivery",
                          location: product.location || "Kathmandu Valley",
                          validTill: product.validTill ? new Date(product.validTill).toISOString().slice(0, 16) : "",
                          contactDetails: product.contactDetails || "",
                          productImages: product.productImages || [],
                        });
                      }}
                      disabled={editing}
                    >
                      ✏️ Edit Product
                    </button>
                    <button
                      className="deleteBtn"
                      onClick={handleDeleteProduct}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "🗑️ Delete Product"}
                    </button>
                  </>
                )}

                {/* Non-Owner Actions */}
                {product.userId?._id !== user._id && product.status === "Active" && (
                  <button
                    className="messageBtn"
                    onClick={() => {
                      setShowDetails(false);
                      setShowMessageBox(true);
                    }}
                  >
                    {product.productFor === "Giveaway" ? "🎁 Claim Product" : "💬 Message Seller"}
                  </button>
                )}

                <button
                  className="shareBtn"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.productName,
                        text: `Check out this ${product.productFor.toLowerCase()}: ${product.productName}`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      // You could add a toast notification here
                    }
                  }}
                >
                  🔗 Share Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && editFormData && (
        <div className="editFormOverlay" onClick={(e) => {
          if (e.target.className === "editFormOverlay") {
            setShowEditForm(false);
            setEditFormData(null);
          }
        }}>
          <div className="editFormModal" onClick={(e) => e.stopPropagation()}>
            <div className="editFormHeader">
              <h3>Edit Product</h3>
              <button className="closeEditForm" onClick={() => {
                setShowEditForm(false);
                setEditFormData(null);
              }}>×</button>
            </div>
            <form onSubmit={handleEditProduct} className="editProductForm">
              <div className="formRow">
                <div className="formGroup">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={editFormData.productName}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label>Category *</label>
                  <select
                    name="productCategory"
                    value={editFormData.productCategory}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Books">Books</option>
                    <option value="Home">Home</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>Product Type *</label>
                  <select
                    name="productType"
                    value={editFormData.productType}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="Brandnew">Brandnew</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Working">Working</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label>Product For *</label>
                  <select
                    name="productFor"
                    value={editFormData.productFor}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="Sale">Sale</option>
                    <option value="Giveaway">Giveaway</option>
                    <option value="Exchange">Exchange</option>
                  </select>
                </div>
              </div>

              {editFormData.productFor === "Sale" && (
                <div className="formRow">
                  <div className="formGroup">
                    <label>Price (NRs) *</label>
                    <input
                      type="number"
                      name="productPrice"
                      value={editFormData.productPrice}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  <div className="formGroup">
                    <label>Minimum Price (NRs)</label>
                    <input
                      type="number"
                      name="minimumPrice"
                      value={editFormData.minimumPrice}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>
              )}

              {editFormData.productFor === "Giveaway" && (
                <div className="formGroup">
                  <label>Desired Product</label>
                  <input
                    type="text"
                    name="desiredProduct"
                    value={editFormData.desiredProduct}
                    onChange={handleEditInputChange}
                  />
                </div>
              )}

              {editFormData.productFor === "Exchange" && (
                <div className="formGroup">
                  <label>Exchange For</label>
                  <input
                    type="text"
                    name="exchangeFor"
                    value={editFormData.exchangeFor}
                    onChange={handleEditInputChange}
                  />
                </div>
              )}

              <div className="formGroup">
                <label>Description</label>
                <textarea
                  name="usedFor"
                  value={editFormData.usedFor}
                  onChange={handleEditInputChange}
                  placeholder="Describe your product..."
                />
              </div>

              <div className="formRow">
                <div className="formGroup">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="formGroup">
                  <label>Valid Till *</label>
                  <input
                    type="datetime-local"
                    name="validTill"
                    value={editFormData.validTill}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="formGroup">
                <label>Contact Details *</label>
                <textarea
                  name="contactDetails"
                  value={editFormData.contactDetails}
                  onChange={handleEditInputChange}
                  required
                />
              </div>

              <div className="formGroup">
                <label>Product Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  style={{ display: 'none' }}
                  id="editImageUpload"
                />
                <label htmlFor="editImageUpload" className="uploadButton">
                  📷 Add More Images
                </label>
                {editFormData.productImages.length > 0 && (
                  <div className="imageGrid">
                    {editFormData.productImages.map((image, index) => (
                      <div key={index} className="imagePreview">
                        <img src={getImageUrl(image)} alt={`Product ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="removeImageBtn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="editFormActions">
                <button type="submit" className="saveBtn" disabled={editing}>
                  {editing ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditFormData(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`productCard${isHighlighted ? " highlighted" : ""}`}>
        {/* Relevance Score and Activity Stats - Top of Card */}
        {product.relevanceScore !== undefined && product.relevanceScore > 0 && (
          <div className="topRelevanceScore">
            <div className={`relevanceScore ${getRelevanceScoreClass(product.relevanceScore)}`}>
              🔥 {product.relevanceScore.toFixed(1)}
              {product.activityCounts && (
                <div className="activityStats">
                  {product.activityCounts.view}v • {product.activityCounts.click}c • {product.activityCounts.offer}o
                </div>
              )}
            </div>
          </div>
        )}

        <div className="productHeader">
          <img
            src={product.userId?.profilePicture || "/assets/person/noAvatar.png"}
            alt=""
            className="productUserImg"
            onError={(e) => { e.target.src = "/assets/person/noAvatar.png"; }}
          />
          <span className="productUsername">{product.userId?.username}</span>
          <span className="productType">{product.productFor}</span>
          <span
            className="productStatus"
            style={{ backgroundColor: getStatusColor(product.status) }}
          >
            {product.status}
          </span>
        </div>

        {/* Product Name */}
        <div className="productTitle">
          <h3>{product.productName}</h3>
        </div>

        {/* Product Images */}
        {product.productImages && product.productImages.length > 0 ? (
          <div className="productImages">
            <div className="imageGrid">
              <img
                src={getImageUrl(product.productImages[0])}
                alt="Product"
                onClick={handleViewDetails}
                onError={(e) => {
                  console.error("❌ Failed to load product card image:", {
                    originalPath: product.productImages[0],
                    attemptedUrl: getImageUrl(product.productImages[0]),
                    productId: product._id,
                    productName: product.productName,
                    baseUrl: process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800"
                  });

                  // Try alternative URL constructions
                  const baseUrl = getImageBaseUrl();
                  const image = product.productImages[0];
                  let altUrl;

                  if (image.startsWith('http')) {
                    altUrl = image;
                  } else if (image.startsWith('/images/')) {
                    altUrl = `${baseUrl}${image}`;
                  } else if (image.startsWith('/')) {
                    altUrl = `${baseUrl}/images${image}`;
                  } else {
                    altUrl = `${baseUrl}/images/${image}`;
                  }

                  if (e.target.src !== altUrl && altUrl !== getImageUrl(image)) {
                    console.log(`🔄 Trying alternative URL for card:`, altUrl);
                    e.target.src = altUrl;
                  } else {
                    // Final fallback - use default image
                    console.warn(`⚠️ All URL attempts failed for card, using default image`);
                    setImageLoadError(true);
                    e.target.src = getImageUrl("post/1.jpeg");
                    e.target.onerror = null; // Prevent infinite loop
                  }
                }}
                onLoad={() => {
                  console.log("✅ Product card image loaded:", getImageUrl(product.productImages[0]));
                }}
              />
              {product.productImages.length > 1 && (
                <div className="moreImagesOverlay" onClick={handleViewDetails}>
                  <span>+{product.productImages.length - 1} more</span>
                </div>
              )}
              {/* Image count indicator */}
              <div className="imageCountIndicator">
                {product.productImages.length} image{product.productImages.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="productImages">
            <div className="imageGrid">
              <img
                src="/assets/post/1.jpeg"
                alt="Default Product"
                className="productImage"
                onClick={handleViewDetails}
              />
              <div className="noImageOverlay">
                <span>No Image Available</span>
              </div>
            </div>
          </div>
        )}


        <div className="productActions">
          <button
            className="viewDetailsBtn"
            onClick={handleViewDetails}
          >
            👁️ View Details
          </button>

          {product.userId?._id !== user._id && product.status === "Active" && (
            <button
              className="messageBtn"
              onClick={handleMessageBoxToggle}
            >
              {product.productFor === "Giveaway" ? "🎁 Claim Product" : "💬 Message Seller"}
            </button>
          )}
        </div>



        {/* Product Message Box */}
        {showMessageBox && (
          <ProductMessageBox
            product={product}
            otherUser={product.userId}
            currentUser={user}
            isOpen={showMessageBox}
            onClose={() => setShowMessageBox(false)}
            onMessageSent={handleMessageSent}
          />
        )}
      </div>
    </div>
  );
});
