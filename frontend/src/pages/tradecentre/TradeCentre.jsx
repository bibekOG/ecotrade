import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import "./tradecentre.css";

export default function TradeCentre() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [userOffers, setUserOffers] = useState([]);
  const [userClaims, setUserClaims] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [responseMessage, setResponseMessage] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        productsRes, 
        userProductsRes, 
        userOffersRes, 
        userClaimsRes,
        receivedOffersRes,
        receivedClaimsRes,
        transactionHistoryRes
      ] = await Promise.all([
        apiClient.get("/products"),
        apiClient.get(`/products/user/${user._id}`),
        apiClient.get(`/products/offers/${user._id}`),
        apiClient.get(`/products/claims/${user._id}`),
        apiClient.get(`/products/received-offers/${user._id}`),
        apiClient.get(`/products/received-claims/${user._id}`),
        apiClient.get(`/products/transactions/${user._id}`)
      ]);

      setProducts(productsRes.data);
      setUserProducts(userProductsRes.data);
      setUserOffers(userOffersRes.data);
      setUserClaims(userClaimsRes.data);
      setReceivedOffers(receivedOffersRes.data);
      setReceivedClaims(receivedClaimsRes.data);
      setTransactionHistory(transactionHistoryRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error loading data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (productId, offerId, status, buyerId = null) => {
    const actionKey = `${offerId}-${status}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      if (status === "Accepted") {
        await apiClient.put(`/products/${productId}/accept-offer/${offerId}`, {
          userId: user._id,
          buyerId: buyerId,
          responseMessage: responseMessage || "Offer accepted"
        });
      } else {
        await apiClient.put(`/products/${productId}/offer/${offerId}`, {
          status,
          userId: user._id,
          responseMessage: responseMessage || "Offer rejected"
        });
      }
      
      alert(`Offer ${status.toLowerCase()} successfully!`);
      setResponseMessage("");
      setShowResponseModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error updating offer:", err);
      alert(`Error ${status.toLowerCase()}ing offer. Please try again.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleClaimAction = async (productId, claimId, status, buyerId = null) => {
    const actionKey = `${claimId}-${status}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      
      if (status === "Accepted") {
        await apiClient.put(`/products/${productId}/accept-claim/${claimId}`, {
          userId: user._id,
          buyerId: buyerId,
          responseMessage: responseMessage || "Claim accepted"
        });
      } else {
        await apiClient.put(`/products/${productId}/claim/${claimId}`, {
          status,
          userId: user._id,
          responseMessage: responseMessage || "Claim rejected"
        });
      }
      
      alert(`Claim ${status.toLowerCase()} successfully!`);
      setResponseMessage("");
      setShowResponseModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error updating claim:", err);
      alert(`Error ${status.toLowerCase()}ing claim. Please try again.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleCompleteTransaction = async (productId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`complete-${productId}`]: true }));
      
      await apiClient.put(`/products/${productId}/complete-transaction`, {
        userId: user._id
      });
      
      alert("Transaction completed successfully!");
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error completing transaction:", err);
      alert("Error completing transaction. Please try again.");
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete-${productId}`]: false }));
    }
  };

  const handleUpdateProductStatus = async (productId, newStatus) => {
    try {
      setActionLoading(prev => ({ ...prev, [`status-${productId}`]: true }));
      
      await apiClient.put(`/products/${productId}/status`, {
        userId: user._id,
        status: newStatus
      });
      
      alert(`Product status updated to ${newStatus}!`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error updating product status:", err);
      alert("Error updating product status. Please try again.");
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${productId}`]: false }));
    }
  };

  const openResponseModal = (offer = null, claim = null) => {
    setSelectedOffer(offer);
    setSelectedClaim(claim);
    setResponseMessage("");
    setShowResponseModal(true);
  };

  const closeResponseModal = () => {
    setShowResponseModal(false);
    setSelectedOffer(null);
    setSelectedClaim(null);
    setResponseMessage("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#ffa500";
      case "Accepted": return "#4caf50";
      case "Rejected": return "#f44336";
      default: return "#666";
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
        return;
      }
      
      await apiClient.delete(`/products/${productId}`, {
        data: { userId: user._id }
      });
      alert("Product removed successfully!");
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Error deleting product. Please try again.");
    }
  };

  const handleEditProduct = (product) => {
    // For now, redirect to edit page or open edit modal
    // This can be enhanced with a proper edit form
    const editUrl = `/marketplace/edit/${product._id}`;
    window.location.href = editUrl;
  };

  const handleRefreshData = () => {
    fetchData();
  };

  const getOffersCount = (status = null) => {
    if (!user || !receivedOffers) return 0;
    const allOffers = receivedOffers.reduce((acc, product) => {
      const offers = Array.isArray(product.offers) ? product.offers : [];
      const filteredOffers = offers.filter(offer => {
        const offerUserId = offer && offer.userId ? (offer.userId._id || offer.userId) : null;
        if (!offerUserId) return false; // skip malformed offers
        if (status && offer.status !== status) return false;
        return offerUserId.toString() !== user._id.toString();
      });
      return acc + filteredOffers.length;
    }, 0);
    return allOffers;
  };

  const getClaimsCount = (status = null) => {
    if (!user || !receivedClaims) return 0;
    const allClaims = receivedClaims.reduce((acc, product) => {
      const claims = Array.isArray(product.claims) ? product.claims : [];
      const filteredClaims = claims.filter(claim => {
        const claimUserId = claim && claim.userId ? (claim.userId._id || claim.userId) : null;
        if (!claimUserId) return false;
        if (status && claim.status !== status) return false;
        return claimUserId.toString() !== user._id.toString();
      });
      return acc + filteredClaims.length;
    }, 0);
    return allClaims;
  };

  const getPendingActionsCount = () => {
    return getOffersCount('Pending') + getClaimsCount('Pending');
  };

  const filterProducts = (productsList) => {
    return productsList.filter(product => {
      const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.productCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const renderProductsTable = (productsList, showActions = false) => {
    const filteredProducts = filterProducts(productsList);
    
    if (filteredProducts.length === 0) {
      return <div className="noData">No products found</div>;
    }

    return (
      <div className="tableContainer">
        <table className="productsTable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Type</th>
              <th>Condition</th>
              <th>Price/Details</th>
              <th>Valid Till</th>
              <th>Contact</th>
              <th>Status</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id}>
                <td>
                  <div className="productCell">
                    <strong>{product.productName}</strong>
                    <small>by {product.userId?.username || 'Unknown User'}</small>
                    {product.currentBuyer && (
                      <small style={{ color: '#1877f2' }}>
                        Current Buyer: {product.currentBuyer?.username || 'Unknown Buyer'}
                      </small>
                    )}
                  </div>
                </td>
                <td>{product.productCategory}</td>
                <td>
                  <span className={`typeBadge ${product.productFor.toLowerCase()}`}>
                    {product.productFor}
                  </span>
                </td>
                <td>{product.productType}</td>
                <td>
                  {product.productFor === "Sale" && (
                    <div>
                      <div>Price: NRs. {product.productPrice}</div>
                      <div>Min: NRs. {product.minimumPrice}</div>
                      <div>Payment: {product.paymentMethod}</div>
                    </div>
                  )}
                  {product.productFor === "Giveaway" && (
                    <div>Desired: {product.desiredProduct}</div>
                  )}
                  {product.productFor === "Exchange" && (
                    <div>Exchange for: {product.exchangeFor}</div>
                  )}
                </td>
                <td>{new Date(product.validTill).toLocaleDateString()}</td>
                <td>{product.contactDetails}</td>
                <td>
                  <span 
                    className="statusBadge"
                    style={{ backgroundColor: getStatusColor(product.status) }}
                  >
                    {product.status}
                  </span>
                  {product.transactionDate && (
                    <small style={{ display: 'block', marginTop: '4px' }}>
                      {new Date(product.transactionDate).toLocaleDateString()}
                    </small>
                  )}
                </td>
                {showActions && (
                  <td>
                    <div className="actionButtons">
                      <button 
                        className="actionBtn edit"
                        onClick={() => handleEditProduct(product)}
                        disabled={product.status !== "Active"}
                      >
                        Edit
                      </button>
                      <button 
                        className="actionBtn delete"
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={actionLoading[`delete-${product._id}`]}
                      >
                        {actionLoading[`delete-${product._id}`] ? "Deleting..." : "Delete"}
                      </button>
                      
                      {/* Status Management Buttons */}
                      {product.status === "Booked" && (
                        <button 
                          className="actionBtn complete"
                          onClick={() => handleCompleteTransaction(product._id)}
                          disabled={actionLoading[`complete-${product._id}`]}
                        >
                          {actionLoading[`complete-${product._id}`] ? "Completing..." : "Mark as Sold"}
                        </button>
                      )}
                      
                      {product.status === "Booked" && (
                        <button 
                          className="actionBtn reactivate"
                          onClick={() => handleUpdateProductStatus(product._id, "Active")}
                          disabled={actionLoading[`status-${product._id}`]}
                        >
                          {actionLoading[`status-${product._id}`] ? "Updating..." : "Reactivate"}
                        </button>
                      )}
                      
                      {product.status === "Active" && (
                        <select 
                          className="statusSelect"
                          onChange={(e) => e.target.value && handleUpdateProductStatus(product._id, e.target.value)}
                          defaultValue=""
                          disabled={actionLoading[`status-${product._id}`]}
                        >
                          <option value="">Change Status</option>
                          <option value="Booked">Mark as Booked</option>
                          <option value="Sold">Mark as Sold</option>
                        </select>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOffersTable = () => {
    if (receivedOffers.length === 0) {
      return <div className="noData">No offers received</div>;
    }

    return (
      <div className="tableContainer">
        <table className="offersTable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Offered By</th>
              <th>Offer Details</th>
              <th>Claim Till</th>
              <th>Message</th>
              <th>Status</th>
              <th>Response</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivedOffers.map(product => 
              product.offers
                .filter(offer => offer.userId._id !== user._id)
                .map(offer => (
                  <tr key={offer._id}>
                    <td>
                      <div className="productCell">
                        <strong>{product.productName}</strong>
                        <small>{product.productFor}</small>
                        <small style={{ color: '#666' }}>
                          Status: {product.status}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="userCell">
                        <img 
                          src={offer.userId.profilePicture || "/assets/person/noAvatar.png"} 
                          alt="" 
                          className="userImg" 
                        />
                        <span>{offer.userId?.username || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td>
                      {product.productFor === "Sale" && (
                        <div>
                          <div>Offer: NRs. {offer.offerAmount}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Original Price: NRs. {product.productPrice}
                          </div>
                        </div>
                      )}
                      {product.productFor === "Exchange" && (
                        <div>
                          <div>Exchange: {offer.exchangeProduct}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Wanted: {product.exchangeFor}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        {new Date(offer.claimTill).toLocaleDateString()}
                        {new Date(offer.claimTill) < new Date() && (
                          <small style={{ color: '#f44336', display: 'block' }}>
                            Expired
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="messageCell" title={offer.message}>
                        {offer.message}
                      </div>
                    </td>
                    <td>
                      <span 
                        className="statusBadge"
                        style={{ backgroundColor: getStatusColor(offer.status) }}
                      >
                        {offer.status}
                      </span>
                      {offer.respondedAt && (
                        <small style={{ display: 'block', marginTop: '4px' }}>
                          {new Date(offer.respondedAt).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="messageCell" title={offer.responseMessage}>
                        {offer.responseMessage || "-"}
                      </div>
                    </td>
                    <td>
                      {offer.status === "Pending" && product.status === "Active" && (
                        <div className="actionButtons">
                          <button 
                            className="actionBtn accept"
                            onClick={() => openResponseModal(offer)}
                            disabled={actionLoading[`${offer._id}-Accepted`]}
                          >
                            {actionLoading[`${offer._id}-Accepted`] ? "Accepting..." : "Accept"}
                          </button>
                          <button 
                            className="actionBtn reject"
                            onClick={() => handleOfferAction(product._id, offer._id, "Rejected")}
                            disabled={actionLoading[`${offer._id}-Rejected`]}
                          >
                            {actionLoading[`${offer._id}-Rejected`] ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      )}
                      {offer.status === "Accepted" && product.status === "Booked" && product.currentBuyer?._id === offer.userId._id && (
                        <button 
                          className="actionBtn complete"
                          onClick={() => handleCompleteTransaction(product._id)}
                          disabled={actionLoading[`complete-${product._id}`]}
                        >
                          {actionLoading[`complete-${product._id}`] ? "Completing..." : "Complete Sale"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderClaimsTable = () => {
    if (receivedClaims.length === 0) {
      return <div className="noData">No claims received</div>;
    }

    return (
      <div className="tableContainer">
        <table className="claimsTable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Claimed By</th>
              <th>Claim Till</th>
              <th>Message</th>
              <th>Status</th>
              <th>Response</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivedClaims.map(product => 
              product.claims
                .filter(claim => claim.userId._id !== user._id)
                .map(claim => (
                  <tr key={claim._id}>
                    <td>
                      <div className="productCell">
                        <strong>{product.productName}</strong>
                        <small>Giveaway</small>
                        <small style={{ color: '#666' }}>
                          Status: {product.status}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="userCell">
                        <img 
                          src={claim.userId.profilePicture || "/assets/person/noAvatar.png"} 
                          alt="" 
                          className="userImg" 
                        />
                        <span>{claim.userId?.username || 'Unknown User'}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        {new Date(claim.claimTill).toLocaleDateString()}
                        {new Date(claim.claimTill) < new Date() && (
                          <small style={{ color: '#f44336', display: 'block' }}>
                            Expired
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="messageCell" title={claim.message}>
                        {claim.message}
                      </div>
                    </td>
                    <td>
                      <span 
                        className="statusBadge"
                        style={{ backgroundColor: getStatusColor(claim.status) }}
                      >
                        {claim.status}
                      </span>
                      {claim.respondedAt && (
                        <small style={{ display: 'block', marginTop: '4px' }}>
                          {new Date(claim.respondedAt).toLocaleDateString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="messageCell" title={claim.responseMessage}>
                        {claim.responseMessage || "-"}
                      </div>
                    </td>
                    <td>
                      {claim.status === "Pending" && product.status === "Active" && (
                        <div className="actionButtons">
                          <button 
                            className="actionBtn accept"
                            onClick={() => openResponseModal(null, claim)}
                            disabled={actionLoading[`${claim._id}-Accepted`]}
                          >
                            {actionLoading[`${claim._id}-Accepted`] ? "Accepting..." : "Accept"}
                          </button>
                          <button 
                            className="actionBtn reject"
                            onClick={() => handleClaimAction(product._id, claim._id, "Rejected")}
                            disabled={actionLoading[`${claim._id}-Rejected`]}
                          >
                            {actionLoading[`${claim._id}-Rejected`] ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      )}
                      {claim.status === "Accepted" && product.status === "Booked" && product.currentBuyer?._id === claim.userId._id && (
                        <button 
                          className="actionBtn complete"
                          onClick={() => handleCompleteTransaction(product._id)}
                          disabled={actionLoading[`complete-${product._id}`]}
                        >
                          {actionLoading[`complete-${product._id}`] ? "Completing..." : "Complete Giveaway"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMyOffersTable = () => {
    const myOffers = [];
    userOffers.forEach(product => {
      product.offers
        .filter(offer => offer.userId._id === user._id)
        .forEach(offer => {
          myOffers.push({ product, offer });
        });
    });

    if (myOffers.length === 0) {
      return <div className="noData">No offers made</div>;
    }

    return (
      <div className="tableContainer">
        <table className="myOffersTable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Owner</th>
              <th>My Offer</th>
              <th>Claim Till</th>
              <th>Message</th>
              <th>Status</th>
              <th>Response</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myOffers.map(({ product, offer }) => (
              <tr key={offer._id}>
                <td>
                  <div className="productCell">
                    <strong>{product.productName}</strong>
                    <small>{product.productFor}</small>
                    <small style={{ color: '#666' }}>
                      Status: {product.status}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="userCell">
                    <img 
                      src={product.userId?.profilePicture || "/assets/person/noAvatar.png"} 
                      alt="" 
                      className="userImg" 
                    />
                    <span>{product.userId?.username || 'Unknown User'}</span>
                  </div>
                </td>
                <td>
                  {product.productFor === "Sale" && (
                    <div>
                      <div>Offer: NRs. {offer.offerAmount}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Original Price: NRs. {product.productPrice}
                      </div>
                    </div>
                  )}
                  {product.productFor === "Exchange" && (
                    <div>
                      <div>Exchange: {offer.exchangeProduct}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Wanted: {product.exchangeFor}
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  <div>
                    {new Date(offer.claimTill).toLocaleDateString()}
                    {new Date(offer.claimTill) < new Date() && (
                      <small style={{ color: '#f44336', display: 'block' }}>
                        Expired
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="messageCell" title={offer.message}>
                    {offer.message}
                  </div>
                </td>
                <td>
                  <span 
                    className="statusBadge"
                    style={{ backgroundColor: getStatusColor(offer.status) }}
                  >
                    {offer.status}
                  </span>
                  {offer.respondedAt && (
                    <small style={{ display: 'block', marginTop: '4px' }}>
                      {new Date(offer.respondedAt).toLocaleDateString()}
                    </small>
                  )}
                </td>
                <td>
                  <div className="messageCell" title={offer.responseMessage}>
                    {offer.responseMessage || "-"}
                  </div>
                </td>
                <td>
                  {offer.status === "Accepted" && product.status === "Booked" && product.currentBuyer?._id === user._id && (
                    <div className="actionButtons">
                      <button 
                        className="actionBtn contact"
                        onClick={() => window.open(`tel:${product.contactDetails}`, '_blank')}
                      >
                        Contact Seller
                      </button>
                      <a 
                        href={`/messenger?userId=${product.userId._id}`}
                        className="actionBtn message"
                        style={{ textDecoration: 'none' }}
                      >
                        Message
                      </a>
                    </div>
                  )}
                  {offer.status === "Pending" && (
                    <small style={{ color: '#666' }}>
                      Waiting for response
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMyClaimsTable = () => {
    const myClaims = [];
    userClaims.forEach(product => {
      product.claims
        .filter(claim => claim.userId._id === user._id)
        .forEach(claim => {
          myClaims.push({ product, claim });
        });
    });

    if (myClaims.length === 0) {
      return <div className="noData">No claims made</div>;
    }

    return (
      <div className="tableContainer">
        <table className="myClaimsTable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Owner</th>
              <th>Claim Till</th>
              <th>Message</th>
              <th>Status</th>
              <th>Response</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myClaims.map(({ product, claim }) => (
              <tr key={claim._id}>
                <td>
                  <div className="productCell">
                    <strong>{product.productName}</strong>
                    <small>Giveaway</small>
                    <small style={{ color: '#666' }}>
                      Status: {product.status}
                    </small>
                  </div>
                </td>
                <td>
                  <div className="userCell">
                    <img 
                      src={product.userId?.profilePicture || "/assets/person/noAvatar.png"} 
                      alt="" 
                      className="userImg" 
                    />
                    <span>{product.userId?.username || 'Unknown User'}</span>
                  </div>
                </td>
                <td>
                  <div>
                    {new Date(claim.claimTill).toLocaleDateString()}
                    {new Date(claim.claimTill) < new Date() && (
                      <small style={{ color: '#f44336', display: 'block' }}>
                        Expired
                      </small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="messageCell" title={claim.message}>
                    {claim.message}
                  </div>
                </td>
                <td>
                  <span 
                    className="statusBadge"
                    style={{ backgroundColor: getStatusColor(claim.status) }}
                  >
                    {claim.status}
                  </span>
                  {claim.respondedAt && (
                    <small style={{ display: 'block', marginTop: '4px' }}>
                      {new Date(claim.respondedAt).toLocaleDateString()}
                    </small>
                  )}
                </td>
                <td>
                  <div className="messageCell" title={claim.responseMessage}>
                    {claim.responseMessage || "-"}
                  </div>
                </td>
                <td>
                  {claim.status === "Accepted" && product.status === "Booked" && product.currentBuyer?._id === user._id && (
                    <div className="actionButtons">
                      <button 
                        className="actionBtn contact"
                        onClick={() => window.open(`tel:${product.contactDetails}`, '_blank')}
                      >
                        Contact Owner
                      </button>
                      <a 
                        href={`/messenger?userId=${product.userId._id}`}
                        className="actionBtn message"
                        style={{ textDecoration: 'none' }}
                      >
                        Message
                      </a>
                    </div>
                  )}
                  {claim.status === "Pending" && (
                    <small style={{ color: '#666' }}>
                      Waiting for response
                    </small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTransactionsTable = () => {
    const completedTransactions = [
      ...(transactionHistory.userProducts || []).filter(product => product.status === "Sold"),
      ...(transactionHistory.userOffers || []).filter(product => 
        product.status === "Sold" && product.offers.some(offer => 
          offer.userId._id === user._id && offer.status === "Accepted"
        )
      ),
      ...(transactionHistory.userClaims || []).filter(product => 
        product.status === "Sold" && product.claims.some(claim => 
          claim.userId._id === user._id && claim.status === "Accepted"
        )
      )
    ];

    if (completedTransactions.length === 0) {
      return <div className="noData">No completed transactions</div>;
    }

    return (
      <div className="tableContainer">
        <table className="transactionsTable">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Partner</th>
              <th>Amount/Details</th>
              <th>Transaction Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {completedTransactions.map(product => {
              const isSeller = product.userId._id === user._id;
              const partner = isSeller ? product.currentBuyer : product.userId;
              
              return (
                <tr key={product._id}>
                  <td>
                    <div className="productCell">
                      <strong>{product.productName}</strong>
                      <small>{product.productFor}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`typeBadge ${isSeller ? 'sold' : 'bought'}`}>
                      {isSeller ? 'Sold' : 'Bought'}
                    </span>
                  </td>
                  <td>
                    <div className="userCell">
                      <img 
                        src={partner?.profilePicture || "/assets/person/noAvatar.png"} 
                        alt="" 
                        className="userImg" 
                      />
                      <span>{partner?.username || 'Unknown Partner'}</span>
                    </div>
                  </td>
                  <td>
                    {product.productFor === "Sale" && (
                      <div>NRs. {product.productPrice}</div>
                    )}
                    {product.productFor === "Exchange" && (
                      <div>Exchange</div>
                    )}
                    {product.productFor === "Giveaway" && (
                      <div>Free</div>
                    )}
                  </td>
                  <td>{new Date(product.transactionDate).toLocaleDateString()}</td>
                  <td>
                    <span 
                      className="statusBadge"
                      style={{ backgroundColor: getStatusColor("Sold") }}
                    >
                      Completed
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="tradeCentre">
        <div className="tradeCentreWrapper">
          <div className="tradeCentreHeader">
            <div className="headerTop">
              <div>
                <h2>Trade Centre</h2>
                <p>Manage your marketplace activities</p>
              </div>
              <button className="refreshBtn" onClick={handleRefreshData} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            <div className="statsContainer">
              <div className="statCard">
                <span className="statNumber">{userProducts.length}</span>
                <span className="statLabel">My Products</span>
              </div>
              <div className="statCard">
                <span className="statNumber">{getOffersCount()}</span>
                <span className="statLabel">Offers Received</span>
              </div>
              <div className="statCard">
                <span className="statNumber">{getClaimsCount()}</span>
                <span className="statLabel">Claims Received</span>
              </div>
              <div className="statCard urgent">
                <span className="statNumber">{getPendingActionsCount()}</span>
                <span className="statLabel">Pending Actions</span>
              </div>
            </div>
          </div>

          <div className="tradeCentreTabs">
            <button 
              className={`tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Products
            </button>
            <button 
              className={`tab ${activeTab === "my" ? "active" : ""}`}
              onClick={() => setActiveTab("my")}
            >
              My Products
            </button>
            <button 
              className={`tab ${activeTab === "offers" ? "active" : ""}`}
              onClick={() => setActiveTab("offers")}
            >
              Offers Received
              {getOffersCount('Pending') > 0 && (
                <span className="badge">{getOffersCount('Pending')}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === "claims" ? "active" : ""}`}
              onClick={() => setActiveTab("claims")}
            >
              Claims Received
              {getClaimsCount('Pending') > 0 && (
                <span className="badge">{getClaimsCount('Pending')}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === "myOffers" ? "active" : ""}`}
              onClick={() => setActiveTab("myOffers")}
            >
              My Offers
            </button>
            <button 
              className={`tab ${activeTab === "myClaims" ? "active" : ""}`}
              onClick={() => setActiveTab("myClaims")}
            >
              My Claims
            </button>
            <button 
              className={`tab ${activeTab === "transactions" ? "active" : ""}`}
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </button>
          </div>

          {/* Search and Filter Controls */}
          <div className="controlsContainer">
            <div className="searchContainer">
              <input
                type="text"
                placeholder="Search products, categories, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="searchInput"
              />
            </div>
            <div className="filterContainer">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filterSelect"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Booked">Booked</option>
                <option value="Sold">Sold</option>
                <option value="Removed">Removed</option>
              </select>
            </div>
          </div>

          <div className="tradeCentreContent">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                {activeTab === "all" && renderProductsTable(products)}
                {activeTab === "my" && renderProductsTable(userProducts, true)}
                {activeTab === "offers" && renderOffersTable()}
                {activeTab === "claims" && renderClaimsTable()}
                {activeTab === "myOffers" && renderMyOffersTable()}
                {activeTab === "myClaims" && renderMyClaimsTable()}
                {activeTab === "transactions" && renderTransactionsTable()}
              </>
            )}
          </div>
        </div>

        {/* Response Modal */}
        {showResponseModal && (
          <div className="modal">
            <div className="modalContent">
              <div className="modalHeader">
                <h3>
                  {selectedOffer ? 'Accept Offer' : 'Accept Claim'}
                </h3>
                <button className="closeBtn" onClick={closeResponseModal}>×</button>
              </div>
              <div className="modalBody">
                <p>
                  {selectedOffer 
                                  ? `Accept offer from ${selectedOffer?.userId?.username || 'Unknown User'}?`
              : `Accept claim from ${selectedClaim?.userId?.username || 'Unknown User'}?`
                  }
                </p>
                <textarea
                  placeholder="Add a response message (optional)"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="responseTextarea"
                />
              </div>
              <div className="modalActions">
                <button 
                  className="actionBtn accept"
                  onClick={() => {
                    if (selectedOffer) {
                      const product = receivedOffers.find(p => 
                        p.offers.some(o => o._id === selectedOffer._id)
                      );
                      handleOfferAction(product._id, selectedOffer._id, "Accepted", selectedOffer.userId._id);
                    } else if (selectedClaim) {
                      const product = receivedClaims.find(p => 
                        p.claims.some(c => c._id === selectedClaim._id)
                      );
                      handleClaimAction(product._id, selectedClaim._id, "Accepted", selectedClaim.userId._id);
                    }
                  }}
                  disabled={actionLoading[`${selectedOffer?._id || selectedClaim?._id}-Accepted`]}
                >
                  {actionLoading[`${selectedOffer?._id || selectedClaim?._id}-Accepted`] ? "Accepting..." : "Accept"}
                </button>
                <button className="actionBtn cancel" onClick={closeResponseModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

