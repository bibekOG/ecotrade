import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../utils/apiClient";
import { Send, Close, Message } from "@material-ui/icons";
import { getImageUrl } from "../../utils/imageUtils";
import "./productMessageBox.css";

export default function ProductMessageBox({
  product,
  otherUser,
  currentUser,
  isOpen,
  onClose,
  onMessageSent
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerData, setOfferData] = useState({
    offerAmount: "",
    exchangeProduct: "",
    message: "",
  });

  const messagesEndRef = useRef(null);
  const messageBoxRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && product && currentUser && otherUser) {
      // Ensure product has full data including userId
      if (!product.userId && product._id) {
        fetchProductDetails();
      } else {
        fetchMessages();
      }
    }
  }, [isOpen, product, currentUser, otherUser]);

  const fetchProductDetails = async () => {
    try {
      const res = await apiClient.get(`/products/${product._id}`);
      // Update product with full data
      Object.assign(product, res.data);
      fetchMessages();
    } catch (err) {
      console.error("Error fetching product details:", err);
      // Still try to fetch messages
      fetchMessages();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(
        `/productMessages/product/${product._id}/conversation/${currentUser._id}/${otherUser._id}`
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !imageFile) return;

    try {
      setSending(true);
      let uploadedUrl = null;
      if (imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const up = await apiClient.post("/upload", form, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (up.status === 200 && up.data?.filename) {
          uploadedUrl = `/images/${up.data.filename}`;
        }
      }

      // Validate required data
      if (!product?._id) {
        alert("Product information is missing. Please refresh the page.");
        return;
      }
      if (!currentUser?._id) {
        alert("User information is missing. Please log in again.");
        return;
      }
      if (!otherUser?._id) {
        alert("Receiver information is missing. Please refresh the page.");
        return;
      }

      // Ensure product has userId (owner) - fetch if missing
      let productWithOwner = product;
      if (!product.userId && !product.userId?._id) {
        try {
          const productRes = await apiClient.get(`/products/${product._id}`);
          productWithOwner = productRes.data;
        } catch (err) {
          console.error("Error fetching product details:", err);
          // Continue anyway - backend will validate
        }
      }

      // Get product owner ID (handle both populated and non-populated cases)
      const productOwnerId = productWithOwner.userId?._id?.toString() ||
        productWithOwner.userId?.toString() ||
        productWithOwner.userId;

      // Normalize IDs for comparison
      const currentUserId = currentUser._id?.toString() || currentUser._id;
      const otherUserId = otherUser._id?.toString() || otherUser._id;

      // Verify that either sender or receiver is the product owner
      const isCurrentUserOwner = productOwnerId && productOwnerId === currentUserId;
      const isOtherUserOwner = productOwnerId && productOwnerId === otherUserId;

      if (productOwnerId && !isCurrentUserOwner && !isOtherUserOwner) {
        console.warn("Product owner validation:", {
          productOwnerId,
          currentUserId,
          otherUserId,
          isCurrentUserOwner,
          isOtherUserOwner
        });
        // Don't block - let backend handle validation
        // alert("You can only message about products you own or are interested in purchasing.");
        // return;
      }

      const messageData = {
        productId: product._id,
        senderId: currentUser._id,
        receiverId: otherUser._id,
        message: uploadedUrl ? (newMessage.trim() || null) : newMessage.trim(),
        messageType: uploadedUrl ? "image" : "text",
        imageUrl: uploadedUrl || undefined,
      };

      console.log("Sending product message:", messageData);
      console.log("Product owner:", productOwnerId, "Current user:", currentUser._id, "Other user:", otherUser._id);

      const res = await apiClient.post("/productMessages", messageData);

      if (res.data) {
        setMessages(prev => [...prev, res.data]);
        setNewMessage("");
        setImageFile(null);

        if (onMessageSent) {
          onMessageSent(res.data);
        }
      } else {
        throw new Error("No data returned from server");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = err.response?.data || err.message || "Unknown error";
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      // Show more specific error message
      if (err.response?.status === 403) {
        alert("You can only message about products you own or are interested in.");
      } else if (err.response?.status === 404) {
        alert("Product not found. It may have been removed.");
      } else if (err.response?.status === 400) {
        alert(err.response.data || "Product is not available for messaging.");
      } else {
        alert(`Failed to send message: ${typeof errorMessage === 'string' ? errorMessage : 'Please try again.'}`);
      }
    } finally {
      setSending(false);
    }
  };

  const sendOffer = async (e) => {
    e.preventDefault();

    try {
      setSending(true);

      // Track offer activity
      try {
        await apiClient.post("/productActivities/track", {
          productId: product._id,
          userId: currentUser._id,
          activityType: "offer",
          metadata: {
            productName: product.productName,
            offerType: product.productFor,
            offerAmount: product.productFor === "Sale" ? Number(offerData.offerAmount) : undefined,
            exchangeProduct: product.productFor === "Exchange" ? offerData.exchangeProduct : undefined,
            timestamp: Date.now()
          }
        });
      } catch (activityError) {
        console.error("Error tracking offer activity:", activityError);
      }

      const messageData = {
        productId: product._id,
        senderId: currentUser._id,
        receiverId: otherUser._id,
        message: offerData.message.trim(),
        messageType: "offer",
        offerAmount: product.productFor === "Sale" ? Number(offerData.offerAmount) : undefined,
        exchangeProduct: product.productFor === "Exchange" ? offerData.exchangeProduct : undefined,
      };

      const res = await apiClient.post("/productMessages", messageData);

      setMessages(prev => [...prev, res.data]);
      setShowOfferForm(false);
      setOfferData({
        offerAmount: "",
        exchangeProduct: "",
        message: "",
      });

      if (onMessageSent) {
        onMessageSent(res.data);
      }
    } catch (err) {
      console.error("Error sending offer:", err);
      alert("Failed to send offer. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOwnMessage = (message) => {
    return message.senderId._id === currentUser._id;
  };

  if (!isOpen) return null;

  return (
    <div className="productMessageBox" ref={messageBoxRef}>
      <div className="messageBoxHeader compact">
        <div className="productInfo">
          <div className="productDetails">
            <h4 className="compactTitle">{otherUser?.username} • {product.productName}</h4>
          </div>
        </div>
        <button className="closeButton" onClick={onClose}>
          <Close />
        </button>
      </div>

      <div className="messageBoxContent">
        {loading ? (
          <div className="loadingMessages">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="noMessages">
            <Message className="noMessageIcon" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messagesList">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`message ${isOwnMessage(message) ? 'own' : 'other'}`}
              >
                <div className="messageContent">
                  {message.messageType === "offer" && (
                    <div className="offerDetails">
                      {message.offerAmount && (
                        <span className="offerAmount">Offer: NRs. {message.offerAmount}</span>
                      )}
                      {message.exchangeProduct && (
                        <span className="exchangeProduct">Exchange: {message.exchangeProduct}</span>
                      )}
                    </div>
                  )}
                  {(() => {
                    // Get the full image URL for message attachments
                    const getMessageImageUrl = () => {
                      if (!message.imageUrl) return null;

                      // If it's already a full URL, return as is
                      if (message.imageUrl.startsWith('http://') || message.imageUrl.startsWith('https://')) {
                        return message.imageUrl;
                      }

                      // If it starts with /images/, construct full URL
                      if (message.imageUrl.startsWith('/images/')) {
                        let baseUrl = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
                        baseUrl = baseUrl.replace(/\/images\/?$/, '');
                        baseUrl = baseUrl.replace(/\/$/, '');
                        return `${baseUrl}${message.imageUrl}`;
                      }

                      // Otherwise use the imageUtils helper
                      return getImageUrl(message.imageUrl);
                    };

                    const imageUrl = getMessageImageUrl();
                    const isImageMessage = imageUrl || message.messageType === 'image';

                    // Filter out placeholder text like "attachment" or "Cattachment"
                    const displayText = message.message &&
                      !message.message.toLowerCase().includes('cattachment') &&
                      !message.message.toLowerCase().includes('attachment') &&
                      message.message.trim() !== 'Cattachment' &&
                      message.message.trim() !== 'attachment'
                      ? message.message
                      : null;

                    return (
                      <>
                        {isImageMessage && imageUrl && (
                          <a href={imageUrl} target="_blank" rel="noreferrer" className="messageImageLink">
                            <img
                              src={imageUrl}
                              alt="Message attachment"
                              className="messageImage"
                              onError={(e) => {
                                console.error('Failed to load image:', imageUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                          </a>
                        )}
                        {displayText && <p>{displayText}</p>}
                      </>
                    );
                  })()}
                  <span className="messageTime">{formatTime(message.createdAt)}</span>
                </div>
                {!isOwnMessage(message) && (
                  <img
                    src={message.senderId.profilePicture ? (message.senderId.profilePicture.startsWith("http") ? message.senderId.profilePicture : process.env.REACT_APP_PUBLIC_FOLDER + message.senderId.profilePicture) : "/assets/person/noAvatar.png"}
                    alt=""
                    className="messageAvatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/assets/person/noAvatar.png";
                    }}
                  />
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="messageBoxActions">
        {product.productFor !== "Giveaway" && (
          <button
            className="offerButton"
            onClick={() => {
              // Track click activity for showing offer form
              if (!showOfferForm) {
                apiClient.post("/productActivities/track", {
                  productId: product._id,
                  userId: currentUser._id,
                  activityType: "click",
                  metadata: {
                    productName: product.productName,
                    action: "show_offer_form",
                    offerType: product.productFor,
                    timestamp: Date.now()
                  }
                }).catch(error => console.error("Error tracking offer form click:", error));
              }
              setShowOfferForm(!showOfferForm);
            }}
          >
            {product.productFor === "Sale" ? "Make Offer" : "Exchange Offer"}
          </button>
        )}
      </div>

      {showOfferForm && (
        <div className="offerForm">
          <h4>{product.productFor === "Sale" ? "Make an Offer" : "Exchange Offer"}</h4>
          <form onSubmit={sendOffer}>
            {product.productFor === "Sale" && (
              <input
                type="number"
                placeholder="Your Offer Amount"
                value={offerData.offerAmount}
                onChange={(e) => setOfferData({ ...offerData, offerAmount: e.target.value })}
                required
                className="offerInput"
              />
            )}
            {product.productFor === "Exchange" && (
              <input
                type="text"
                placeholder="Your Exchange Product"
                value={offerData.exchangeProduct}
                onChange={(e) => setOfferData({ ...offerData, exchangeProduct: e.target.value })}
                required
                className="offerInput"
              />
            )}
            <textarea
              placeholder="Message (optional)"
              value={offerData.message}
              onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
              className="offerTextarea"
            />
            <div className="offerFormActions">
              <button type="submit" disabled={sending} className="sendOfferBtn">
                {sending ? "Sending..." : "Send Offer"}
              </button>
              <button
                type="button"
                onClick={() => setShowOfferForm(false)}
                className="cancelBtn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <form className="messageInputForm" onSubmit={sendMessage}>
        <div className="messageInputWrapper">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="messageInput"
          />
          <label className="attachLabel">
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            📎
          </label>
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !imageFile)}
            className="sendButton"
          >
            <Send />
          </button>
        </div>
      </form>
    </div>
  );
}
