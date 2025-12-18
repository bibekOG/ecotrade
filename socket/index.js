const io = require("socket.io")(8900, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    },
   
  });

// Initialize notification socket handler
const notificationSocket = require("../backend/socket/notificationSocket");
notificationSocket.initializeSocket(io);

// Initialize notification service with Socket.io instance
const { setSocketIO } = require("../backend/utils/notificationService");
setSocketIO(io);

let users = [] ;
let activeCalls = new Map(); // Track active calls
let typingUsers = new Map(); // Track typing users per conversation

const addUser = (userId, socketId) => {
    // Remove any existing user with same userId to avoid duplicates
    users = users.filter((user) => user.userId !== userId);
    users.push({ userId, socketId });
}

const removeUser = (socketId)=>{
    const userToRemove = users.find(user => user.socketId === socketId);
    if (userToRemove) {
        // Clean up any active calls
        activeCalls.delete(userToRemove.userId);
        
        // Clean up typing indicators
        for (let [conversationId, typingSet] of typingUsers) {
            typingSet.delete(userToRemove.userId);
            if (typingSet.size === 0) {
                typingUsers.delete(conversationId);
            }
        }
    }
    users = users.filter((user)=>user.socketId !== socketId);
}

const getUser = (userId)=>{
    return users.find((user)=>user.userId === userId)
}

