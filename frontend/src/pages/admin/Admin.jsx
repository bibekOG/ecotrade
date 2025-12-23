import React, { useContext, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import Layout from "../../components/layout/Layout";
import Rightbar from "../../components/rightbar/Rightbar";
import { AuthContext } from "../../context/AuthContext";
import {
  People,
  PostAdd,
  Store,
  LocalOffer,
  Flag,
  Message,
  Chat,
  Comment,
  PersonAdd,
  Close,
  Visibility,
  Delete,
  Edit,
  Announcement
} from "@material-ui/icons";
import "./admin.css";

export default function Admin() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ userId: "", productId: "" });
  const [activity, setActivity] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [selectedModal, setSelectedModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAdForm, setShowAdForm] = useState(false);
  const [ads, setAds] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [adFormData, setAdFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    tag: "",
    validTill: "",
    targetCategory: "All",
    priority: 1
  });

  useEffect(() => {
    if (!user?.isAdmin) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, r, usersList, productsList] = await Promise.all([
          apiClient.get(`/admin/stats`, { headers: { "x-admin-id": user._id } }),
          apiClient.get(`/admin/recent?limit=10`, { headers: { "x-admin-id": user._id } }),
          apiClient.get(`/admin/users-list?limit=500`, { headers: { "x-admin-id": user._id } }),
          apiClient.get(`/admin/products-list?limit=500`, { headers: { "x-admin-id": user._id } }),
        ]);
        setStats(s.data);
        setRecent(r.data);
        setUserOptions(usersList.data || []);
        setProductOptions(productsList.data || []);
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
        alert("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const fetchActivity = async (e) => {
    e?.preventDefault();
    if (!user?.isAdmin) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.userId) params.append("userId", filter.userId);
      if (filter.productId) params.append("productId", filter.productId);
      params.append("limit", "20");
      const res = await apiClient.get(`/admin/activity?${params.toString()}`, { headers: { "x-admin-id": user._id } });
      setActivity(res.data);
    } catch (err) {
      console.error("Error loading activity:", err);
      alert("Failed to load activity.");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (type) => {
    if (!user?.isAdmin) return;
    setSelectedModal(type);
    setDetailLoading(true);
    setModalData(null);

    try {
      let endpoint = "";
      switch (type) {
        case "users":
          endpoint = "/admin/users-detailed?limit=50";
          break;
        case "posts":
          endpoint = "/admin/posts-detailed?limit=50";
          break;
        case "products":
          endpoint = "/admin/products-detailed?limit=50";
          break;
        case "ads":
          endpoint = "/admin/ads";
          break;
        default:
          return;
      }

      const res = await apiClient.get(endpoint, { headers: { "x-admin-id": user._id } });
      setModalData(res.data);
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      alert(`Failed to load ${type} data.`);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const res = await apiClient.get("/admin/ads", { headers: { "x-admin-id": user._id } });
      setAds(res.data);
    } catch (err) {
      console.error("Error fetching ads:", err);
    }
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    if (!user?.isAdmin) return;

    try {
      setDetailLoading(true);
      if (editingAd) {
        await apiClient.put(`/admin/ads/${editingAd._id}`, adFormData, {
          headers: { "x-admin-id": user._id }
        });
      } else {
        await apiClient.post("/admin/ads", adFormData, {
          headers: { "x-admin-id": user._id }
        });
      }

      setShowAdForm(false);
      setEditingAd(null);
      setAdFormData({
        title: "",
        description: "",
        image: "",
        link: "",
        tag: "",
        validTill: "",
        targetCategory: "All",
        priority: 1
      });

      if (selectedModal === "ads") {
        handleCardClick("ads");
      }
    } catch (err) {
      console.error("Error saving ad:", err);
      alert("Failed to save ad.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setAdFormData({
      title: ad.title,
      description: ad.description,
      image: ad.image,
      link: ad.link,
      tag: ad.tag,
      validTill: ad.validTill.split('T')[0], // Format for date input
      targetCategory: ad.targetCategory,
      priority: ad.priority
    });
    setShowAdForm(true);
  };

  const handleDeleteAd = async (adId) => {
    if (!user?.isAdmin || !window.confirm("Are you sure you want to delete this ad?")) return;

    try {
      await apiClient.delete(`/admin/ads/${adId}`, {
        headers: { "x-admin-id": user._id }
      });

      if (selectedModal === "ads") {
        handleCardClick("ads");
      }
    } catch (err) {
      console.error("Error deleting ad:", err);
      alert("Failed to delete ad.");
    }
  };

  const closeModal = () => {
    setSelectedModal(null);
    setModalData(null);
  };

  const handleViewUser = (targetUser) => {
    // Show user details in a modal or navigate to user profile
    const userInfo = `User: ${targetUser.username}
Full Name: ${targetUser.fullName}
Email: ${targetUser.email}
Status: ${targetUser.status}
Role: ${targetUser.isAdmin ? 'Admin' : 'User'}
Friends: ${targetUser.friends?.length || 0}
Posts: ${targetUser.postCount || 0}
Created: ${new Date(targetUser.createdAt).toLocaleString()}`;

    alert(userInfo);
  };

  const handleEditUser = async (targetUser) => {
    if (!targetUser || !window.confirm(`Are you sure you want to edit user: ${targetUser.username}?`)) return;

    const action = prompt(`Choose action for ${targetUser.username}:\n1. Toggle Status (active/banned)\n2. Toggle Role (admin/user)\n3. Send Warning\nEnter 1, 2, or 3:`);

    if (!action) return;

    try {
      if (action === "1") {
        const newStatus = targetUser.status === 'active' ? 'banned' : 'active';
        await apiClient.put(`/admin/users/${targetUser._id}`, {
          status: newStatus
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert(`User ${targetUser.username} status changed to ${newStatus}`);
      } else if (action === "2") {
        const newRole = targetUser.isAdmin ? false : true;
        await apiClient.put(`/admin/users/${targetUser._id}`, {
          isAdmin: newRole
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert(`User ${targetUser.username} role changed to ${newRole ? 'Admin' : 'User'}`);
      } else if (action === "3") {
        await apiClient.put(`/admin/users/${targetUser._id}/warn`, {}, {
          headers: { "x-admin-id": user._id }
        });
        alert(`Warning sent to ${targetUser.username}`);
      } else {
        alert("Invalid action selected");
        return;
      }

      // Refresh the data
      handleCardClick("users");
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!user?.isAdmin || !window.confirm(`Are you sure you want to delete user: ${targetUser.username}? This action cannot be undone.`)) return;

    try {
      await apiClient.delete(`/admin/users/${targetUser._id}`, {
        headers: { "x-admin-id": user._id }
      });

      // Refresh the data
      handleCardClick("users");
      alert(`User ${targetUser.username} deleted successfully!`);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleViewPost = (post) => {
    const postInfo = `Post by: ${post.userId?.username || 'Unknown'}
Content: ${post.desc || 'No content'}
Image: ${post.img ? 'Yes' : 'No'}
Likes: ${post.likes?.length || 0}
Comments: ${post.comment || 0}
Tags: ${post.tags?.join(", ") || 'None'}
Created: ${new Date(post.createdAt).toLocaleString()}`;

    alert(postInfo);
  };

  const handleDeletePost = async (post) => {
    if (!user?.isAdmin || !window.confirm(`Are you sure you want to delete this post?`)) return;

    const action = prompt(`Choose action for this post:\n1. Delete Post\n2. Hide Post\n3. Mark as Inappropriate\nEnter 1, 2, or 3:`);

    if (!action) return;

    try {
      if (action === "1") {
        await apiClient.delete(`/admin/posts/${post._id}`, {
          headers: { "x-admin-id": user._id }
        });
        alert("Post deleted successfully!");
      } else if (action === "2") {
        await apiClient.put(`/admin/posts/${post._id}`, {
          hidden: true
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert("Post hidden successfully!");
      } else if (action === "3") {
        await apiClient.put(`/admin/posts/${post._id}`, {
          inappropriate: true
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert("Post marked as inappropriate!");
      } else {
        alert("Invalid action selected");
        return;
      }

      // Refresh the data
      handleCardClick("posts");
    } catch (err) {
      console.error("Error handling post:", err);
      alert("Failed to handle post.");
    }
  };

  const handleViewProduct = (product) => {
    const productInfo = `Product: ${product.productName}
Owner: ${product.userId?.username || 'Unknown'}
Category: ${product.productCategory}
Type: ${product.productType}
For: ${product.productFor}
Price: ${product.productPrice ? `NPR ${product.productPrice}` : 'Not specified'}
Location: ${product.location}
Status: ${product.status}
Valid Till: ${new Date(product.validTill).toLocaleDateString()}
Created: ${new Date(product.createdAt).toLocaleDateString()}`;

    alert(productInfo);
  };

  const handleEditProduct = async (product) => {
    if (!user?.isAdmin || !window.confirm(`Are you sure you want to edit product: ${product.productName}?`)) return;

    const action = prompt(`Choose action for ${product.productName}:\n1. Toggle Status (Active/Inactive)\n2. Mark as Featured\n3. Mark as Suspicious\nEnter 1, 2, or 3:`);

    if (!action) return;

    try {
      if (action === "1") {
        const newStatus = product.status === 'Active' ? 'Inactive' : 'Active';
        await apiClient.put(`/admin/products/${product._id}`, {
          status: newStatus
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert(`Product ${product.productName} status changed to ${newStatus}`);
      } else if (action === "2") {
        await apiClient.put(`/admin/products/${product._id}`, {
          featured: !product.featured
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert(`Product ${product.productName} featured status toggled`);
      } else if (action === "3") {
        await apiClient.put(`/admin/products/${product._id}`, {
          suspicious: !product.suspicious
        }, {
          headers: { "x-admin-id": user._id }
        });
        alert(`Product ${product.productName} suspicious status toggled`);
      } else {
        alert("Invalid action selected");
        return;
      }

      // Refresh the data
      handleCardClick("products");
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product.");
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!user?.isAdmin || !window.confirm(`Are you sure you want to delete product: ${product.productName}? This action cannot be undone.`)) return;

    try {
      await apiClient.delete(`/admin/products/${product._id}`, {
        headers: { "x-admin-id": user._id }
      });

      // Refresh the data
      handleCardClick("products");
      alert(`Product ${product.productName} deleted successfully!`);
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product.");
    }
  };

  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5] items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Access Required</h2>
            <p className="text-gray-600">You do not have permission to view this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-56px)] bg-[#f0f2f5]">
        <div className="adminPageContent flex-[9] p-5">
          <div className="adminHeader bg-white p-5 rounded-xl shadow-sm mb-6">
            <div className="adminHeaderContent text-left">
              <h1 className="text-2xl font-bold text-gray-900 m-0">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1 m-0">Monitor and manage your platform effectively</p>
            </div>
          </div>

          {loading ? (
            <div className="adminLoading">
              <div className="loadingSpinner"></div>
              <p>Loading dashboard data...</p>
            </div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleCardClick("users")}>
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <People />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.users}</span>
                      <span className="text-sm text-gray-500 font-medium">Users</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleCardClick("posts")}>
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <PostAdd />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.posts}</span>
                      <span className="text-sm text-gray-500 font-medium">Posts</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleCardClick("products")}>
                    <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <Store />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.products}</span>
                      <span className="text-sm text-gray-500 font-medium">Products</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleCardClick("ads")}>
                    <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                      <Announcement />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.ads}</span>
                      <span className="text-sm text-gray-500 font-medium">Ads</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                      <LocalOffer />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.offers}</span>
                      <span className="text-sm text-gray-500 font-medium">Offers</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                      <Flag />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.claims}</span>
                      <span className="text-sm text-gray-500 font-medium">Claims</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                      <Chat />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.messages}</span>
                      <span className="text-sm text-gray-500 font-medium">Messages</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                      <PersonAdd />
                    </div>
                    <div>
                      <span className="block text-xl font-bold text-gray-900 leading-none">{stats.friendRequests}</span>
                      <span className="text-sm text-gray-500 font-medium">Requests</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Filters</h3>
                <form onSubmit={fetchActivity} className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-600 mb-1">User</label>
                    <select
                      value={filter.userId}
                      onChange={(e) => setFilter({ ...filter, userId: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    >
                      <option value="">All Users</option>
                      {userOptions.map(u => (
                        <option key={u._id} value={u._id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
                    <select
                      value={filter.productId}
                      onChange={(e) => setFilter({ ...filter, productId: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    >
                      <option value="">All Products</option>
                      {productOptions.map(p => (
                        <option key={p._id} value={p._id}>{p.productName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Apply
                    </button>
                    <button type="button" onClick={() => { setFilter({ userId: "", productId: "" }); setActivity(null); }} className="px-6 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      Clear
                    </button>
                  </div>
                </form>
              </div>

              {activity && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <PostAdd className="text-blue-500" fontSize="small" /> Filtered Posts
                    </h3>
                    {activity.posts?.length > 0 ? (
                      <ul className="space-y-3">
                        {activity.posts.map(p => (
                          <li key={p._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <p className="text-gray-700 font-medium mb-1 line-clamp-2">{p.desc || "(no text)"}</p>
                            <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No posts found</p>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <LocalOffer className="text-orange-500" fontSize="small" /> Filtered Offers
                    </h3>
                    {activity.offers?.length > 0 ? (
                      <ul className="space-y-3">
                        {activity.offers.map((o, idx) => (
                          <li key={idx} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{o.productName}</div>
                            <div className="text-gray-600 mb-1">
                              {o.exchangeProduct ? <span className="text-blue-600">Exchange: {o.exchangeProduct}</span> : <span className="text-green-600">NRs. {o.offerAmount || 0}</span>}
                            </div>
                            <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No offers found</p>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Flag className="text-red-500" fontSize="small" /> Filtered Claims
                    </h3>
                    {activity.claims?.length > 0 ? (
                      <ul className="space-y-3">
                        {activity.claims.map((c, idx) => (
                          <li key={idx} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{c.productName}</div>
                            <p className="text-gray-600 mb-1 line-clamp-2">{c.message}</p>
                            <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No claims found</p>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Message className="text-purple-500" fontSize="small" /> Filtered Product Messages
                    </h3>
                    {activity.productMessages?.length > 0 ? (
                      <ul className="space-y-3">
                        {activity.productMessages.map(pm => (
                          <li key={pm._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{pm.productId?.productName}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <span className="font-medium text-blue-600">{pm.senderId?.username}</span>
                              <span>→</span>
                              <span className="font-medium text-blue-600">{pm.receiverId?.username}</span>
                            </div>
                            <p className="text-gray-600 line-clamp-2">{pm.message}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No messages found</p>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Comment className="text-teal-500" fontSize="small" /> Filtered Comments
                    </h3>
                    {activity.comments?.length > 0 ? (
                      <ul className="space-y-3">
                        {activity.comments.map(c => (
                          <li key={c._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{c.userId?.username}</div>
                            <p className="text-gray-600 mb-1 line-clamp-2">{c.text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No comments found</p>
                    )}
                  </div>
                </div>
              )}

              {recent && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <People className="text-blue-600" fontSize="small" /> Recent Users
                    </h3>
                    {recent.users?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.users.map(u => (
                          <li key={u._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <img
                              src={u.profilePicture || "/images/person/noAvatar.png"}
                              onError={(e) => { e.target.src = "/images/person/noAvatar.png"; }}
                              className="w-8 h-8 rounded-full object-cover"
                              alt={u.username}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800 truncate">{u.username}</span>
                                {u.isAdmin && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                              </div>
                              <span className="text-xs text-gray-500 block">{new Date(u.createdAt).toLocaleString()}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent users</p>}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <PostAdd className="text-green-600" fontSize="small" /> Recent Posts
                    </h3>
                    {recent.posts?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.posts.map(p => (
                          <li key={p._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <p className="text-gray-700 font-medium mb-1 line-clamp-2">{p.desc || "(no text)"}</p>
                            <span className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent posts</p>}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Store className="text-purple-600" fontSize="small" /> Recent Products
                    </h3>
                    {recent.products?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.products.map(pr => (
                          <li key={pr._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{pr.productName}</div>
                            <div className="text-xs text-gray-500 mb-1">by <span className="font-medium text-gray-700">{pr.userId?.username}</span></div>
                            <span className="text-xs text-gray-400">{new Date(pr.createdAt).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent products</p>}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <LocalOffer className="text-orange-500" fontSize="small" /> Recent Offers
                    </h3>
                    {recent.offers?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.offers.map((o, idx) => (
                          <li key={idx} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{o.productName}</div>
                            <div className="text-gray-600 mb-1">
                              {o.exchangeProduct ? <span className="text-blue-600">Exchange: {o.exchangeProduct}</span> : <span className="text-green-600">NRs. {o.offerAmount || 0}</span>}
                            </div>
                            <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent offers</p>}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Flag className="text-red-500" fontSize="small" /> Recent Claims
                    </h3>
                    {recent.claims?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.claims.map((c, idx) => (
                          <li key={idx} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{c.productName}</div>
                            <p className="text-gray-600 mb-1 line-clamp-2">{c.message}</p>
                            <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent claims</p>}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Message className="text-teal-500" fontSize="small" /> Recent Product Msgs
                    </h3>
                    {recent.productMessages?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.productMessages.map(pm => (
                          <li key={pm._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{pm.productId?.productName}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <span className="font-medium text-blue-600">{pm.senderId?.username}</span>
                              <span>→</span>
                              <span className="font-medium text-blue-600">{pm.receiverId?.username}</span>
                            </div>
                            <p className="text-gray-600 line-clamp-2">{pm.message}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent messages</p>}
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                      <Comment className="text-pink-500" fontSize="small" /> Recent Comments
                    </h3>
                    {recent.comments?.length > 0 ? (
                      <ul className="space-y-3">
                        {recent.comments.map(c => (
                          <li key={c._id} className="text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="font-semibold text-gray-800 mb-1">{c.userId?.username}</div>
                            <p className="text-gray-600 mb-1 line-clamp-2">{c.text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-400 italic">No recent comments</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal for detailed view */}
          {selectedModal && (
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
                                      src={user.profilePicture || "/images/person/noAvatar.png"}
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
                                        src={post.userId?.profilePicture || "/images/person/noAvatar.png"}
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
                                    {post.img && <img src={post.img} alt="Post" className="w-12 h-12 rounded object-cover border border-gray-100" />}
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
                                      src={product.productImages?.[0] || "/images/products/default.png"}
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
                                      src={ad.image}
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
          )}

          {/* Ad Form Modal */}
          {showAdForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] backdrop-blur-sm" onClick={() => setShowAdForm(false)}>
              <div className="bg-white rounded-xl w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <h3 className="text-xl font-bold text-gray-900 m-0">{editingAd ? "Edit Advertisement" : "Create New Advertisement"}</h3>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors border-none cursor-pointer" onClick={() => setShowAdForm(false)}>
                    <Close style={{ fontSize: 20 }} />
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handleAdSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Title *</label>
                        <input
                          type="text"
                          value={adFormData.title}
                          onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
                          required
                          maxLength={100}
                          className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Tag *</label>
                        <input
                          type="text"
                          value={adFormData.tag}
                          onChange={(e) => setAdFormData({ ...adFormData, tag: e.target.value })}
                          required
                          maxLength={50}
                          placeholder="e.g., Electronics, Fashion"
                          className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Description *</label>
                      <textarea
                        value={adFormData.description}
                        onChange={(e) => setAdFormData({ ...adFormData, description: e.target.value })}
                        required
                        maxLength={200}
                        rows={3}
                        className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Image URL *</label>
                        <input
                          type="url"
                          value={adFormData.image}
                          onChange={(e) => setAdFormData({ ...adFormData, image: e.target.value })}
                          required
                          placeholder="https://example.com/image.jpg"
                          className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Link *</label>
                        <input
                          type="url"
                          value={adFormData.link}
                          onChange={(e) => setAdFormData({ ...adFormData, link: e.target.value })}
                          required
                          placeholder="https://example.com"
                          className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Target Category</label>
                        <select
                          value={adFormData.targetCategory}
                          onChange={(e) => setAdFormData({ ...adFormData, targetCategory: e.target.value })}
                          className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white"
                        >
                          <option value="All">All Users</option>
                          <option value="Books">Books</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Home">Home</option>
                          <option value="Sports">Sports</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Priority (1-10)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={adFormData.priority}
                          onChange={(e) => setAdFormData({ ...adFormData, priority: parseInt(e.target.value) })}
                          className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Valid Until *</label>
                      <input
                        type="date"
                        value={adFormData.validTill}
                        onChange={(e) => setAdFormData({ ...adFormData, validTill: e.target.value })}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    {adFormData.image && (
                      <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-sm font-medium text-gray-700">Preview</label>
                        <div className="relative rounded-lg overflow-hidden aspect-video bg-gray-100">
                          <img src={adFormData.image} alt="Ad Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                            <div className="bg-blue-600 text-xs font-bold px-2 py-0.5 rounded-md w-fit mb-1">{adFormData.tag}</div>
                            <h5 className="font-bold text-lg mb-0.5">{adFormData.title}</h5>
                            <p className="text-sm opacity-90 line-clamp-2">{adFormData.description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowAdForm(false)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={detailLoading}
                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {detailLoading ? "Saving..." : (editingAd ? "Update Ad" : "Create Ad")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hidden lg:block lg:flex-[3.5]">
          <Rightbar />
        </div>
      </div>
    </Layout>
  );
}



