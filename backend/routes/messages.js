const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const router = require('express').Router()
const { createMessageNotification } = require('../utils/notificationService')

//CREATE
router.post('/',async(req,res)=>{
    try{
        // Ensure messageType is set correctly
        const messageData = {
            ...req.body,
            messageType: req.body.imageUrl ? 'image' : (req.body.messageType || 'text')
        };
        
        // If it's an image message and no text, set text to null
        if (messageData.messageType === 'image' && !messageData.text) {
            messageData.text = null;
        }
        
        const message = new Message(messageData)
        const savedMessage = await message.save()
        
        // Create notification for new message
        try {
            const conversation = await Conversation.findById(req.body.conversationId);
            if (conversation) {
                const receiverId = conversation.members.find(member => member !== req.body.sender);
                if (receiverId && receiverId.toString() !== req.body.sender.toString()) {
                    const notificationText = messageData.imageUrl 
                        ? "Sent an image" 
                        : (req.body.text || "New message");
                    await createMessageNotification(
                        req.body.conversationId,
                        req.body.sender,
                        receiverId,
                        notificationText
                    );
                }
            }
        } catch (notificationError) {
            console.error("Error creating message notification:", notificationError);
        }
        
        res.status(201).json(savedMessage)
    }catch(err){
        res.status(500).json(err)
    }
})
//GET

router.get("/:conversationId",async(req,res)=>{
    try{
        const messages = await Message.find({
        conversationId:req.params.conversationId
    })
    res.status(200).json(messages)
    }catch(error){
        res.status(500).json(err)
    }
})
router.put("/read/:conversationId", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json("User ID is required");
        }

        const { conversationId } = req.params;
        if (!conversationId) {
            return res.status(400).json("Conversation ID is required");
        }

        const updateResult = await Message.updateMany(
            {
                conversationId,
                "readBy.userId": { $ne: userId }
            },
            {
                $push: { readBy: { userId, readAt: new Date() } },
                $set: { isRead: true }
            }
        );

        res.status(200).json({
            message: "Messages marked as read",
            modifiedCount: updateResult.modifiedCount
        });
    } catch (err) {
        console.error("Error marking messages as read:", err);
        res.status(500).json(err);
    }
});

module.exports = router;