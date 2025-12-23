import React, { useState, useCallback, useEffect } from "react";
import apiClient from "../../../utils/apiClient";
import { getImageUrl, getImageBaseUrl } from "../../../utils/imageUtils";

const ProductCard = React.memo(({ product, user, isHighlighted, onTrackActivity, onProductUpdate, onChatOpen }) => {
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
    }, [product, user, onTrackActivity]);

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
    }, [product, onTrackActivity]);

    const handleMessageBoxToggle = useCallback((e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        // Track click activity for messaging
        if (onTrackActivity) {
            onTrackActivity(product._id, "click", {
                productName: product.productName,
                action: "message_seller",
                timestamp: Date.now()
            });
        }

        if (onChatOpen) {
            onChatOpen(product);
        }
    }, [product, onTrackActivity, onChatOpen]);

    // Helper function to format price
    const formatPrice = (price) => {
        if (!price) return "Not specified";
        return `NPR ${parseInt(price).toLocaleString()}`;
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

    // Helper function to get relevance score class
    const getRelevanceScoreClass = (score) => {
        if (score >= 20) return "high-score";
        if (score >= 10) return "medium-score";
        if (score >= 1) return "low-score";
        return "";
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

            if (onProductUpdate) {
                onProductUpdate();
            } else {
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
                                        return (
                                            <div key={index} className="modalImageContainer">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Product ${index + 1}`}
                                                    className="modalImage"
                                                    onError={(e) => {
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
                                                            e.target.src = altUrl;
                                                        } else {
                                                            e.target.src = getImageUrl("post/1.jpeg");
                                                            e.target.onerror = null;
                                                        }
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
                                        onClick={(e) => {
                                            setShowDetails(false);
                                            handleMessageBoxToggle(e);
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
                {/* Statistics Badge (Views, etc) */}
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

                <div className=" pt-10 px-2 pb-2 !justify-between !w-full !flex">
                    <div>

                        <img
                            src={getProfileImageUrl(product.userId?.profilePicture)}
                            alt=""
                            className="productUserImg"
                            onError={(e) => { e.target.src = getProfileImageUrl("person/noAvatar.png"); }}
                        />
                        <span className="productUsername">{product.userId?.username}</span>
                    </div>
                    {/* <span className="productType">{product.productFor}</span> */}
                    <div style={{ marginLeft: "auto" }}>
                        <span
                            className="productStatus"
                            style={{ backgroundColor: getStatusColor(product.status), color: 'white', padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}
                        >
                            {product.status}
                        </span>
                    </div>
                </div>

                {/* Product Images */}
                {product.productImages && product.productImages.length > 0 ? (
                    <div className="productImages">
                        <div className="imageGrid">
                            <img
                                src={getImageUrl(product.productImages[0])}
                                alt="Product"
                                className="productImage"
                                onClick={handleViewDetails}
                                onError={(e) => {
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
                                        e.target.src = altUrl;
                                    } else {
                                        setImageLoadError(true);
                                        e.target.src = getImageUrl("post/1.jpeg");
                                        e.target.onerror = null;
                                    }
                                }}
                            />
                            {product.productImages.length > 1 && (
                                <div className="moreImagesOverlay" onClick={handleViewDetails}>
                                    <span>+{product.productImages.length - 1} more</span>
                                </div>
                            )}

                            {/* Hover Message Overlay */}
                            {product.userId?._id !== user._id && (
                                <div className="messageOverlay">
                                    <button className="cardMessageBtn" onClick={handleMessageBoxToggle}>
                                        💬 Message
                                    </button>
                                </div>
                            )}
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
                            {/* Hover Message Overlay */}
                            {product.userId?._id !== user._id && (
                                <div className="messageOverlay">
                                    <button className="cardMessageBtn" onClick={handleMessageBoxToggle}>
                                        💬 Message
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="productTitle">
                    {product.productFor === "Sale" && product.productPrice && (
                        <div className="productPrice !text-start">{formatPrice(product.productPrice)}</div>
                    )}
                    <h3 className="!text-start !text-sm">{product.productName}</h3>
                    <div className="!text-start" style={{ fontSize: "13px", color: "#65676b", marginTop: "4px" }}>
                        {product.location}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
