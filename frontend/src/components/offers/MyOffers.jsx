import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import "./myOffers.css";

export default function MyOffers() {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState({
    userProducts: [],
    userOffers: [],
    userClaims: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch user's products, offers made, and claims made in parallel for accuracy
      const [productsRes, offersRes, claimsRes] = await Promise.all([
        apiClient.get(`/products/user/${user._id}`),
        apiClient.get(`/products/offers/${user._id}`),
        apiClient.get(`/products/claims/${user._id}`),
      ]);

      setTransactions({
        userProducts: productsRes.data || [],
        userOffers: offersRes.data || [],
        userClaims: claimsRes.data || [],
      });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      console.error("Error details:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTransactions();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "#28a745";
      case "Booked": return "#ffc107";
      case "Sold": return "#dc3545";
      case "In Progress": return "#17a2b8";
      case "Expired": return "#6c757d";
      default: return "#6c757d";
    }
  };

  const getOfferStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#ffc107";
      case "Accepted": return "#28a745";
      case "Rejected": return "#dc3545";
      case "Expired": return "#6c757d";
      default: return "#6c757d";
    }
  };

  if (loading) {
    return (
      <div className="loadingContainer">
        <div className="loadingSpinner"></div>
        <p>Loading your transactions...</p>
      </div>
    );
  }

  return (
    <div className="myOffers">
      <div className="myOffersHeader">
        <h2>My Transactions & Offers</h2>
        <div className="headerActions">
          <button 
            className="refreshBtn"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>
          <div className="tabButtons">
            <button 
              className={`tabButton ${activeTab === "offers" ? "active" : ""}`}
              onClick={() => setActiveTab("offers")}
            >
              My Offers ({transactions.userOffers.length})
            </button>
            <button 
              className={`tabButton ${activeTab === "claims" ? "active" : ""}`}
              onClick={() => setActiveTab("claims")}
            >
              My Claims ({transactions.userClaims.length})
            </button>
            <button 
              className={`tabButton ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              My Products ({transactions.userProducts.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "offers" && (
        <div className="offersList">
          <h3>Offers I've Made</h3>
          {transactions.userOffers.length === 0 ? (
            <div className="noDataMessage">
              <div className="noDataIcon">📝</div>
              <p>You haven't made any offers yet</p>
            </div>
          ) : (
            <div className="tableContainer">
              <div className="tableWrapper">
                <table className="offersTable">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Product Type</th>
                      <th>My Offer</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.userOffers.map(product => 
                      product.offers
                        .filter(offer => offer.userId._id === user._id)
                        .map(offer => (
                          <tr key={`${product._id}-${offer._id}`}>
                            <td className="itemCell">
                              <div className="itemInfo">
                                <img 
                                  src={product.productImages?.[0] || "/assets/person/noAvatar.png"} 
                                  alt={product.productName}
                                  className="itemImage"
                                  onError={(e) => {
                                    e.target.src = "/assets/person/noAvatar.png";
                                  }}
                                />
                                <div className="itemDetails">
                                  <h4>{product.productName}</h4>
                                  <p>{product.productCategory}</p>
                                  <span className="productStatus" style={{ backgroundColor: getStatusColor(product.status) }}>
                                    {product.status}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="productTypeCell">
                              <span className={`typeBadge ${product.productFor.toLowerCase()}`}>
                                {product.productFor}
                              </span>
                            </td>
                            <td className="myOfferCell">
                              {product.productFor === "Sale" && (
                                <div className="offerAmount">
                                  <strong>NRs. {offer.offerAmount}</strong>
                                </div>
                              )}
                              {product.productFor === "Exchange" && (
                                <div className="exchangeProduct">
                                  <strong>{offer.exchangeProduct}</strong>
                                </div>
                              )}
                              {product.productFor === "Giveaway" && (
                                <div className="giveawayClaim">
                                  <strong>Free Claim</strong>
                                </div>
                              )}
                            </td>
                            <td className="statusCell">
                              <span 
                                className="statusBadge"
                                style={{ backgroundColor: getOfferStatusColor(offer.status) }}
                              >
                                {offer.status}
                              </span>
                            </td>
                            <td className="ownerCell">
                              <div className="userInfo">
                                <img 
                                  src={product.userId?.profilePicture || "/assets/person/noAvatar.png"} 
                                  alt={product.userId?.username}
                                  className="userAvatar"
                                  onError={(e) => {
                                    e.target.src = "/assets/person/noAvatar.png";
                                  }}
                                />
                                <div className="userDetails">
                                  <strong>{product.userId?.username}</strong>
                                </div>
                              </div>
                            </td>
                            <td className="messageCell">
                              <div className="messageContent">
                                <p><strong>My Message:</strong></p>
                                <p>{offer.message}</p>
                                {offer.status === "Accepted" && offer.responseMessage && (
                                  <div className="responseMessage">
                                    <strong>Owner's Response:</strong> {offer.responseMessage}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="actionsCell">
                              <div className="actionButtons">
                                <span className="offerDate">
                                  Offered: {new Date(offer.createdAt).toLocaleDateString()}
                                </span>
                                <span className="claimTill">
                                  Valid till: {new Date(offer.claimTill).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "claims" && (
        <div className="claimsList">
          <h3>Claims I've Made</h3>
          {transactions.userClaims.length === 0 ? (
            <div className="noDataMessage">
              <div className="noDataIcon">🎁</div>
              <p>You haven't made any claims yet</p>
            </div>
          ) : (
            <div className="tableContainer">
              <div className="tableWrapper">
                <table className="offersTable">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Product Type</th>
                      <th>Claim Type</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.userClaims.map(product => 
                      product.claims
                        .filter(claim => claim.userId._id === user._id)
                        .map(claim => (
                          <tr key={`${product._id}-${claim._id}`}>
                            <td className="itemCell">
                              <div className="itemInfo">
                                <img 
                                  src={product.productImages?.[0] || "/assets/person/noAvatar.png"} 
                                  alt={product.productName}
                                  className="itemImage"
                                  onError={(e) => {
                                    e.target.src = "/assets/person/noAvatar.png";
                                  }}
                                />
                                <div className="itemDetails">
                                  <h4>{product.productName}</h4>
                                  <p>{product.productCategory}</p>
                                  <span className="productStatus" style={{ backgroundColor: getStatusColor(product.status) }}>
                                    {product.status}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="productTypeCell">
                              <span className={`typeBadge ${product.productFor.toLowerCase()}`}>
                                {product.productFor}
                              </span>
                            </td>
                            <td className="claimTypeCell">
                              <span className="claimType">Free Claim</span>
                            </td>
                            <td className="statusCell">
                              <span 
                                className="statusBadge"
                                style={{ backgroundColor: getOfferStatusColor(claim.status) }}
                              >
                                {claim.status}
                              </span>
                            </td>
                            <td className="ownerCell">
                              <div className="userInfo">
                                <img 
                                  src={product.userId?.profilePicture || "/assets/person/noAvatar.png"} 
                                  alt={product.userId?.username}
                                  className="userAvatar"
                                  onError={(e) => {
                                    e.target.src = "/assets/person/noAvatar.png";
                                  }}
                                />
                                <div className="userDetails">
                                  <strong>{product.userId?.username}</strong>
                                </div>
                              </div>
                            </td>
                            <td className="messageCell">
                              <div className="messageContent">
                                <p><strong>My Message:</strong></p>
                                <p>{claim.message}</p>
                                {claim.status === "Accepted" && claim.responseMessage && (
                                  <div className="responseMessage">
                                    <strong>Owner's Response:</strong> {claim.responseMessage}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="actionsCell">
                              <div className="actionButtons">
                                <span className="claimDate">
                                  Claimed: {new Date(claim.createdAt).toLocaleDateString()}
                                </span>
                                <span className="claimTill">
                                  Valid till: {new Date(claim.claimTill).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="productsList">
          <h3>My Products Status</h3>
          {transactions.userProducts.length === 0 ? (
            <div className="noDataMessage">
              <div className="noDataIcon">📦</div>
              <p>You don't have any active products</p>
            </div>
          ) : (
            <div className="tableContainer">
              <div className="tableWrapper">
                <table className="offersTable">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Offers</th>
                      <th>Claims</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.userProducts.map(product => (
                      <tr key={product._id}>
                        <td className="itemCell">
                          <div className="itemInfo">
                            <img 
                              src={product.productImages?.[0] || "/assets/person/noAvatar.png"} 
                              alt={product.productName}
                              className="itemImage"
                              onError={(e) => {
                                e.target.src = "/assets/person/noAvatar.png";
                              }}
                            />
                            <div className="itemDetails">
                              <h4>{product.productName}</h4>
                              <p>{product.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="categoryCell">
                          <span className="categoryBadge">{product.productCategory}</span>
                        </td>
                        <td className="productTypeCell">
                          <span className={`typeBadge ${product.productFor.toLowerCase()}`}>
                            {product.productFor}
                          </span>
                        </td>
                        <td className="statusCell">
                          <span 
                            className="statusBadge"
                            style={{ backgroundColor: getStatusColor(product.status) }}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="offersCell">
                          <div className="statsInfo">
                            <div className="statItem">
                              <span className="statLabel">Total:</span>
                              <span className="statValue">{product.offers?.length || 0}</span>
                            </div>
                            <div className="statItem">
                              <span className="statLabel">Pending:</span>
                              <span className="statValue">
                                {product.offers?.filter(o => o.status === "Pending").length || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="claimsCell">
                          <div className="statsInfo">
                            <div className="statItem">
                              <span className="statLabel">Total:</span>
                              <span className="statValue">{product.claims?.length || 0}</span>
                            </div>
                            <div className="statItem">
                              <span className="statLabel">Pending:</span>
                              <span className="statValue">
                                {product.claims?.filter(c => c.status === "Pending").length || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="actionsCell">
                          <div className="actionButtons">
                            {product.currentBuyer && (
                              <div className="currentBuyer">
                                <strong>Current Buyer:</strong> {product.currentBuyer.username}
                              </div>
                            )}
                            {product.transactionDate && (
                              <div className="transactionDate">
                                <strong>Transaction:</strong> {new Date(product.transactionDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

