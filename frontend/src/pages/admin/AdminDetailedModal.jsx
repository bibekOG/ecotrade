import React from "react";
import { Visibility, Edit, Delete, Close } from "@material-ui/icons";

export default function AdminDetailedModal({
    selectedModal,
    closeModal,
    detailLoading,
    modalData,
    handlers,
    setShowAdForm
}) {
    if (!selectedModal) return null;

    const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

    const getImageUrl = (img, fallback) => {
        if (!img) return fallback;
        if (img.startsWith("http") || img.startsWith("https")) return img;
        // If it starts with / and it's NOT a backend image (this is tricky), assume local fallback is handled by caller passing it as fallback?
        // No, here we are checking the 'img' value from DB.
        return PF + img;
    };

    const {
        handleViewUser, handleEditUser, handleDeleteUser,
        handleViewPost, handleDeletePost,
        handleViewProduct, handleEditProduct, handleDeleteProduct,
        handleEditAd, handleDeleteAd
    } = handlers;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-white rounded-xl w-[95%] max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-gray-900 m-0">
                        {selectedModal === "users" && "Users Management"}
                        {selectedModal === "posts" && "Posts Management"}
                        {selectedModal === "products" && "Products Management"}
                        {selectedModal === "ads" && "Advertisements Management"}
                    </h3>
                    <div className="flex items-center gap-3">
                        {selectedModal === "ads" && (
                            <button
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
                                onClick={() => setShowAdForm(true)}
                            >
                                + Add Advertisement
                            </button>
                        )}
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors border-none cursor-pointer" onClick={closeModal}>
                            <Close style={{ fontSize: 20 }} />
                        </button>
                    </div>
                </div>

                <div className="p-5 overflow-y-auto bg-gray-50 flex-1">
                    {detailLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="loadingSpinner border-4 border-blue-100 border-t-blue-600 rounded-full w-10 h-10 animate-spin mb-4"></div>
                            <p className="text-gray-500">Loading {selectedModal} data...</p>
                        </div>
                    ) : modalData ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {selectedModal === "users" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left bg-white text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-700">Avatar</th>
                                                <th className="p-3 font-semibold text-gray-700">Username</th>
                                                <th className="p-3 font-semibold text-gray-700">Full Name</th>
                                                <th className="p-3 font-semibold text-gray-700">Email</th>
                                                <th className="p-3 font-semibold text-gray-700">Friends</th>
                                                <th className="p-3 font-semibold text-gray-700">Posts</th>
                                                <th className="p-3 font-semibold text-gray-700">Status</th>
                                                <th className="p-3 font-semibold text-gray-700">Role</th>
                                                <th className="p-3 font-semibold text-gray-700">Created</th>
                                                <th className="p-3 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {modalData.map(user => (
                                                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <img
                                                            src={getImageUrl(user.profilePicture, "/images/person/noAvatar.png")}
                                                            alt={user.username}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                            onError={(e) => { e.target.src = "/images/person/noAvatar.png"; }}
                                                        />
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-900">{user.username}</td>
                                                    <td className="p-3 text-gray-600">{user.fullName}</td>
                                                    <td className="p-3 text-gray-600">{user.email}</td>
                                                    <td className="p-3 text-gray-600">{user.friends?.length || 0}</td>
                                                    <td className="p-3 text-gray-600">{user.postCount || 0}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {user.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        {user.isAdmin && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">ADMIN</span>}
                                                    </td>
                                                    <td className="p-3 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" onClick={() => handleViewUser(user)}><Visibility style={{ fontSize: 16 }} /></button>
                                                            <button className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" onClick={() => handleEditUser(user)}><Edit style={{ fontSize: 16 }} /></button>
                                                            <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" onClick={() => handleDeleteUser(user)}><Delete style={{ fontSize: 16 }} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {selectedModal === "posts" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left bg-white text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-700">User</th>
                                                <th className="p-3 font-semibold text-gray-700">Content</th>
                                                <th className="p-3 font-semibold text-gray-700">Image</th>
                                                <th className="p-3 font-semibold text-gray-700">Likes</th>
                                                <th className="p-3 font-semibold text-gray-700">Comments</th>
                                                <th className="p-3 font-semibold text-gray-700">Tags</th>
                                                <th className="p-3 font-semibold text-gray-700">Created</th>
                                                <th className="p-3 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {modalData.map(post => (
                                                <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={getImageUrl(post.userId?.profilePicture, "/images/person/noAvatar.png")}
                                                                alt={post.userId?.username}
                                                                className="w-8 h-8 rounded-full object-cover"
                                                                onError={(e) => { e.target.src = "/images/person/noAvatar.png"; }}
                                                            />
                                                            <span className="font-medium text-gray-900">{post.userId?.username || "Unknown"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="max-w-xs text-gray-600 truncate">
                                                            {post.desc ? (post.desc.length > 100 ? post.desc.substring(0, 100) + "..." : post.desc) : "No content"}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        {post.img && <img src={getImageUrl(post.img, "")} alt="Post" className="w-12 h-12 rounded object-cover border border-gray-100" />}
                                                    </td>
                                                    <td className="p-3 text-gray-600">{post.likes?.length || 0}</td>
                                                    <td className="p-3 text-gray-600">{post.comment || 0}</td>
                                                    <td className="p-3 text-gray-600">{post.tags?.join(", ") || "None"}</td>
                                                    <td className="p-3 text-gray-500 text-xs">{new Date(post.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" onClick={() => handleViewPost(post)}><Visibility style={{ fontSize: 16 }} /></button>
                                                            <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" onClick={() => handleDeletePost(post)}><Delete style={{ fontSize: 16 }} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {selectedModal === "products" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left bg-white text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-700">Image</th>
                                                <th className="p-3 font-semibold text-gray-700">Product Name</th>
                                                <th className="p-3 font-semibold text-gray-700">Owner</th>
                                                <th className="p-3 font-semibold text-gray-700">Category</th>
                                                <th className="p-3 font-semibold text-gray-700">Type</th>
                                                <th className="p-3 font-semibold text-gray-700">For</th>
                                                <th className="p-3 font-semibold text-gray-700">Price</th>
                                                <th className="p-3 font-semibold text-gray-700">Location</th>
                                                <th className="p-3 font-semibold text-gray-700">Status</th>
                                                <th className="p-3 font-semibold text-gray-700">Valid Till</th>
                                                <th className="p-3 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {modalData.map(product => (
                                                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <img
                                                            src={getImageUrl(product.productImages?.[0], "/images/products/default.png")}
                                                            alt={product.productName}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                                                            onError={(e) => { e.target.src = "/images/products/default.png"; }}
                                                        />
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-900">{product.productName}</td>
                                                    <td className="p-3 text-gray-600">{product.userId?.username || "Unknown"}</td>
                                                    <td className="p-3 text-gray-600">{product.productCategory}</td>
                                                    <td className="p-3 text-gray-600">{product.productType}</td>
                                                    <td className="p-3 text-gray-600">{product.productFor}</td>
                                                    <td className="p-3 text-gray-600">{product.productPrice ? `NPR ${product.productPrice}` : "-"}</td>
                                                    <td className="p-3 text-gray-600">{product.location}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {product.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-500 text-xs">{new Date(product.validTill).toLocaleDateString()}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" onClick={() => handleViewProduct(product)}><Visibility style={{ fontSize: 16 }} /></button>
                                                            <button className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" onClick={() => handleEditProduct(product)}><Edit style={{ fontSize: 16 }} /></button>
                                                            <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" onClick={() => handleDeleteProduct(product)}><Delete style={{ fontSize: 16 }} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {selectedModal === "ads" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left bg-white text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 font-semibold text-gray-700">Image</th>
                                                <th className="p-3 font-semibold text-gray-700">Title</th>
                                                <th className="p-3 font-semibold text-gray-700">Description</th>
                                                <th className="p-3 font-semibold text-gray-700">Tag</th>
                                                <th className="p-3 font-semibold text-gray-700">Category</th>
                                                <th className="p-3 font-semibold text-gray-700">Priority</th>
                                                <th className="p-3 font-semibold text-gray-700">Status</th>
                                                <th className="p-3 font-semibold text-gray-700">Clicks</th>
                                                <th className="p-3 font-semibold text-gray-700">Impressions</th>
                                                <th className="p-3 font-semibold text-gray-700">Valid Till</th>
                                                <th className="p-3 font-semibold text-gray-700">Created By</th>
                                                <th className="p-3 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {modalData.map(ad => (
                                                <tr key={ad._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <img
                                                            src={getImageUrl(ad.image, "")} // Ad image usually a full URL, but just in case
                                                            alt={ad.title}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                                                        />
                                                    </td>
                                                    <td className="p-3 font-medium text-gray-900">{ad.title}</td>
                                                    <td className="p-3 text-gray-600">
                                                        <div className="max-w-xs truncate">
                                                            {ad.description.length > 50 ? ad.description.substring(0, 50) + "..." : ad.description}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-gray-600">{ad.tag}</td>
                                                    <td className="p-3 text-gray-600">{ad.targetCategory}</td>
                                                    <td className="p-3 text-gray-600">{ad.priority}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${ad.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {ad.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-gray-600">{ad.clickCount || 0}</td>
                                                    <td className="p-3 text-gray-600">{ad.impressionCount || 0}</td>
                                                    <td className="p-3 text-gray-500 text-xs">{new Date(ad.validTill).toLocaleDateString()}</td>
                                                    <td className="p-3 text-gray-600">{ad.createdBy?.username || "Unknown"}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <button className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" onClick={() => handleEditAd(ad)}><Edit style={{ fontSize: 16 }} /></button>
                                                            <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" onClick={() => handleDeleteAd(ad._id)}><Delete style={{ fontSize: 16 }} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>No data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
