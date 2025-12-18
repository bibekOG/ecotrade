const mongoose = require('mongoose')

const  ConversationSchema = new mongoose.Schema(
    {
        members:{
            type:Array
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        unreadCount: [{
            userId: String,
            count: {
                type: Number,
                default: 0
            }
        }]
    },  
{timestamps:true}
)


module.exports = mongoose.model("Conversation",ConversationSchema)