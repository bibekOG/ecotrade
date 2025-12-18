import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import ProductMessageBox from "../../components/marketplace/ProductMessageBox";
import { getProfileImageUrl } from "../../utils/imageUtils";
import "./conversations.css";

export default function Conversations({ embedded = false }) {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showMessageBox, setShowMessageBox] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/productMessages/user/${user._id}`);
      
      // Remove duplicates by creating a Map with unique conversation keys
      const uniqueConversations = new Map();
      
      res.data.forEach((conversation) => {
        const conversationKey = `${conversation.productId._id}-${conversation.otherUser._id}`;
        
        // If conversation doesn't exist or this one has a newer last message, use it
        if (!uniqueConversations.has(conversationKey) || 
            new Date(conversation.lastMessage.createdAt) > 
            new Date(uniqueConversations.get(conversationKey).lastMessage.createdAt)) {
          uniqueConversations.set(conversationKey, conversation);
        } else {
          // Merge unread counts if conversation already exists
          const existing = uniqueConversations.get(conversationKey);
          existing.unreadCount += conversation.unreadCount || 0;
          existing.messageCount += conversation.messageCount || 0;
        }
      });
      
      // Convert Map to array and sort by last message time
      const conversationsArray = Array.from(uniqueConversations.values()).sort((a, b) => 
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
      
      setConversations(conversationsArray);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setShowMessageBox(true);
  };

  const handleMessageSent = (message) => {
    // Refresh conversations to show the latest message
    fetchConversations();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getLastMessagePreview = (message) => {
    if (!message) return "No messages yet";
    
    if (message.messageType === "offer") {
      if (message.offerAmount) {
        return `Offer: NRs. ${message.offerAmount.toLocaleString()}`;
      } else if (message.exchangeProduct) {
        return `Exchange: ${message.exchangeProduct}`;
      }
    }
    if (!message.message) return "No message text";
    return message.message.length > 50 
      ? message.message.substring(0, 50) + "..." 
      : message.message;
  };

  const getProductImageUrl = (product) => {
    const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
    if (product.productImages && product.productImages.length > 0) {
      const imagePath = product.productImages[0];
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return `${PF}${imagePath}`;
    }
    return `${PF}product/1.jpeg`;
  };

  const content = (
    <div className="conversations">
      <div className="conversationsWrapper">
        {!user ? (
          <h2>Please log in to view conversations</h2>
        ) : (
          <>
            <div className="conversationsHeader">
              <h2>Product Conversations</h2>
              <p>Chat with sellers and buyers about products</p>
            </div>

            {loading ? (
              <div className="loadingConversations">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="noConversations">
                <h3>No conversations yet</h3>
                <p>Start browsing the marketplace to begin conversations with sellers!</p>
              </div>
            ) : (
              <div className="conversationsList">
                {conversations.map((conversation) => {
                  const conversationKey = `${conversation.productId._id}-${conversation.otherUser._id}`;
                  const productImageUrl = getProductImageUrl(conversation.productId);
                  const userImageUrl = getProfileImageUrl(conversation.otherUser?.profilePicture);
                  
                  return (
                    <div 
                      key={conversationKey}
                      className="conversationItem"
                      onClick={() => handleConversationClick(conversation)}
                    >
                      <div className="conversationProduct">
                        <img 
                          src={productImageUrl} 
                          alt={conversation.productId.productName || "Product"} 
                          className="productImage"
                          onError={(e) => {
                            const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
                            e.target.src = `${PF}product/1.jpeg`;
                          }}
                        />
                        <div className="productInfo">
                          <h4>
                            {conversation.productId.productName || "Unknown Product"}
                            {conversation.productId.productFor === "Sale" && conversation.productId.productPrice && (
                              <span className="conversationPriceInTitle"> - NPR {conversation.productId.productPrice.toLocaleString()}</span>
                            )}
                            {conversation.productId.productFor === "Giveaway" && conversation.productId.desiredProduct && (
                              <span className="conversationDesiredInTitle"> - Want: {conversation.productId.desiredProduct}</span>
                            )}
                            {conversation.productId.productFor === "Exchange" && conversation.productId.exchangeFor && (
                              <span className="conversationExchangeInTitle"> - For: {conversation.productId.exchangeFor}</span>
                            )}
                          </h4>
                          <span className={`productStatus ${conversation.productId.status || "Active"}`}>
                            {conversation.productId.status || "Active"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="conversationUser">
                        <img 
                          src={userImageUrl} 
                          alt={conversation.otherUser?.username || "User"} 
                          className="userAvatar"
                          onError={(e) => {
                            e.target.src = getProfileImageUrl(null);
                          }}
                        />
                        <div className="userInfo">
                          <h5>{conversation.otherUser?.username || "Unknown User"}</h5>
                          <span className="messageCount">
                            {conversation.messageCount || 0} {conversation.messageCount === 1 ? "message" : "messages"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="conversationPreview">
                        <p>{getLastMessagePreview(conversation.lastMessage)}</p>
                        {conversation.lastMessage && (
                          <span className="lastMessageTime">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <div className="unreadBadge">
                          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Message Box */}
      {showMessageBox && selectedConversation && user && (
        <ProductMessageBox
          product={selectedConversation.productId}
          otherUser={selectedConversation.otherUser}
          currentUser={user}
          isOpen={showMessageBox}
          onClose={() => {
            setShowMessageBox(false);
            setSelectedConversation(null);
          }}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );

  return embedded ? content : (
    <Layout>
      {content}
    </Layout>
  );
}