const getUsersByIds = (userIds) => {
    return users.filter(user => userIds.includes(user.userId));
}

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // take userId and socketId from the user
    socket.on('addUser',(userId)=>{
        addUser(userId,socket.id)
        io.emit('getUsers',users)
        console.log(`User ${userId} added with socket ${socket.id}`);
    })

    //send and get messages
    socket.on('sendMessage', ({ senderId, receiverId, text, imageUrl, messageType, conversationId, messageId }) => {
        const user = getUser(receiverId);
        if (user && user.socketId) {
            io.to(user.socketId).emit("getMessage", { 
                senderId, 
                text, 
                imageUrl, 
                messageType: imageUrl ? 'image' : (messageType || 'text'),
                conversationId, 
                messageId 
            });
        }
    })

    // Call signaling events
    socket.on('callUser', ({ userToCall, signalData, from, name, type, conversationId }) => {
        console.log('Call initiated:', { userToCall, from, type, conversationId });
        const user = getUser(userToCall);
        if (user && user.socketId) {
            console.log('Sending call to user:', user.userId, 'on socket:', user.socketId);
            io.to(user.socketId).emit('callUser', {
                signal: signalData,
                from,
                name,
                type,
                offer: signalData,
                conversationId,
                isReceivingCall: true
            });
        } else {
            console.log('User not found or not online:', userToCall);
            socket.emit('callFailed', { error: 'User not available' });
        }
    });

    socket.on('answerCall', ({ answer, to }) => {
        console.log('Call answered:', { to });
        const user = getUser(to);
        if (user && user.socketId) {
            io.to(user.socketId).emit('callAccepted', { signal: answer, answer });
        }
    });

    socket.on('endCall', ({ to }) => {
        console.log('Call ended:', { to });
        const user = getUser(to);
        if (user && user.socketId) {
            io.to(user.socketId).emit('callEnded');
        }
        // Also clean up if callId is provided
        if (to) {
            // Clean up any active calls involving this user
            for (let [callId, call] of activeCalls) {
                if (call.caller === to || call.receiver === to) {
                    activeCalls.delete(callId);
                }
            }
        }
    });

    socket.on('iceCandidate', ({ candidate, to }) => {
        const user = getUser(to);
        if (user && user.socketId) {
            io.to(user.socketId).emit('iceCandidate', { candidate });
        }
    });

    // typing indicator
    socket.on('typing', ({ to, conversationId, userId, username, isTyping }) => {
        const user = getUser(to);
        if (!user || !user.socketId) return;
        if (isTyping) {
            io.to(user.socketId).emit('userTyping', { conversationId, userId, username });
        } else {
            io.to(user.socketId).emit('userStoppedTyping', { conversationId, userId });
        }
    });

    // Message read receipts
    socket.on('markAsRead', ({ conversationId, userId, messageIds }) => {
        // Broadcast read receipt to other users in conversation
        socket.broadcast.emit('messagesRead', { 
            conversationId, 
            userId, 
            messageIds,
            readAt: new Date()
        });
    });

    // Enhanced call signaling
    socket.on('initiateCall', ({ userToCall, from, name, type, conversationId }) => {
        const callId = `call_${Date.now()}_${from}`;
        const receiver = getUser(userToCall);
        
        if (receiver && receiver.socketId) {
            // Store active call
            activeCalls.set(callId, {
                caller: from,
                receiver: userToCall,
                type,
                status: 'calling',
                startTime: new Date()
            });
            
            io.to(receiver.socketId).emit('incomingCall', {
                callId,
                from,
                name,
                type,
                conversationId
            });
            
            // Notify caller that call is being initiated
            socket.emit('callInitiated', { callId, userToCall });
        } else {
            socket.emit('callFailed', { error: 'User not available' });
        }
    });

    socket.on('acceptCall', ({ callId, answer }) => {
        const call = activeCalls.get(callId);
        if (call) {
            call.status = 'active';
            call.acceptedAt = new Date();
            
            const caller = getUser(call.caller);
            if (caller && caller.socketId) {
                io.to(caller.socketId).emit('callAccepted', { 
                    callId,
                    signal: answer 
                });
            }
        }
    });

    socket.on('rejectCall', ({ callId }) => {
        const call = activeCalls.get(callId);
        if (call) {
            const caller = getUser(call.caller);
            if (caller && caller.socketId) {
                io.to(caller.socketId).emit('callRejected', { callId });
            }
            activeCalls.delete(callId);
        }
    });

    socket.on('endCall', ({ callId, to }) => {
        const call = activeCalls.get(callId);
        if (call) {
            call.status = 'ended';
            call.endedAt = new Date();
            call.duration = Math.floor((call.endedAt - (call.acceptedAt || call.startTime)) / 1000);
            
            // Notify the other participant
            const otherUser = getUser(to);
            if (otherUser && otherUser.socketId) {
                io.to(otherUser.socketId).emit('callEnded', { callId, duration: call.duration });
            }
            
            activeCalls.delete(callId);
        }
    });

    // WebRTC signaling
    socket.on('offer', ({ callId, offer, to }) => {
        const receiver = getUser(to);
        if (receiver && receiver.socketId) {
            io.to(receiver.socketId).emit('offer', { callId, offer });
        }
    });

    socket.on('answer', ({ callId, answer, to }) => {
        const caller = getUser(to);
        if (caller && caller.socketId) {
            io.to(caller.socketId).emit('answer', { callId, answer });
        }
    });

    socket.on('iceCandidate', ({ callId, candidate, to }) => {
        const receiver = getUser(to);
        if (receiver && receiver.socketId) {
            io.to(receiver.socketId).emit('iceCandidate', { callId, candidate });
        }
    });

    // Join/leave conversation rooms for better message delivery
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
        socket.leave(conversationId);
        console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });

    // Setup notification handlers
    notificationSocket.setupNotificationHandlers(socket);
    
    // Handle notification room joining (for real-time notifications)
    socket.on('joinNotificationRoom', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined notification room: user_${userId}`);
        
        // Request and send unread count
        socket.emit('requestUnreadCount', userId);
    });
    
    socket.on('leaveNotificationRoom', (userId) => {
        socket.leave(`user_${userId}`);
        console.log(`User ${userId} left notification room`);
    });
    
    // Handle unread count request
    socket.on('requestUnreadCount', async (userId) => {
        try {
            const Notification = require('../backend/models/Notification');
            const count = await Notification.countDocuments({
                recipientId: userId,
                read: false
            });
            socket.emit('unreadCountUpdate', { unreadCount: count });
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    });

    //when disconnected
    socket.on('disconnect',()=>{
        console.log("User disconnected:", socket.id);
        removeUser(socket.id);
        io.emit('getUsers',users);
    })
})

