import React, { useEffect, useRef, useState } from 'react';
import './callV2.css';
import { getProfileImageUrl } from '../../utils/imageUtils';

const CallV2 = ({ call, setCall, socket, currentUser, receiver }) => {
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(call?.type === 'video');
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isReceivingCall, setIsReceivingCall] = useState(false);
    const [callStartTime, setCallStartTime] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [connectionState, setConnectionState] = useState('connecting');
    
    const myVideo = useRef();
    const userVideo = useRef();
    const peerConnection = useRef();
    const localStreamRef = useRef();
    const remoteStreamRef = useRef();
    const callTimer = useRef();
    const callId = useRef(Date.now().toString());

    // WebRTC configuration
    const pcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Initialize media stream
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: call?.type === 'video',
                    audio: true
                });
                
                setStream(mediaStream);
                localStreamRef.current = mediaStream;
                
                if (myVideo.current) {
                    myVideo.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error('Error accessing media devices:', err);
                alert('Unable to access camera/microphone. Please check permissions.');
            }
        };

        if (call && !stream) {
            initializeMedia();
        }
    }, [call, stream]);

    // Initialize peer connection
    useEffect(() => {
        if (!call || !stream) return;

        const initializePeerConnection = () => {
            peerConnection.current = new RTCPeerConnection(pcConfig);
            
            // Add local stream tracks
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
            });

            // Handle remote stream
            peerConnection.current.ontrack = (event) => {
                const [remoteStream] = event.streams;
                setRemoteStream(remoteStream);
                remoteStreamRef.current = remoteStream;
                if (userVideo.current) {
                    userVideo.current.srcObject = remoteStream;
                }
            };

            // Handle ICE candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate && socket.current) {
                    socket.current.emit('iceCandidate', {
                        callId: callId.current,
                        candidate: event.candidate,
                        to: call.isReceivingCall ? call.from : call.userToCall
                    });
                }
            };

            // Handle connection state changes
            peerConnection.current.onconnectionstatechange = () => {
                setConnectionState(peerConnection.current.connectionState);
                if (peerConnection.current.connectionState === 'connected') {
                    setCallStartTime(Date.now());
                    startCallTimer();
                }
            };
        };

        initializePeerConnection();
    }, [call, stream]);

    // Socket event handlers
    useEffect(() => {
        if (!socket.current) return;

        const handleCallAccepted = async (data) => {
            setCallAccepted(true);
            setConnectionState('connecting');
            
            if (peerConnection.current && data.answer) {
                try {
                    await peerConnection.current.setRemoteDescription(data.answer);
                } catch (err) {
                    console.error('Error setting remote description:', err);
                }
            }
        };

        const handleCallRejected = () => {
            endCall();
        };

        const handleCallEnded = () => {
            endCall();
        };

        const handleOffer = async (data) => {
            if (peerConnection.current && data.offer) {
                try {
                    await peerConnection.current.setRemoteDescription(data.offer);
                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    
                    socket.current.emit('answer', {
                        callId: data.callId,
                        answer,
                        to: call.from
                    });
                } catch (err) {
                    console.error('Error handling offer:', err);
                }
            }
        };

        const handleAnswer = async (data) => {
            if (peerConnection.current && data.answer) {
                try {
                    await peerConnection.current.setRemoteDescription(data.answer);
                } catch (err) {
                    console.error('Error handling answer:', err);
                }
            }
        };

        const handleIceCandidate = async (data) => {
            if (peerConnection.current && data.candidate) {
                try {
                    await peerConnection.current.addIceCandidate(data.candidate);
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        };

        socket.current.on('callAccepted', handleCallAccepted);
        socket.current.on('callRejected', handleCallRejected);
        socket.current.on('callEnded', handleCallEnded);
        socket.current.on('offer', handleOffer);
        socket.current.on('answer', handleAnswer);
        socket.current.on('iceCandidate', handleIceCandidate);

        return () => {
            socket.current.off('callAccepted', handleCallAccepted);
            socket.current.off('callRejected', handleCallRejected);
            socket.current.off('callEnded', handleCallEnded);
            socket.current.off('offer', handleOffer);
            socket.current.off('answer', handleAnswer);
            socket.current.off('iceCandidate', handleIceCandidate);
        };
    }, [call]);

    const startCallTimer = () => {
        callTimer.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const makeCall = async () => {
        if (!peerConnection.current) return;
        
        try {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            
            socket.current.emit('callUser', {
                userToCall: call.userToCall,
                signalData: offer,
                from: currentUser._id,
                name: currentUser.username,
                type: call.type,
                callId: callId.current
            });
        } catch (err) {
            console.error('Error making call:', err);
        }
    };

    const answerCall = async () => {
        setCallAccepted(true);
        setIsReceivingCall(false);
        
        if (peerConnection.current && call.signal) {
            try {
                await peerConnection.current.setRemoteDescription(call.signal);
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                
                socket.current.emit('answerCall', {
                    answer,
                    to: call.from,
                    callId: call.callId
                });
            } catch (err) {
                console.error('Error answering call:', err);
            }
        }
    };

    const rejectCall = () => {
        socket.current.emit('rejectCall', {
            callId: call.callId,
            to: call.from
        });
        endCall();
    };

    const endCall = () => {
        if (callTimer.current) {
            clearInterval(callTimer.current);
        }

        if (socket.current && call) {
            socket.current.emit('endCall', {
                callId: callId.current,
                to: call.isReceivingCall ? call.from : call.userToCall
            });
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (peerConnection.current) {
            peerConnection.current.close();
        }

        setCallEnded(true);
        setCall(null);
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
                
                // Notify the other user
                socket.current.emit('toggleAudio', {
                    to: call.isReceivingCall ? call.from : call.userToCall,
                    isAudioEnabled: audioTrack.enabled
                });
            }
        }
    };

    const toggleVideo = () => {
        if (stream && call.type === 'video') {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
                
                // Notify the other user
                socket.current.emit('toggleVideo', {
                    to: call.isReceivingCall ? call.from : call.userToCall,
                    isVideoEnabled: videoTrack.enabled
                });
            }
        }
    };

    // Auto-start call for outgoing calls
    useEffect(() => {
        if (call && !call.isReceivingCall && stream && peerConnection.current && !callAccepted) {
            makeCall();
        }
    }, [call, stream]);

    if (!call) return null;

    return (
        <div className="callContainer">
            <div className="callOverlay">
                <div className="callModal">
                    {/* Call Header */}
                    <div className="callHeader">
                        <div className="callUserInfo">
                            <img 
                                src={getProfileImageUrl(receiver?.profilePicture)}
                                alt={receiver?.username || 'User'}
                                className="callAvatar"
                            />
                            <div className="callUserDetails">
                                <h3 className="callUsername">{receiver?.username || 'User'}</h3>
                                <span className="callStatus">
                                    {callAccepted ? (
                                        connectionState === 'connected' ? (
                                            <span className="callTime">{formatDuration(callDuration)}</span>
                                        ) : (
                                            'Connecting...'
                                        )
                                    ) : call.isReceivingCall ? (
                                        `Incoming ${call.type} call`
                                    ) : (
                                        'Calling...'
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="callType">
                            {call.type === 'video' ? (
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Video Container */}
                    {call.type === 'video' && (
                        <div className="videoContainer">
                            <div className="remoteVideoWrapper">
                                <video 
                                    ref={userVideo}
                                    autoPlay
                                    playsInline
                                    className="remoteVideo"
                                />
                                {!remoteStream && (
                                    <div className="videoPlaceholder">
                                        <img 
                                            src={getProfileImageUrl(receiver?.profilePicture)}
                                            alt={receiver?.username || 'User'}
                                            className="videoPlaceholderAvatar"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            <div className="localVideoWrapper">
                                <video 
                                    ref={myVideo}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`localVideo ${!isVideoEnabled ? 'videoDisabled' : ''}`}
                                />
                                {!isVideoEnabled && (
                                    <div className="videoDisabledOverlay">
                                        <img 
                                            src={getProfileImageUrl(currentUser?.profilePicture)}
                                            alt={currentUser?.username || 'You'}
                                            className="videoDisabledAvatar"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Audio Call UI */}
                    {call.type === 'audio' && (
                        <div className="audioCallContainer">
                            <div className="audioCallAvatar">
                                <img 
                                    src={getProfileImageUrl(receiver?.profilePicture)}
                                    alt={receiver?.username || 'User'}
                                    className="audioAvatar"
                                />
                                <div className="audioWaveform">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Call Controls */}
                    <div className="callControls">
                        {call.isReceivingCall && !callAccepted ? (
                            <div className="incomingCallControls">
                                <button className="callButton decline" onClick={rejectCall}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                </button>
                                <button className="callButton accept" onClick={answerCall}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="activeCallControls">
                                <button 
                                    className={`callButton ${isAudioEnabled ? 'audio' : 'audioMuted'}`}
                                    onClick={toggleAudio}
                                >
                                    {isAudioEnabled ? (
                                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L13 7.414V8a3 3 0 11-6 0v-.586l-1.293 1.293a1 1 0 01-1.414-1.414l2-2a1 1 0 011.414 0L8 5.707V4a3 3 0 116 0v1.293zM11 14.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                
                                {call.type === 'video' && (
                                    <button 
                                        className={`callButton ${isVideoEnabled ? 'video' : 'videoMuted'}`}
                                        onClick={toggleVideo}
                                    >
                                        {isVideoEnabled ? (
                                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894L15 7.382V6a2 2 0 00-2-2H9.382l-1.5-1.5H4a2 2 0 00-2 2v8c0 .398.158.78.44 1.06l-1.147 1.147z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                )}
                                
                                <button className="callButton endCall" onClick={endCall}>
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallV2;