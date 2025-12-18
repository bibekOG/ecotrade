import  './message.css'
import {format} from "timeago.js"
import React, {memo, useEffect, useState} from "react"
import apiClient from "../../utils/apiClient"
import { getProfileImageUrl, getImageUrl } from '../../utils/imageUtils'

export const Message = memo(({message,own}) => {
  const [sender,setSender]=useState(null)

  useEffect(()=>{
    if (!message?.sender) return;
    
    const getUser = async()=>{
      try{
        const res = await apiClient.get(`/users?userId=${message.sender}`)
        setSender(res.data)
      }catch(error){
        console.error("Error fetching message sender:", error)
      }
    }
    getUser()
  },[message?.sender])
  
  // Get the full image URL for message attachments
  const getMessageImageUrl = () => {
    if (!message.imageUrl) return null;
    
    // If it's already a full URL, return as is
    if (message.imageUrl.startsWith('http://') || message.imageUrl.startsWith('https://')) {
      return message.imageUrl;
    }
    
    // If it starts with /images/, construct full URL
    if (message.imageUrl.startsWith('/images/')) {
      // Get base URL, removing trailing /images/ if present
      let baseUrl = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
      baseUrl = baseUrl.replace(/\/images\/?$/, '');
      // Ensure baseUrl doesn't end with /
      baseUrl = baseUrl.replace(/\/$/, '');
      return `${baseUrl}${message.imageUrl}`;
    }
    
    // Otherwise use the imageUtils helper
    return getImageUrl(message.imageUrl);
  };
  
  const imageUrl = getMessageImageUrl();
  
  // Filter out placeholder text like "Cattachment" when there's an image
  const displayText = message.text && 
    !message.text.toLowerCase().includes('cattachment') && 
    !message.text.toLowerCase().includes('attachment') &&
    message.text.trim() !== 'Cattachment' 
    ? message.text 
    : null;
  
  // Determine if this is an image message
  const isImageMessage = imageUrl || message.messageType === 'image';
  
  return (
         <div className={own ? "message own" : "message"}>
            <div className='messageTop'>
                <img src={getProfileImageUrl(sender?.profilePicture)} alt={sender?.username || 'User'}  className='messageImg' />
                <div className="messageBubble">
                  {isImageMessage && imageUrl && (
                    <a href={imageUrl} target="_blank" rel="noreferrer" className="messageImageLink">
                      <img 
                        src={imageUrl} 
                        alt="Message attachment" 
                        className='messageAttachedImage'
                        onError={(e) => {
                          console.error('Failed to load image:', imageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    </a>
                  )}
                  {displayText && <p className="messageText">{displayText}</p>}
                </div>
            </div>
            <div className='messageBottom'>
                {format(message.createdAt)}
            </div>
         </div>
  )
})

Message.displayName = 'Message'
