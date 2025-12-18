import { useEffect, useState } from "react"
import "./productMessages.css"
import apiClient from "../../utils/apiClient"
import { getProfileImageUrl, getImageUrl } from "../../utils/imageUtils"

export const ProductMessages = ({ currentUser, onConversationSelect }) => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState(null)
  
  useEffect(() => {
    if (!currentUser?._id) return;
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/productMessages/user/${currentUser._id}`);
        
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
      } catch (error) {
        console.error("Error fetching product conversations:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchConversations();
    
    // Refresh conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [currentUser?._id])

  const handleClick = (conversation) => {
    setSelectedConversation(conversation)
    if (onConversationSelect) {
      onConversationSelect(conversation)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? "Yesterday" : `${diffInDays}d ago`;
    }
  }

  const getLastMessagePreview = (message) => {
    if (message.messageType === "offer") {
      if (message.offerAmount) {
        return `Offer: NRs. ${message.offerAmount}`;
      } else if (message.exchangeProduct) {
        return `Exchange: ${message.exchangeProduct}`;
      }
      return "Sent an offer";
    } else if (message.messageType === "image") {
      return "📷 Sent an image";
    } else if (message.message) {
      return message.message.length > 30 
        ? message.message.substring(0, 30) + "..." 
        : message.message;
    }
    return "No message";
  }

  if (loading) {
    return (
      <div className="productMessages">
        <h3 className="productMessagesTitle">Product Messages</h3>
        <div className="productMessagesEmpty">
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="productMessages">
        <h3 className="productMessagesTitle">Product Messages</h3>
        <div className="productMessagesEmpty">
          <p>No product conversations yet</p>
          <p className="emptySubtext">Start chatting about products in the marketplace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="productMessages">
      <h3 className="productMessagesTitle">Product Messages ({conversations.length})</h3>
      
      {/* Product Image Section - Show selected product or first conversation */}
      {conversations.length > 0 && (
        <div className="productMessagesProductSection">
          {selectedConversation ? (
            <>
              {selectedConversation.productId?.productImages?.[0] ? (
                <img
                  className="productMessagesMainImage"
                  src={getImageUrl(selectedConversation.productId.productImages[0])}
                  alt={selectedConversation.productId.productName}
                  onError={(e) => {
                    e.target.src = getProfileImageUrl("person/noAvatar.png");
                  }}
                />
              ) : (
                <div className="productMessagesMainImagePlaceholder">
                  📦
                </div>
              )}
              <div className="productMessagesProductInfo">
                <h4 className="productMessagesProductName">
                  {selectedConversation.productId?.productName || "Product"}
                </h4>
                <p className="productMessagesProductUser">
                  with {selectedConversation.otherUser?.username || "User"}
                </p>
              </div>
            </>
          ) : (
            <>
              {conversations[0].productId?.productImages?.[0] ? (
                <img
                  className="productMessagesMainImage"
                  src={getImageUrl(conversations[0].productId.productImages[0])}
                  alt={conversations[0].productId.productName}
                  onError={(e) => {
                    e.target.src = getProfileImageUrl("person/noAvatar.png");
                  }}
                />
              ) : (
                <div className="productMessagesMainImagePlaceholder">
                  📦
                </div>
              )}
              <div className="productMessagesProductInfo">
                <h4 className="productMessagesProductName">
                  {conversations[0].productId?.productName || "Product"}
                </h4>
                <p className="productMessagesProductUser">
                  Select a conversation
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Messages List Below */}
      <div className="productMessagesContainer">
        {conversations.map((conv) => {
          const productImage = conv.productId?.productImages?.[0] || null;
          const otherUser = conv.otherUser;
          const lastMessage = conv.lastMessage;
          const isSelected = selectedConversation && 
            selectedConversation.productId?._id === conv.productId?._id &&
            selectedConversation.otherUser?._id === conv.otherUser?._id;
          
          return (
            <div 
              key={`${conv.productId._id}-${conv.otherUser._id}`}
              className={`productMessageItem ${isSelected ? 'selected' : ''}`}
              onClick={() => handleClick(conv)}
            >
              <div className="productMessageImageContainer">
                {productImage ? (
                  <img
                    className="productMessageProductImage"
                    src={getImageUrl(productImage)}
                    alt={conv.productId.productName}
                    onError={(e) => {
                      e.target.src = getProfileImageUrl("person/noAvatar.png");
                    }}
                  />
                ) : (
                  <div className="productMessageProductImagePlaceholder">
                    📦
                  </div>
                )}
                <img
                  className="productMessageUserAvatar"
                  src={getProfileImageUrl(otherUser?.profilePicture)}
                  alt={otherUser?.username}
                  onError={(e) => {
                    e.target.src = getProfileImageUrl("person/noAvatar.png");
                  }}
                />
              </div>
              <div className="productMessageContent">
                <div className="productMessageHeader">
                  <span className="productMessageProductName">
                    {conv.productId?.productName || "Product"}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="productMessageUnreadBadge">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="productMessageUser">
                  {otherUser?.username || "User"}
                </div>
                <div className="productMessagePreview">
                  {getLastMessagePreview(lastMessage)}
                </div>
                <div className="productMessageTime">
                  {formatTime(lastMessage.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

