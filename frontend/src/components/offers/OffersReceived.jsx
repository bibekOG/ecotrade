import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import "./offersReceived.css";

export default function OffersReceived() {
  const { user } = useContext(AuthContext);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("offers");

  useEffect(() => {
    fetchReceivedOffers();
    fetchReceivedClaims();
  }, []);

  const fetchReceivedOffers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/products/received-offers/${user._id}`);
      setReceivedOffers(res.data);
    } catch (err) {
      console.error("Error fetching received offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedClaims = async () => {
    try {
      const res = await apiClient.get(`/products/received-claims/${user._id}`);
      setReceivedClaims(res.data);
    } catch (err) {
      console.error("Error fetching received claims:", err);
    }
  };

  const handleAcceptOffer = async (productId, offerId, buyerId) => {
    try {
      await apiClient.put(`/products/${productId}/accept-offer/${offerId}`, {
        userId: user._id,
        buyerId: buyerId,
        responseMessage: "Offer accepted! Please contact me to proceed."
      });

      // Refresh the data
      fetchReceivedOffers();
      fetchReceivedClaims();
    } catch (err) {
      console.error("Error accepting offer:", err);
    }
  };

  const handleAcceptClaim = async (productId, claimId, buyerId) => {
    try {
      await apiClient.put(`/products/${productId}/accept-claim/${claimId}`, {
        userId: user._id,
        buyerId: buyerId,
        responseMessage: "Claim accepted! Please contact me to proceed."
      });

      // Refresh the data
      fetchReceivedOffers();
      fetchReceivedClaims();
    } catch (err) {
      console.error("Error accepting claim:", err);
    }
  };

  const handleRejectOffer = async (productId, offerId) => {
    try {
      await apiClient.put(`/products/${productId}/offer/${offerId}`, {
        userId: user._id,
        status: "Rejected"
      });

      // Refresh the data
      fetchReceivedOffers();
      fetchReceivedClaims();
    } catch (err) {
      console.error("Error rejecting offer:", err);
    }
  };

  const handleRejectClaim = async (productId, claimId) => {
    try {
      await apiClient.put(`/products/${productId}/claim/${claimId}`, {
        userId: user._id,
        status: "Rejected"
      });

      // Refresh the data
      fetchReceivedOffers();
      fetchReceivedClaims();
    } catch (err) {
      console.error("Error rejecting claim:", err);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      await apiClient.put(`/products/${productId}/status`, {
        userId: user._id,
        status: newStatus
      });

      // Refresh the data
      fetchReceivedOffers();
      fetchReceivedClaims();
    } catch (err) {
      console.error("Error updating product status:", err);
    }
  };

  const handleCompleteTransaction = async (productId) => {
    try {
      await apiClient.put(`/products/${productId}/complete-transaction`, {
        userId: user._id
      });

      // Refresh the data
      fetchReceivedOffers();
      fetchReceivedClaims();
    } catch (err) {
      console.error("Error completing transaction:", err);
    }
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
      <div className="offersReceived">
        <div className="loadingContainer">
          <div className="loadingSpinner"></div>
          <p>Loading received offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offersReceived">
      <div className="offersReceivedHeader">
        <h2>Offers & Claims Received</h2>
        <div className="tabButtons">
          <button
            className={`tabButton ${activeTab === "offers" ? "active" : ""}`}
            onClick={() => setActiveTab("offers")}
          >
            Offers ({receivedOffers.length})
          </button>
          <button
            className={`tabButton ${activeTab === "claims" ? "active" : ""}`}
            onClick={() => setActiveTab("claims")}
          >
            Claims ({receivedClaims.length})
          </button>
        </div>
      </div>

      {activeTab === "offers" && (
        <div className="tableContainer">
          {receivedOffers.length === 0 ? (
            <div className="noDataMessage">
              <div className="noDataIcon">📭</div>
              <h3>No Offers Received</h3>
              <p>You haven't received any offers yet. When you do, they'll appear here.</p>
            </div>
          ) : (
            <div className="tableWrapper">
              <table className="offersTable">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Asked Offers</th>
                    <th>Offered Offer</th>
                    <th>Offered By</th>
                    <th>Offer Message</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedOffers.map(product =>
                    product.offers.map(offer => (
                      <tr key={`${product._id}-${offer._id}`} className="offerRow">
                        <td className="itemCell">
                          <div className="itemInfo">
                            <div className="itemImage">
                              <img
                                src={product.productImages?.[0] || "/assets/post/1.jpeg"}
                                alt={product.productName}
                                onError={(e) => {
                                  e.target.src = "/assets/post/1.jpeg";
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                            <div className="itemDetails">
                              <h4>{product.productName}</h4>
                              <p className="itemCategory">{product.productCategory}</p>
                              <span
                                className="itemStatus"
                                style={{ backgroundColor: getStatusColor(product.status) }}
                              >
                                {product.status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="askedOffersCell">
                          {product.productFor === "Sale" && (
                            <div className="priceInfo">
                              <span className="originalPrice">NRs. {product.productPrice}</span>
                              <span className="minPrice">Min: NRs. {product.minimumPrice}</span>
                            </div>
                          )}
                          {product.productFor === "Exchange" && (
                            <div className="exchangeInfo">
                              <span className="exchangeFor">Exchange for: {product.exchangeFor}</span>
                            </div>
                          )}
                          {product.productFor === "Giveaway" && (
                            <div className="giveawayInfo">
                              <span className="desiredProduct">Desired: {product.desiredProduct}</span>
                            </div>
                          )}
                        </td>
                        <td className="offeredOfferCell">
                          {product.productFor === "Sale" && (
                            <div className="offerAmount">
                              <span className="amount">NRs. {offer.offerAmount}</span>
                            </div>
                          )}
                          {product.productFor === "Exchange" && (
                            <div className="exchangeOffer">
                              {offer.offerAmount ? (
                                <span className="amount">NRs. {offer.offerAmount}</span>
                              ) : (
                                <span className="exchangeProduct">{offer.exchangeProduct}</span>
                              )}
                            </div>
                          )}
                          {product.productFor === "Giveaway" && (
                            <div className="claimOffer">
                              {offer.offerAmount ? (
                                <span className="amount">NRs. {offer.offerAmount}</span>
                              ) : (
                                <span className="claimMessage">Claim Request</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="offeredByCell">
                          <div className="userInfo">
                            <img
                              src={offer.userId?.profilePicture ? (offer.userId.profilePicture.startsWith("http") ? offer.userId.profilePicture : process.env.REACT_APP_PUBLIC_FOLDER + offer.userId.profilePicture) : "/assets/person/noAvatar.png"}
                              alt={offer.userId?.username}
                              className="userAvatar"
                              onError={(e) => {
                                e.target.src = "/assets/person/noAvatar.png";
                                e.target.onerror = null;
                              }}
                            />
                            <div className="userDetails">
                              <span className="username">{offer.userId?.username}</span>
                              <span className="userLocation">{offer.userId?.city || "Location not set"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="messageCell">
                          <div className="messageContent">
                            <p className="messageText">{offer.message}</p>
                            <span
                              className="offerStatus"
                              style={{ backgroundColor: getOfferStatusColor(offer.status) }}
                            >
                              {offer.status}
                            </span>
                          </div>
                        </td>
                        <td className="actionsCell">
                          {offer.status === "Pending" && (
                            <div className="actionButtons">
                              <button
                                className="acceptBtn"
                                onClick={() => handleAcceptOffer(product._id, offer._id, offer.userId._id)}
                                title="Accept Offer"
                              >
                                ✓ Accept
                              </button>
                              <button
                                className="rejectBtn"
                                onClick={() => handleRejectOffer(product._id, offer._id)}
                                title="Reject Offer"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                          {offer.status === "Accepted" && (
                            <div className="acceptedStatus">
                              <span className="acceptedBadge">✓ Accepted</span>
                              {offer.responseMessage && (
                                <p className="responseText">{offer.responseMessage}</p>
                              )}
                            </div>
                          )}
                          {offer.status === "Rejected" && (
                            <div className="rejectedStatus">
                              <span className="rejectedBadge">✕ Rejected</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "claims" && (
        <div className="tableContainer">
          {receivedClaims.length === 0 ? (
            <div className="noDataMessage">
              <div className="noDataIcon">📭</div>
              <h3>No Claims Received</h3>
              <p>You haven't received any claims yet. When you do, they'll appear here.</p>
            </div>
          ) : (
            <div className="tableWrapper">
              <table className="offersTable">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Product Type</th>
                    <th>Claim Request</th>
                    <th>Claimed By</th>
                    <th>Claim Message</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedClaims.map(product =>
                    product.claims.map(claim => (
                      <tr key={`${product._id}-${claim._id}`} className="offerRow">
                        <td className="itemCell">
                          <div className="itemInfo">
                            <div className="itemImage">
                              <img
                                src={product.productImages?.[0] || "/assets/post/1.jpeg"}
                                alt={product.productName}
                                onError={(e) => {
                                  e.target.src = "/assets/post/1.jpeg";
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                            <div className="itemDetails">
                              <h4>{product.productName}</h4>
                              <p className="itemCategory">{product.productCategory}</p>
                              <span
                                className="itemStatus"
                                style={{ backgroundColor: getStatusColor(product.status) }}
                              >
                                {product.status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="productTypeCell">
                          <div className="productTypeInfo">
                            <span className="typeBadge giveaway">Giveaway</span>
                            <span className="desiredProduct">Desired: {product.desiredProduct}</span>
                          </div>
                        </td>
                        <td className="claimRequestCell">
                          <div className="claimRequest">
                            <span className="claimType">Claim Request</span>
                            <span className="claimDate">{new Date(claim.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="claimedByCell">
                          <div className="userInfo">
                            <img
                              src={claim.userId?.profilePicture ? (claim.userId.profilePicture.startsWith("http") ? claim.userId.profilePicture : process.env.REACT_APP_PUBLIC_FOLDER + claim.userId.profilePicture) : "/assets/person/noAvatar.png"}
                              alt={claim.userId?.username}
                              className="userAvatar"
                              onError={(e) => {
                                e.target.src = "/assets/person/noAvatar.png";
                                e.target.onerror = null;
                              }}
                            />
                            <div className="userDetails">
                              <span className="username">{claim.userId?.username}</span>
                              <span className="userLocation">{claim.userId?.city || "Location not set"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="messageCell">
                          <div className="messageContent">
                            <p className="messageText">{claim.message}</p>
                            <span
                              className="claimStatus"
                              style={{ backgroundColor: getOfferStatusColor(claim.status) }}
                            >
                              {claim.status}
                            </span>
                          </div>
                        </td>
                        <td className="actionsCell">
                          {claim.status === "Pending" && (
                            <div className="actionButtons">
                              <button
                                className="acceptBtn"
                                onClick={() => handleAcceptClaim(product._id, claim._id, claim.userId._id)}
                                title="Accept Claim"
                              >
                                ✓ Accept
                              </button>
                              <button
                                className="rejectBtn"
                                onClick={() => handleRejectClaim(product._id, claim._id)}
                                title="Reject Claim"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                          {claim.status === "Accepted" && (
                            <div className="acceptedStatus">
                              <span className="acceptedBadge">✓ Accepted</span>
                              {claim.responseMessage && (
                                <p className="responseText">{claim.responseMessage}</p>
                              )}
                            </div>
                          )}
                          {claim.status === "Rejected" && (
                            <div className="rejectedStatus">
                              <span className="rejectedBadge">✕ Rejected</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
