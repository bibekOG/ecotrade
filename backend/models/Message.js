const mongoose = require('mongoose')

const  MessageSchema = new mongoose.Schema({
    conversationId:{
        type:String
    },
    sender:{
        type:String
    },
    text:{
        type:String
    },
    imageUrl: {
        type: String
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'call'],
        default: 'text'
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        required: function() { return this.messageType === 'call'; }
    },
    callDuration: {
        type: Number, // in seconds
        required: function() { return this.messageType === 'call'; }
    },
    readBy: [{
        userId: {
            type: String
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isRead: {
        type: Boolean,
        default: false
    }
},
{timestamps:true}
)


module.exports = mongoose.model("Message",MessageSchema)