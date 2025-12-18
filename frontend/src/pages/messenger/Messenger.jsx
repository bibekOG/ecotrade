import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { ProductMessages } from "../../components/productMessages/ProductMessages"
import ProductMessageBox from "../../components/marketplace/ProductMessageBox"
import { Conversations } from "../../components/conversations/Conversation"
import { Message } from "../../components/message/Message"
import Layout from "../../components/layout/Layout"
import { AuthContext } from "../../context/AuthContext"
import Call from "../../components/call/Call"
import "./messenger.css"
import {io} from "socket.io-client"
import { useLocation } from "react-router-dom"
import { getProfileImageUrl } from "../../utils/imageUtils"
import apiClient from "../../utils/apiClient"

export const Messenger = () => {
    const [conversations,SetConversations] =useState([])
    const [currentChat,setCurrentChat] =useState(null)
    const [messages,setMessages] =useState([])
    const [arrivalMessage,setArrivalMessage] =useState(null)
    const [onlineUsers,setOnlineUsers]=useState([])
    const [newMessage,setNewMessage]=useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const {user} = useContext(AuthContext)
    const [imageFile, setImageFile] = useState(null)
    const [currentChatUser, setCurrentChatUser] = useState(null)
    const [call, setCall] = useState(null)
    const [unreadCounts, setUnreadCounts] = useState({})
    const [typingUsers, setTypingUsers] = useState([])
    const [isTyping, setIsTyping] = useState(false)
    const [selectedProductConversation, setSelectedProductConversation] = useState(null)
    const socket = useRef()
    const scrollRef = useRef()
    const textareaRef = useRef(null)
    const location = useLocation()
    const typingTimeoutRef = useRef(null)
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "ws://localhost:8900"

    // Handle friend parameter from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const friendId = params.get('friend');
        
        if (friendId) {
            // Check if conversation already exists
            const existingConversation = conversations.find(
                conv => conv.members.includes(friendId)
            );
            
            if (existingConversation) {
                setCurrentChat(existingConversation);
            } else {
                // Create new conversation with friend
                createConversationWithFriend(friendId);
            }
        }
    }, [conversations, location.search]);

    const createConversationWithFriend = async (friendId) => {
        try {
            // Check if conversation already exists
            try {
                const existingRes = await apiClient.get(`/conversations/find/${user._id}/${friendId}`);
                if (existingRes.data && existingRes.data._id) {
                    setCurrentChat(existingRes.data);
                    // Refresh conversations to ensure it's in the list
                    const convRes = await apiClient.get(`/conversations/${user._id}`);
                    SetConversations(convRes.data || []);
                    return;
                }
            } catch (findErr) {
                // Conversation doesn't exist, create new one
            }
            
            const res = await apiClient.post("/conversations", {
                senderId: user._id,
                receiverId: friendId
            });
            
            // Refresh conversations list to get full data
            const convRes = await apiClient.get(`/conversations/${user._id}`);
            const updatedConversations = convRes.data || [];
            SetConversations(updatedConversations);
            
            // Find and set the new conversation as current
            const newConv = updatedConversations.find(c => 
                c.members.includes(user._id) && c.members.includes(friendId)
            );
            if (newConv) {
                setCurrentChat(newConv);
            } else {
                setCurrentChat(res.data);
            }
        } catch (err) {
            console.error("Error creating conversation:", err);
            alert("Failed to create conversation. Please try again.");
        }
    };


    useEffect(()=>{
        if (!user?._id) return;
        
        socket.current = io(SOCKET_URL, {
            transports: ["websocket"],
        });
        
        // Add user to socket when connected
        socket.current.on('connect', () => {
            console.log('Socket connected:', socket.current.id);
            socket.current.emit("addUser", user._id);
        });
        
        // Message events
        socket.current.on('getMessage',(data)=>{
            console.log('Received message via Socket:', data);
            setArrivalMessage({
                sender : data.senderId,
                text : data.text,
                imageUrl: data.imageUrl,
                messageType: data.imageUrl ? 'image' : (data.messageType || 'text'),
                conversationId: data.conversationId,
                createdAt: Date.now(),
                _id: data.messageId || `temp_${Date.now()}`
            })
            
            // Update unread count if message is not from current chat
            if (!currentChat || currentChat._id !== data.conversationId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.conversationId]: (prev[data.conversationId] || 0) + 1
                }));
            }
        })

        // Call events
        socket.current.on('callUser', (data) => {
            setCall({
                ...data,
                isReceivingCall: true
            });
        });

        socket.current.on('callAccepted', (data) => {
            setCall(prev => prev ? { ...prev, callAccepted: true, signal: data.signal } : null);
        });

        socket.current.on('callEnded', () => {
            setCall(null);
        });

        // Typing events
        socket.current.on('userTyping', (data) => {
            if (currentChat && currentChat._id === data.conversationId && data.userId !== user._id) {
                setTypingUsers(prev => {
                    if (!prev.find(u => u.userId === data.userId)) {
                        return [...prev, { userId: data.userId, username: data.username }];
                    }
                    return prev;
                });
            }
        });

        socket.current.on('userStoppedTyping', (data) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        });

        // Online users
        socket.current.on('getUsers', (users) => {
            setOnlineUsers(users.map(u => u.userId));
        });

        return () => {
            if (socket.current) {
                socket.current.off('connect');
                socket.current.off('getMessage');
                socket.current.off('callUser');
                socket.current.off('callAccepted');
                socket.current.off('callEnded');
                socket.current.off('userTyping');
                socket.current.off('userStoppedTyping');
                socket.current.off('getUsers');
                socket.current.disconnect();
            }
        };
    },[SOCKET_URL, user?._id])

    useEffect(()=>{
        if (!arrivalMessage) return;
        
        // Check if message belongs to current chat
        const isFromCurrentChat = currentChat?._id === arrivalMessage.conversationId;
        const isFromCurrentChatMember = currentChat?.members?.includes(arrivalMessage.sender);
        
        if (isFromCurrentChat && isFromCurrentChatMember) {
            // Add message to current chat
            setMessages((prev)=>{
                // Prevent duplicates
                const messageExists = prev.some(m => m._id === arrivalMessage._id);
                if (messageExists) return prev;
                return [...prev, arrivalMessage];
            });
        }
        
        // Update conversation order when new message arrives
        SetConversations((prev) => {
            return prev.map((conv) => {
                if (conv._id === arrivalMessage.conversationId) {
                    return {
                        ...conv,
                        lastMessage: arrivalMessage,
                        lastMessageTime: new Date(arrivalMessage.createdAt || Date.now())
                    };
                }
                return conv;
            }).sort((a, b) => {
                const timeA = a.lastMessageTime || new Date(0);
                const timeB = b.lastMessageTime || new Date(0);
                return timeB - timeA;
            });
        });
    },[arrivalMessage, currentChat?._id, currentChat?.members])

   useEffect(()=>{
    if (!user?._id || !socket.current) return;
    
    // Only emit if socket is connected
    if (socket.current.connected) {
        socket.current.emit("addUser", user._id);
    } else {
        // Wait for connection
        socket.current.once('connect', () => {
            socket.current.emit("addUser", user._id);
        });
    }
    
    const handleGetUsers = (users) => {
        const onlineUserIds = user.followings?.filter((f) => users.some((u) => u.userId === f)) || [];
        console.log('Online users:', onlineUserIds);
        setOnlineUsers(onlineUserIds);
    };
    
    socket.current.on('getUsers', handleGetUsers);
    
    return () => {
        if (socket.current) {
            socket.current.off('getUsers', handleGetUsers);
        }
    };
   },[user?._id, user?.followings])
   


    useEffect(()=>{
        if (!user?._id) return;
        
        const getConversations = async () => {
           try {
             console.log('Fetching conversations for user:', user._id);
             const res = await apiClient.get(`/conversations/${user._id}`);
             
             if (!res.data || !Array.isArray(res.data)) {
                 console.warn('Invalid conversations response:', res.data);
                 SetConversations([]);
                 return;
             }
             
             console.log(`Found ${res.data.length} conversations`);
             
             // Remove duplicates by conversation ID
             const uniqueConversations = new Map();
             res.data.forEach((conv) => {
                 if (conv._id && !uniqueConversations.has(conv._id)) {
                     uniqueConversations.set(conv._id, conv);
                 }
             });
             
             // Convert Map to array and fetch last messages
             const conversationsArray = Array.from(uniqueConversations.values());
             
             // Fetch last message for each conversation and sort by latest
             const conversationsWithLastMessage = await Promise.all(
                 conversationsArray.map(async (conv) => {
                     try {
                        const messagesRes = await apiClient.get(`/message/${conv._id}`);
                         const messages = Array.isArray(messagesRes.data) ? messagesRes.data : [];
                         const lastMessage = messages.length > 0 
                             ? messages[messages.length - 1] 
                             : null;
                         return {
                             ...conv,
                             lastMessage,
                             lastMessageTime: lastMessage ? new Date(lastMessage.createdAt) : new Date(conv.updatedAt || conv.createdAt || 0)
                         };
                     } catch (err) {
                         console.error(`Error fetching messages for conversation ${conv._id}:`, err);
                         return {
                             ...conv,
                             lastMessage: null,
                             lastMessageTime: new Date(conv.updatedAt || conv.createdAt || 0)
                         };
                     }
                 })
             );
             
             // Sort by latest message time (newest first)
             conversationsWithLastMessage.sort((a, b) => {
                 return b.lastMessageTime - a.lastMessageTime;
             });
             
             console.log('Setting conversations:', conversationsWithLastMessage.length);
             SetConversations(conversationsWithLastMessage);
            } catch(error) {
                console.error('Error fetching conversations:', error);
                SetConversations([]);
            }
        };
        
        getConversations();
    }, [user?._id])

    useEffect(()=>{
        const getMessages = async()=>{
            if (!currentChat?._id) return;
            
            try {
                console.log('Fetching messages for conversation:', currentChat._id);
                const res = await apiClient.get(`/message/${currentChat._id}`)
                const messages = Array.isArray(res.data) ? res.data : [];
                console.log(`Loaded ${messages.length} messages`);
                setMessages(messages)
                
                // Mark messages as read when opening chat
                setUnreadCounts(prev => ({
                    ...prev,
                    [currentChat._id]: 0
                }));
            } catch (error) {
                console.error('Error fetching messages:', error);
                setMessages([]);
            }
        }
        getMessages();
    },[currentChat?._id])

    // Get current chat user info
    useEffect(() => {
        if (!currentChat || !user) return;
        
        const friendId = currentChat.members.find(member => member !== user._id);
        if (!friendId) return;

        const getChatUser = async () => {
            try {
                const res = await apiClient.get(`/users?userId=${friendId}`);
                setCurrentChatUser(res.data);
            } catch (error) {
                console.error("Error fetching chat user:", error);
            }
        };
        getChatUser();
    }, [currentChat, user]);

    // Focus textarea when chat is selected
    useEffect(() => {
        if (currentChat && textareaRef.current) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [currentChat]);
    //console.log(messages)

    // Mark messages as read when conversation is opened
    useEffect(() => {
        if (!currentChat || !user) return;

        const markAsRead = async () => {
            try {
                await apiClient.put(`/message/read/${currentChat._id}`, { userId: user._id });
                
                // Update local unread count
                setUnreadCounts(prev => ({
                    ...prev,
                    [currentChat._id]: 0
                }));

                // Update conversations list
                SetConversations(prev => 
                    prev.map(conv => 
                        conv._id === currentChat._id 
                            ? { ...conv, unreadCount: 0 }
                            : conv
                    )
                );

                // Emit socket event for real-time update
                socket.current?.emit('markMessageRead', {
                    conversationId: currentChat._id,
                    userId: user._id
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        };

        // Mark as read when conversation is opened
        markAsRead();

        // Join conversation room for real-time updates
        if (socket.current && socket.current.connected) {
            socket.current.emit('joinConversation', currentChat._id);
        }

        return () => {
            // Leave conversation room when switching conversations
            if (socket.current && socket.current.connected) {
                socket.current.emit('leaveConversation', currentChat._id);
            }
        };
    }, [currentChat, user]);

    // Handle typing indicator - ALWAYS update state first
    const handleInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);
        
        // Handle typing indicator only if chat is active
        if (!currentChat || !socket.current || !user) {
            return;
        }

        const receiverId = currentChat.members.find(member => member !== user._id);
        if (!receiverId) return;

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Emit typing start only if user started typing
        if (value.trim().length > 0 && !isTyping) {
            setIsTyping(true);
            socket.current.emit('typing', {
                conversationId: currentChat._id,
                userId: user._id,
                username: user.username,
                isTyping: true,
                to: receiverId
            });
        }

        // Set timeout to stop typing after user stops typing
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                socket.current.emit('typing', {
                    conversationId: currentChat._id,
                    userId: user._id,
                    username: user.username,
                    isTyping: false,
                    to: receiverId
                });
            }
        }, 2000);
    };

    const handleSubmit = async (e)=>{
        e.preventDefault()
        
        // Safety checks
        if (!currentChat || !user) {
            console.error('No chat selected or user not found');
            return;
        }
        
        if (!newMessage.trim() && !imageFile) {
            return;
        }
        
        // Clear typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        
        // Stop typing indicator
        if (isTyping && socket.current) {
            setIsTyping(false);
            const receiverId = currentChat.members.find(member => member !== user._id);
            socket.current.emit('typing', {
                conversationId: currentChat._id,
                userId: user._id,
                username: user.username,
                isTyping: false,
                to: receiverId
            });
        }

        const messageText = newMessage.trim();
        const receiverId = currentChat.members.find(member => member !== user._id);
        
        let imageUrl = null;
        if (imageFile) {
            const form = new FormData();
            form.append('file', imageFile);
            try {
                const up = await apiClient.post('/upload', form, { 
                    headers: { 'Content-Type': 'multipart/form-data' } 
                });
                if (up.status === 200 && up.data?.filename) {
                    // Store the full path that will be accessible
                    imageUrl = `/images/${up.data.filename}`;
                }
            } catch (e) {
                console.error('Error uploading image:', e);
                alert('Failed to upload image. Please try again.');
                return;
            }
        }
        
        const message = {
            conversationId: currentChat._id,
            sender: user._id,
            text: imageUrl ? (messageText || null) : messageText, // Only include text if there's no image, or if user also typed text
            imageUrl: imageUrl || null,
            messageType: imageUrl ? 'image' : 'text',
            receiver: receiverId
        };

        try {
            console.log('Sending message:', message);
            const res = await apiClient.post("/message", message);
            console.log('Message sent successfully:', res.data);
            
            // Add message to local state immediately
            const newMessage = {
                ...res.data,
                sender: user._id,
                text: imageUrl ? (messageText || null) : messageText,
                imageUrl: imageUrl || null,
                messageType: imageUrl ? 'image' : 'text'
            };
            setMessages((prev) => {
                // Prevent duplicates
                const messageExists = prev.some(m => m._id === newMessage._id);
                if (messageExists) return prev;
                return [...prev, newMessage];
            });
            
            // Emit socket event for real-time delivery
            if (socket.current && socket.current.connected) {
                socket.current.emit('sendMessage', {
                    senderId: user._id,
                    receiverId: receiverId,
                    text: imageUrl ? (messageText || null) : messageText,
                    imageUrl: imageUrl || null,
                    messageType: imageUrl ? 'image' : 'text',
                    messageId: res.data._id,
                    conversationId: currentChat._id
                });
                console.log('Message emitted via Socket.io');
            } else {
                console.warn('Socket not connected, message saved but not delivered in real-time');
            }

            // Clear input and refocus
            setNewMessage("");
            setImageFile(null);
            
            // Refocus textarea
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
            
            // Update conversation order when message is sent
            SetConversations((prev) => {
                return prev.map((conv) => {
                    if (conv._id === currentChat._id) {
                        return {
                            ...conv,
                            lastMessage: res.data,
                            lastMessageTime: new Date(res.data.createdAt || Date.now()),
                            updatedAt: new Date()
                        };
                    }
                    return conv;
                }).sort((a, b) => {
                    const timeA = a.lastMessageTime || new Date(0);
                    const timeB = b.lastMessageTime || new Date(0);
                    return timeB - timeA;
                });
            });
        } catch(err) {
            console.error('Error sending message:', err);
            alert('Failed to send message. Please try again.');
        }
    }

    const displayedMessages = useMemo(() => {
        const total = messages?.length || 0
        if (total <= 100) return messages
        return messages.slice(total - 100)
    }, [messages])

    useEffect(()=>{
        scrollRef.current?.scrollIntoView({behavior:"smooth"})
    },[displayedMessages])

    const handleAudioCall = () => {
        if (!currentChat || !currentChatUser) {
            alert('Please select a conversation first');
            return;
        }
        if (!socket.current || !socket.current.connected) {
            alert('Connection not ready. Please wait a moment and try again.');
            return;
        }
        const receiverId = currentChat.members.find(member => member !== user._id);
        if (!receiverId) {
            alert('Unable to find receiver');
            return;
        }
        console.log('Initiating audio call to:', receiverId);
        setCall({
            type: 'audio',
            userToCall: receiverId,
            from: user._id,
            name: user.username,
            conversationId: currentChat._id,
            isReceivingCall: false
        });
    };

    const handleVideoCall = () => {
        if (!currentChat || !currentChatUser) {
            alert('Please select a conversation first');
            return;
        }
        if (!socket.current || !socket.current.connected) {
            alert('Connection not ready. Please wait a moment and try again.');
            return;
        }
        const receiverId = currentChat.members.find(member => member !== user._id);
        if (!receiverId) {
            alert('Unable to find receiver');
            return;
        }
        console.log('Initiating video call to:', receiverId);
        setCall({
            type: 'video',
            userToCall: receiverId,
            from: user._id,
            name: user.username,
            conversationId: currentChat._id,
            isReceivingCall: false
        });
    };
    

    // Sort conversations by latest message time (newest first)
    const sortedConversations = useMemo(() => {
        if (!conversations || conversations.length === 0) return [];
        
        return [...conversations].sort((a, b) => {
            const timeA = a.lastMessageTime || new Date(0);
            const timeB = b.lastMessageTime || new Date(0);
            return timeB - timeA;
        });
    }, [conversations]);

    // Track visible conversations for search results
    const [visibleConversationIds, setVisibleConversationIds] = useState(new Set());

  return (
    <Layout>
    {call && (
        <Call
            call={call}
            setCall={setCall}
            socket={socket.current}
            currentUser={user}
            receiver={currentChatUser}
        />
    )}
    <div className="messenger">

    <div className="chatMenu">
        <div className="chatMenuWrapper">
            <h2 className="chatMenuTitle">Recent Chats</h2>
            <input 
                className="chatMenuInput" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="conversationsContainer">
                { sortedConversations && sortedConversations.length > 0 ? (
                    <>
                        {sortedConversations.map((c)=>(
                            <div onClick={()=>setCurrentChat(c)} key={c._id}>
                                <Conversations 
                                    conversation={c} 
                                    currentUser={user}
                                    onlineUsers={onlineUsers}
                                    isActive={currentChat?._id === c._id}
                                    searchQuery={searchQuery}
                                    unreadCount={unreadCounts[c._id] || 0}
                                    lastMessage={c.lastMessage}
                                    onVisibilityChange={(visible) => {
                                        setVisibleConversationIds(prev => {
                                            const newSet = new Set(prev);
                                            if (visible) {
                                                newSet.add(c._id);
                                            } else {
                                                newSet.delete(c._id);
                                            }
                                            return newSet;
                                        });
                                    }}
                                />
                            </div>
                        ))}
                        {searchQuery && searchQuery.trim() && visibleConversationIds.size === 0 && sortedConversations.length > 0 && (
                            <div className="noSearchResults">No conversations found matching "{searchQuery}"</div>
                        )}
                    </>
                ) : (
                    <div className="noSearchResults">
                        {searchQuery ? `No conversations found matching "${searchQuery}"` : "No conversations yet. Start chatting with your friends!"}
                    </div>
                )}
            </div>
        </div>
    </div>

    <div className="chatBox">
        <div className="chatBoxWrapper">
            { currentChat ? 
            (<>
            {/* Chat Header */}
            {currentChatUser && (
                <div className="chatHeader">
                    <div className="chatHeaderUser">
                        <img 
                            src={getProfileImageUrl(currentChatUser?.profilePicture)}
                            alt={currentChatUser.username}
                            className="chatHeaderAvatar"
                        />
                        <div className="chatHeaderInfo">
                            <h3 className="chatHeaderName">{currentChatUser.username}</h3>
                            <span className={`chatHeaderStatus ${onlineUsers.includes(currentChatUser._id) ? 'online' : 'offline'}`}>
                                {onlineUsers.includes(currentChatUser._id) ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <div className="chatHeaderActions">
                        <button 
                            className="callButton audioCall" 
                            onClick={handleAudioCall}
                            title="Audio Call"
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </button>
                        <button 
                            className="callButton videoCall" 
                            onClick={handleVideoCall}
                            title="Video Call"
                        >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
         <div className="chatBoxTop">

            {displayedMessages && displayedMessages.map((m, index)=>{
                const isOwn = m.sender === user._id
                const key = m._id || `${m.sender}-${m.createdAt}-${index}`
                const attachRef = index === displayedMessages.length - 1 ? scrollRef : null
                return (
                    <div ref={attachRef} key={key}>
                        <Message message={m} own={isOwn} />
                    </div>
                )
            })}
            
        </div>
        <div className="chatBoxBottom">
            <input
                type="file"
                id="imageUpload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setImageFile(e.target.files[0])}
            />
            <label htmlFor="imageUpload" className="attachmentButton" title="Attach image">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            </label>
            <div className="messageInputContainer">
                {typingUsers.length > 0 && (
                    <div className="typingIndicator">
                        <span className="typingText">
                            {typingUsers.length === 1 
                                ? `${currentChatUser?.username || 'Someone'} is typing...` 
                                : 'Multiple people are typing...'
                            }
                        </span>
                        <div className="typingDots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                {imageFile && (
                    <div className="imagePreview">
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                        <button 
                            className="removeImageButton" 
                            onClick={() => setImageFile(null)}
                            title="Remove image"
                        >
                            ×
                        </button>
                    </div>
                )}
                <textarea 
                    ref={textareaRef}
                    className="chatMessageInput"
                    onChange={handleInputChange}
                    value={newMessage || ''}
                    placeholder={currentChat ? "Type your message..." : "Select a conversation to start chatting"}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (currentChat && (newMessage.trim() || imageFile)) {
                                handleSubmit(e);
                            }
                        }
                    }}
                    disabled={!currentChat}
                    autoFocus={false}
                    tabIndex={0}
                />
            </div>
            <button 
                className={`chatBoxButton ${(!newMessage.trim() && !imageFile) ? 'disabled' : ''}`}
                onClick={handleSubmit}
                disabled={!currentChat || (!newMessage.trim() && !imageFile)}
                title="Send message"
            >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div> </>) : (<span className="noConversationText">Open a conversation to start a chat</span>)}
            
        </div>
    </div>
   
    <div className="chatOnline">
        <div className="chatOnlineWrapper">
            {!selectedProductConversation ? (
                <ProductMessages 
                    currentUser={user} 
                    onConversationSelect={setSelectedProductConversation}
                />
            ) : (
                <div className="productMessageBoxContainer">
                    <ProductMessageBox
                        product={selectedProductConversation.productId}
                        otherUser={selectedProductConversation.otherUser}
                        currentUser={user}
                        isOpen={true}
                        onClose={() => setSelectedProductConversation(null)}
                        onMessageSent={async (message) => {
                            // Refresh product conversations if needed
                            console.log("Product message sent:", message);
                            // Optionally refresh the conversation list
                        }}
                    />
                </div>
            )}
        </div>
    </div>

    </div>
    
    
    </Layout>
  )
}
