import apiClient from "./utils/apiClient";

export const loginCall = async (userCredential, dispatch) => {
  debugger
  dispatch({ type: "LOGIN_START" });
  try {
    const res = await apiClient.post("/auth/login", userCredential);
    dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
  } catch (err) {
    dispatch({ type: "LOGIN_FAILURE", payload: err });
  }
};

// Product API calls
export const createProduct = async (productData) => {
  try {
    const res = await apiClient.post("/products", productData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getProducts = async () => {
  try {
    const res = await apiClient.get("/products");
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getProductsByCategory = async (category) => {
  try {
    const res = await apiClient.get(`/products/category/${category}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getProductsByType = async (type) => {
  try {
    const res = await apiClient.get(`/products/type/${type}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUserProducts = async (userId) => {
  try {
    const res = await apiClient.get(`/products/user/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUserOffers = async (userId) => {
  try {
    const res = await apiClient.get(`/products/offers/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getUserClaims = async (userId) => {
  try {
    const res = await apiClient.get(`/products/claims/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const makeOffer = async (productId, offerData) => {
  try {
    const res = await apiClient.post(`/products/${productId}/offer`, offerData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const makeClaim = async (productId, claimData) => {
  try {
    const res = await apiClient.post(`/products/${productId}/claim`, claimData);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateOfferStatus = async (productId, offerId, status, userId) => {
  try {
    const res = await apiClient.put(`/products/${productId}/offer/${offerId}`, {
      status,
      userId
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateClaimStatus = async (productId, claimId, status, userId) => {
  try {
    const res = await apiClient.put(`/products/${productId}/claim/${claimId}`, {
      status,
      userId
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getReceivedOffers = async (userId) => {
  try {
    const res = await apiClient.get(`/products/received-offers/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getReceivedClaims = async (userId) => {
  try {
    const res = await apiClient.get(`/products/received-claims/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const acceptOffer = async (productId, offerId, userId, buyerId, responseMessage) => {
  try {
    const res = await apiClient.put(`/products/${productId}/accept-offer/${offerId}`, {
      userId,
      buyerId,
      responseMessage
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const acceptClaim = async (productId, claimId, userId, buyerId, responseMessage) => {
  try {
    const res = await apiClient.put(`/products/${productId}/accept-claim/${claimId}`, {
      userId,
      buyerId,
      responseMessage
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const updateProductStatus = async (productId, status, userId, buyerId = null) => {
  try {
    const res = await apiClient.put(`/products/${productId}/status`, {
      status,
      userId,
      buyerId
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const completeTransaction = async (productId, userId) => {
  try {
    const res = await apiClient.put(`/products/${productId}/complete-transaction`, {
      userId
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getTransactionHistory = async (userId) => {
  try {
    const res = await apiClient.get(`/products/transactions/${userId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const deleteProduct = async (productId, userId) => {
  try {
    const res = await apiClient.delete(`/products/${productId}`, {
      data: { userId }
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

