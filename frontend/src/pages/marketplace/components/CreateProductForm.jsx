import React, { useState } from "react";
import apiClient from "../../../utils/apiClient";
import { getImageUrl } from "../../../utils/imageUtils";

export default function CreateProductForm({ user, onProductCreated, onCancel }) {
    const [uploading, setUploading] = useState(false);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);

        try {
            const uploadedImages = [];

            for (const file of files) {
                if (!file.type.startsWith("image/")) {
                    alert(`${file.name} is not an image file. Please select image files only.`);
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert(`${file.name} is too large. Maximum size is 5MB.`);
                    continue;
                }

                const data = new FormData();
                data.append("file", file);

                try {
                    const res = await apiClient.post("/upload", data, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });

                    if (res.status === 200 && res.data?.filename) {
                        uploadedImages.push(`/images/${res.data.filename}`);
                    } else {
                        alert(`Failed to upload ${file.name}. Server did not return a filename.`);
                    }
                } catch (uploadErr) {
                    console.error(`Error uploading ${file.name}:`, uploadErr);
                    alert(`Failed to upload ${file.name}.`);
                }
            }

            if (uploadedImages.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    productImages: [...prev.productImages, ...uploadedImages],
                }));
            }
        } catch (err) {
            console.error("Error uploading images:", err);
            alert("Error uploading images. Please try again.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const removeImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            productImages: prev.productImages.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.productImages || formData.productImages.length === 0) {
            alert("Please upload at least one product image.");
            return;
        }

        try {
            const res = await apiClient.post("/products", {
                ...formData,
                userId: user._id,
                validTill: new Date(formData.validTill).toISOString(),
            });

            if (res.data) {
                alert("Product created successfully!");
                if (onProductCreated) onProductCreated();
            }
        } catch (err) {
            console.error("Error creating product:", err);
            alert(`Failed to create product: ${err.response?.data || err.message}`);
        }
    };

    return (
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
                                style={{ display: "none" }}
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
                                    const imageUrl = getImageUrl(image);
                                    return (
                                        <div key={index} className="imagePreview">
                                            <img
                                                src={imageUrl}
                                                alt={`Product ${index + 1}`}
                                                onError={(e) => {
                                                    // Fallback logic
                                                    e.target.style.display = 'none';
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
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
