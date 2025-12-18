const Conversation = require('../models/Conversation')
const router = require('express').Router()

//CREAT NEW CONVERSATION
router.post("/",async (req,res)=>{
    try{
        const newConversation = new Conversation({
            members:[req.body.senderId,req.body.receiverId]
        })
        const savedConversation = await newConversation.save()
        res.status(201).json(savedConversation)
    }catch(err){
        res.status(500).json(err)
    }
    
    
})
//GET A USER CONVERSATION
router.get('/:userId',async(req,res)=>{
    try{
        const conversation = await Conversation.find({
            members:{$in:req.params.userId}
        });
        res.status(200).json(conversation)
    }catch(err){
        res.status(500).json(err)
    }
})

router.get('/find/:firstUserId/:secondUserId',async(req,res)=>{
    try{
        const conversation = await Conversation.findOne({
            members:{
                $all:[req.params.firstUserId,req.params.secondUserId]
            }
        })
        res.status(200).json(conversation)
    }catch(err){
        res.status(401).json(err)
    }
})

// Get unread conversations for a user
router.get('/unread/:userId',async(req,res)=>{
    try{
        const conversations = await Conversation.find({
            members:{$in:req.params.userId}
        });
        
        // For now, return all conversations as "unread"
        // In a real app, you'd check message read status
        res.status(200).json(conversations)
    }catch(err){
        res.status(500).json(err)
    }
})

module.exports = router;