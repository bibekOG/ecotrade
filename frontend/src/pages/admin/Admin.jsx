import React, { useContext, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import Layout from "../../components/layout/Layout";
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
        <div className="admin">
          <h2>Admin Access Required</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin">
        <div className="adminHeader">
          <div className="adminHeaderContent">
            <h1>Admin Dashboard</h1>
            <p>Monitor and manage your platform effectively</p>
          </div>
          <div className="adminHeaderWave"></div>
        </div>

        {loading ? (
          <div className="adminLoading">
            <div className="loadingSpinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {stats && (
              <div className="statsGrid">
                <div className="statCard clickable primary" onClick={() => handleCardClick("users")}>
                  <div className="statIcon"><People /></div>
                  <div className="statInfo">
                    <h4>Users</h4>
                    <span>{stats.users}</span>
                    <p>Total registered users</p>
                  </div>
                </div>
                
                <div className="statCard clickable success" onClick={() => handleCardClick("posts")}>
                  <div className="statIcon"><PostAdd /></div>
                  <div className="statInfo">
                    <h4>Posts</h4>
                    <span>{stats.posts}</span>
                    <p>Content shared by users</p>
                  </div>
                </div>
                
                <div className="statCard clickable info" onClick={() => handleCardClick("products")}>
                  <div className="statIcon"><Store /></div>
                  <div className="statInfo">
                    <h4>Products</h4>
                    <span>{stats.products}</span>
                    <p>Listed marketplace items</p>
                  </div>
                </div>
                
                <div className="statCard warning">
                  <div className="statIcon"><LocalOffer /></div>
                  <div className="statInfo">
                    <h4>Offers</h4>
                    <span>{stats.offers}</span>
                    <p>Purchase offers made</p>
                  </div>
                </div>
                
                <div className="statCard purple">
                  <div className="statIcon"><Flag /></div>
                  <div className="statInfo">
                    <h4>Claims</h4>
                    <span>{stats.claims}</span>
                    <p>Product claims</p>
                  </div>
                </div>
                
                <div className="statCard secondary">
                  <div className="statIcon"><Message /></div>
                  <div className="statInfo">
                    <h4>Product Msgs</h4>
                    <span>{stats.productMessages}</span>
                    <p>Product inquiries</p>
                  </div>
                </div>
                
                <div className="statCard teal">
                  <div className="statIcon"><Chat /></div>
                  <div className="statInfo">
                    <h4>Messages</h4>
                    <span>{stats.messages}</span>
                    <p>Direct messages</p>
                  </div>
                </div>
                
                <div className="statCard orange">
                  <div className="statIcon"><Comment /></div>
                  <div className="statInfo">
                    <h4>Comments</h4>
                    <span>{stats.comments}</span>
                    <p>Post comments</p>
                  </div>
                </div>
                
                <div className="statCard pink">
                  <div className="statIcon"><PersonAdd /></div>
                  <div className="statInfo">
                    <h4>Friend Reqs</h4>
                    <span>{stats.friendRequests}</span>
                    <p>Pending requests</p>
                  </div>
                </div>

                <div className="statCard clickable cyan" onClick={() => handleCardClick("ads")}>
                  <div className="statIcon"><Announcement /></div>
                  <div className="statInfo">
                    <h4>Advertisements</h4>
                    <span>{stats.ads}</span>
                    <p>Active promotions</p>
                  </div>
                </div>
              </div>
            )}

            <div className="filters">
              <h3>Filters</h3>
              <form onSubmit={fetchActivity} className="filterForm">
                <div className="filterRow">
                  <div className="filterGroup">
                    <label>User</label>
                    <select value={filter.userId} onChange={(e) => setFilter({ ...filter, userId: e.target.value })}>
                      <option value="">All Users</option>
                      {userOptions.map(u => (
                        <option key={u._id} value={u._id}>{u.username} ({u._id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="filterGroup">
                    <label>Product</label>
                    <select value={filter.productId} onChange={(e) => setFilter({ ...filter, productId: e.target.value })}>
                      <option value="">All Products</option>
                      {productOptions.map(p => (
                        <option key={p._id} value={p._id}>{p.productName} ({p._id})</option>
                      ))}
                    </select>
                  </div>
                  <div className="filterActions">
                    <button type="submit">Apply</button>
                    <button type="button" onClick={() => { setFilter({ userId: "", productId: "" }); setActivity(null); }}>Clear</button>
                  </div>
                </div>
              </form>
            </div>

            {activity && (
              <div className="recentGrid">
                <div className="recentPanel">
                  <h3>Filtered Posts</h3>
                  <ul>
                    {activity.posts?.map(p => (
                      <li key={p._id}>{p.desc?.slice(0, 60) || "(no text)"} – {new Date(p.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Filtered Offers</h3>
                  <ul>
                    {activity.offers?.map((o, idx) => (
                      <li key={idx}><strong>{o.productName}</strong> – {o.exchangeProduct ? `Exchange: ${o.exchangeProduct}` : `NRs. ${o.offerAmount || 0}`} – {new Date(o.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Filtered Claims</h3>
                  <ul>
                    {activity.claims?.map((c, idx) => (
                      <li key={idx}><strong>{c.productName}</strong> – {c.message?.slice(0, 60)} – {new Date(c.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Filtered Product Messages</h3>
                  <ul>
                    {activity.productMessages?.map(pm => (
                      <li key={pm._id}><strong>{pm.productId?.productName}</strong> {pm.senderId?.username} → {pm.receiverId?.username}: {pm.message?.slice(0, 60)}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Filtered Comments</h3>
                  <ul>
                    {activity.comments?.map(c => (
                      <li key={c._id}>{c.userId?.username}: {c.text?.slice(0, 60)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {recent && (
              <div className="recentGrid">
                <div className="recentPanel">
                  <h3>Recent Users</h3>
                  <ul>
                    {recent.users?.map(u => (
                      <li key={u._id}><strong>{u.username}</strong> {u.isAdmin ? "(admin)" : ""} – {new Date(u.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Recent Posts</h3>
                  <ul>
                    {recent.posts?.map(p => (
                      <li key={p._id}>{p.desc?.slice(0, 50) || "(no text)"} – {new Date(p.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Recent Products</h3>
                  <ul>
                    {recent.products?.map(pr => (
                      <li key={pr._id}><strong>{pr.productName}</strong> by {pr.userId?.username} – {new Date(pr.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Recent Offers</h3>
                  <ul>
                    {recent.offers?.map((o, idx) => (
                      <li key={idx}><strong>{o.productName}</strong> – {o.exchangeProduct ? `Exchange: ${o.exchangeProduct}` : `NRs. ${o.offerAmount || 0}`} – {new Date(o.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Recent Claims</h3>
                  <ul>
                    {recent.claims?.map((c, idx) => (
                      <li key={idx}><strong>{c.productName}</strong> – {c.message?.slice(0, 50)} – {new Date(c.createdAt).toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Recent Product Messages</h3>
                  <ul>
                    {recent.productMessages?.map(pm => (
                      <li key={pm._id}><strong>{pm.productId?.productName}</strong> {pm.senderId?.username} → {pm.receiverId?.username}: {pm.message?.slice(0, 50)}</li>
                    ))}
                  </ul>
                </div>
                <div className="recentPanel">
                  <h3>Recent Comments</h3>
                  <ul>
                    {recent.comments?.map(c => (
                      <li key={c._id}>{c.userId?.username}: {c.text?.slice(0, 50)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal for detailed view */}
        {selectedModal && (
          <div className="modal" onClick={closeModal}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h3>
                  {selectedModal === "users" && "Users Management"}
                  {selectedModal === "posts" && "Posts Management"}
                  {selectedModal === "products" && "Products Management"}
                  {selectedModal === "ads" && "Advertisements Management"}
                </h3>
                {selectedModal === "ads" && (
                  <button 
                    className="addBtn" 
                    onClick={() => setShowAdForm(true)}
                  >
                    + Add New Ad
                  </button>
                )}
                <button className="closeModal" onClick={closeModal}>
                  <Close />
                </button>
              </div>
              
              <div className="modalBody">
                {detailLoading ? (
                  <div className="modalLoading">
                    <div className="loadingSpinner"></div>
                    <p>Loading {selectedModal} data...</p>
                  </div>
                ) : modalData ? (
                  <div className="dataTable">
                    {selectedModal === "users" && (
                      <div className="tableWrapper">
                        <table className="adminTable">
                          <thead>
                            <tr>
                              <th>Avatar</th>
                              <th>Username</th>
                              <th>Full Name</th>
                              <th>Email</th>
                              <th>Friends</th>
                              <th>Posts</th>
                              <th>Status</th>
                              <th>Role</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalData.map(user => (
                              <tr key={user._id}>
                                <td>
                                  <img 
                                    src={user.profilePicture || "/images/person/noAvatar.png"} 
                                    alt={user.username}
                                    className="tableAvatar"
                                    onError={(e) => { e.target.src = "/images/person/noAvatar.png"; }}
                                  />
                                </td>
                                <td>{user.username}</td>
                                <td>{user.fullName}</td>
                                <td>{user.email}</td>
                                <td>{user.friends?.length || 0}</td>
                                <td>{user.postCount || 0}</td>
                                <td>
                                  <span className={`statusBadge ${user.status.toLowerCase()}`}>
                                    {user.status}
                                  </span>
                                </td>
                                <td>
                                  {user.isAdmin && <span className="adminBadge">ADMIN</span>}
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <div className="tableActions">
                                    <button className="actionBtn view" onClick={() => handleViewUser(user)}><Visibility /></button>
                                    <button className="actionBtn edit" onClick={() => handleEditUser(user)}><Edit /></button>
                                    <button className="actionBtn delete" onClick={() => handleDeleteUser(user)}><Delete /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedModal === "posts" && (
                      <div className="tableWrapper">
                        <table className="adminTable">
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Content</th>
                              <th>Image</th>
                              <th>Likes</th>
                              <th>Comments</th>
                              <th>Tags</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalData.map(post => (
                              <tr key={post._id}>
                                <td>
                                  <div className="userCell">
                                    <img 
                                      src={post.userId?.profilePicture || "/images/person/noAvatar.png"} 
                                      alt={post.userId?.username}
                                      className="tableAvatar"
                                      onError={(e) => { e.target.src = "/images/person/noAvatar.png"; }}
                                    />
                                    <span>{post.userId?.username || "Unknown"}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="contentCell">
                                    {post.desc ? (post.desc.length > 100 ? post.desc.substring(0, 100) + "..." : post.desc) : "No content"}
                                  </div>
                                </td>
                                <td>
                                  {post.img && <img src={post.img} alt="Post" className="tablePostImage" />}
                                </td>
                                <td>{post.likes?.length || 0}</td>
                                <td>{post.comment || 0}</td>
                                <td>{post.tags?.join(", ") || "None"}</td>
                                <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <div className="tableActions">
                                    <button className="actionBtn view" onClick={() => handleViewPost(post)}><Visibility /></button>
                                    <button className="actionBtn delete" onClick={() => handleDeletePost(post)}><Delete /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedModal === "products" && (
                      <div className="tableWrapper">
                        <table className="adminTable">
                          <thead>
                            <tr>
                              <th>Image</th>
                              <th>Product Name</th>
                              <th>Owner</th>
                              <th>Category</th>
                              <th>Type</th>
                              <th>For</th>
                              <th>Price</th>
                              <th>Location</th>
                              <th>Status</th>
                              <th>Valid Till</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalData.map(product => (
                              <tr key={product._id}>
                                <td>
                                  <img 
                                    src={product.productImages?.[0] || "/images/products/default.png"} 
                                    alt={product.productName}
                                    className="tableProductImage"
                                    onError={(e) => { e.target.src = "/images/products/default.png"; }}
                                  />
                                </td>
                                <td>{product.productName}</td>
                                <td>{product.userId?.username || "Unknown"}</td>
                                <td>{product.productCategory}</td>
                                <td>{product.productType}</td>
                                <td>{product.productFor}</td>
                                <td>{product.productPrice ? `NPR ${product.productPrice}` : "-"}</td>
                                <td>{product.location}</td>
                                <td>
                                  <span className={`statusBadge ${product.status.toLowerCase()}`}>
                                    {product.status}
                                  </span>
                                </td>
                                <td>{new Date(product.validTill).toLocaleDateString()}</td>
                                <td>
                                  <div className="tableActions">
                                    <button className="actionBtn view" onClick={() => handleViewProduct(product)}><Visibility /></button>
                                    <button className="actionBtn edit" onClick={() => handleEditProduct(product)}><Edit /></button>
                                    <button className="actionBtn delete" onClick={() => handleDeleteProduct(product)}><Delete /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedModal === "ads" && (
                      <div className="tableWrapper">
                        <table className="adminTable">
                          <thead>
                            <tr>
                              <th>Image</th>
                              <th>Title</th>
                              <th>Description</th>
                              <th>Tag</th>
                              <th>Category</th>
                              <th>Priority</th>
                              <th>Status</th>
                              <th>Clicks</th>
                              <th>Impressions</th>
                              <th>Valid Till</th>
                              <th>Created By</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalData.map(ad => (
                              <tr key={ad._id}>
                                <td>
                                  <img 
                                    src={ad.image} 
                                    alt={ad.title}
                                    className="tableAdImage"
                                  />
                                </td>
                                <td>{ad.title}</td>
                                <td>
                                  <div className="contentCell">
                                    {ad.description.length > 50 ? ad.description.substring(0, 50) + "..." : ad.description}
                                  </div>
                                </td>
                                <td>{ad.tag}</td>
                                <td>{ad.targetCategory}</td>
                                <td>{ad.priority}</td>
                                <td>
                                  <span className={`statusBadge ${ad.status.toLowerCase()}`}>
                                    {ad.status}
                                  </span>
                                </td>
                                <td>{ad.clickCount || 0}</td>
                                <td>{ad.impressionCount || 0}</td>
                                <td>{new Date(ad.validTill).toLocaleDateString()}</td>
                                <td>{ad.createdBy?.username || "Unknown"}</td>
                                <td>
                                  <div className="tableActions">
                                    <button className="actionBtn edit" onClick={() => handleEditAd(ad)}><Edit /></button>
                                    <button className="actionBtn delete" onClick={() => handleDeleteAd(ad._id)}><Delete /></button>
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
          <div className="modal" onClick={() => setShowAdForm(false)}>
            <div className="modalContent adFormModal" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h3>{editingAd ? "Edit Advertisement" : "Create New Advertisement"}</h3>
                <button className="closeModal" onClick={() => setShowAdForm(false)}>
                  <Close />
                </button>
              </div>
              
              <div className="modalBody">
                <form onSubmit={handleAdSubmit} className="adForm">
                  <div className="formRow">
                    <div className="formGroup">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={adFormData.title}
                        onChange={(e) => setAdFormData({...adFormData, title: e.target.value})}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="formGroup">
                      <label>Tag *</label>
                      <input
                        type="text"
                        value={adFormData.tag}
                        onChange={(e) => setAdFormData({...adFormData, tag: e.target.value})}
                        required
                        maxLength={50}
                        placeholder="e.g., Electronics, Fashion"
                      />
                    </div>
                  </div>

                  <div className="formGroup">
                    <label>Description *</label>
                    <textarea
                      value={adFormData.description}
                      onChange={(e) => setAdFormData({...adFormData, description: e.target.value})}
                      required
                      maxLength={200}
                      rows={3}
                    />
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Image URL *</label>
                      <input
                        type="url"
                        value={adFormData.image}
                        onChange={(e) => setAdFormData({...adFormData, image: e.target.value})}
                        required
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="formGroup">
                      <label>Link *</label>
                      <input
                        type="url"
                        value={adFormData.link}
                        onChange={(e) => setAdFormData({...adFormData, link: e.target.value})}
                        required
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="formRow">
                    <div className="formGroup">
                      <label>Target Category</label>
                      <select
                        value={adFormData.targetCategory}
                        onChange={(e) => setAdFormData({...adFormData, targetCategory: e.target.value})}
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
                    <div className="formGroup">
                      <label>Priority (1-10)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={adFormData.priority}
                        onChange={(e) => setAdFormData({...adFormData, priority: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="formGroup">
                    <label>Valid Until *</label>
                    <input
                      type="date"
                      value={adFormData.validTill}
                      onChange={(e) => setAdFormData({...adFormData, validTill: e.target.value})}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {adFormData.image && (
                    <div className="formGroup">
                      <label>Preview</label>
                      <div className="adPreview">
                        <img src={adFormData.image} alt="Ad Preview" />
                        <div className="adPreviewContent">
                          <div className="adPreviewTag">{adFormData.tag}</div>
                          <h5>{adFormData.title}</h5>
                          <p>{adFormData.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="formActions">
                    <button type="button" onClick={() => setShowAdForm(false)} className="cancelBtn">
                      Cancel
                    </button>
                    <button type="submit" className="submitBtn" disabled={detailLoading}>
                      {detailLoading ? "Saving..." : (editingAd ? "Update Ad" : "Create Ad")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}



