import { useEffect, useRef, useState } from 'react';
import './call.css';
import { getProfileImageUrl } from '../../utils/imageUtils';

const Call = ({ call, setCall, socket, currentUser, receiver }) => {
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(call?.type === 'video');
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isReceivingCall, setIsReceivingCall] = useState(false);
    
    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const callInitiatedRef = useRef(false);

    useEffect(() => {
        if (call?.type === 'video') {
            setIsVideoEnabled(true);
        } else {
            setIsVideoEnabled(false);
        }
    }, [call]);

    useEffect(() => {
        if (!call) {
            callInitiatedRef.current = false;
            setIsReceivingCall(false);
            return;
        }

        setIsReceivingCall(Boolean(call.isReceivingCall));
    }, [call]);

    useEffect(() => {
        const getMedia = async () => {
            try {
                const constraints = {
                    video: call?.type === 'video',
                    audio: true
                };
                
                console.log('Requesting media with constraints:', constraints);
                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('Media stream obtained:', mediaStream);
                setStream(mediaStream);
                
                // Set video source for both audio and video calls (audio calls might need it for UI)
                if (myVideo.current) {
                    myVideo.current.srcObject = mediaStream;
                    // For audio calls, we still set the stream but won't display video
                }
            } catch (err) {
                console.error('Error accessing media devices:', err);
                const errorMessage = err.name === 'NotAllowedError' 
                    ? 'Camera/microphone access denied. Please allow access and try again.'
                    : err.name === 'NotFoundError'
                    ? 'No camera/microphone found. Please connect a device.'
                    : 'Unable to access camera/microphone. Please check permissions.';
                alert(errorMessage);
                setCall(null);
            }
        };

        // Get media for outgoing calls (not receiving)
        if (call && !call.isReceivingCall && !stream) {
            getMedia();
        }
    }, [call, stream]);

    useEffect(() => {
        if (!socket) return;

        const handleCallUser = (data) => {
            console.log('Received call from:', data.from, 'Type:', data.type);
            callInitiatedRef.current = false;
            setIsReceivingCall(true);
            setCall(prev => ({
                ...prev,
                ...data,
                isReceivingCall: true,
                type: data.type || 'audio',
                userToCall: null // Not applicable for incoming calls
            }));
        };

        const handleCallAccepted = async (data) => {
            console.log('Call accepted, received answer:', data);
            if (!connectionRef.current) {
                console.error('No peer connection when call accepted');
                return;
            }

            const remoteAnswer = data?.answer || data?.signal;
            if (remoteAnswer) {
                try {
                    console.log('Setting remote description with answer');
                    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
                    console.log('Remote description set successfully');
                    setCallAccepted(true);
                } catch (err) {
                    console.error('Error setting remote description:', err);
                    alert('Error establishing connection: ' + err.message);
                }
            } else {
                console.error('No answer received in callAccepted event');
            }
        };

        const handleCallEnded = () => {
            console.log('Call ended event received');
            setCallEnded(true);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            callInitiatedRef.current = false;
            setTimeout(() => {
                setCall(null);
                setCallAccepted(false);
                setCallEnded(false);
                setStream(null);
                setIsReceivingCall(false);
            }, 1000);
        };

        const handleIceCandidate = async (data) => {
            if (connectionRef.current && data.candidate) {
                try {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                    console.log('ICE candidate added successfully');
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        };

        socket.on('callUser', handleCallUser);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callEnded', handleCallEnded);
        socket.on('iceCandidate', handleIceCandidate);

        return () => {
            socket.off('callUser', handleCallUser);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
            socket.off('iceCandidate', handleIceCandidate);
        };
    }, [socket, stream]);

    const answerCall = async () => {
        try {
            // First get media stream
            console.log('Answering call, getting media...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: call?.type === 'video',
                audio: true
            });
            console.log('Media obtained for answer:', mediaStream);
            setStream(mediaStream);
            
            if (myVideo.current) {
                myVideo.current.srcObject = mediaStream;
            }

            // Create peer connection
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });

            connectionRef.current = peerConnection;

            // Add local stream tracks
            mediaStream.getTracks().forEach(track => {
                console.log('Adding track to peer connection:', track.kind);
                peerConnection.addTrack(track, mediaStream);
            });

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    console.log('Sending ICE candidate:', event.candidate);
                    socket.emit('iceCandidate', {
                        candidate: event.candidate,
                        to: call.from
                    });
                } else if (!event.candidate) {
                    console.log('All ICE candidates sent');
                }
            };

            // Handle remote stream
            peerConnection.ontrack = (event) => {
                console.log('Received remote track:', event);
                if (event.streams && event.streams[0]) {
                    const remoteStream = event.streams[0];
                    console.log('Setting remote stream to userVideo');
                    if (userVideo.current) {
                        userVideo.current.srcObject = remoteStream;
                    }
                    // For audio calls, we still receive the stream but won't display video
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log('Connection state changed:', peerConnection.connectionState);
                if (peerConnection.connectionState === 'connected') {
                    console.log('Peer connection established!');
                    setCallAccepted(true);
                } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
                    console.error('Peer connection failed or disconnected');
                    if (peerConnection.connectionState === 'failed') {
                        alert('Connection failed. Please try again.');
                    }
                }
            };

            // Set remote description and create answer
            const offer = call.offer || call.signal;
            if (offer) {
                console.log('Setting remote description with offer');
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                
                console.log('Creating answer');
                const answer = await peerConnection.createAnswer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: call.type === 'video'
                });
                
                console.log('Setting local description');
                await peerConnection.setLocalDescription(answer);

                if (socket) {
                    console.log('Sending call answer to:', call.from);
                    socket.emit('answerCall', {
                        answer,
                        to: call.from
                    });
                }
                
                // Set accepted state after sending answer
                setCallAccepted(true);
            } else {
                console.error('No offer received in call');
                alert('Call error: No offer received');
                setCall(null);
            }
        } catch (err) {
            console.error('Error answering call:', err);
            alert('Error answering call: ' + (err.message || 'Please try again.'));
            setCall(null);
        }
    };

    const startOutgoingCall = async (localStream) => {
        try {
            if (!socket || !call?.userToCall || !localStream) {
                console.error('Missing required data for call:', { socket: !!socket, userToCall: call?.userToCall, stream: !!localStream });
                return;
            }

            if (myVideo.current && myVideo.current.srcObject !== localStream) {
                myVideo.current.srcObject = localStream;
            }

            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });

            connectionRef.current = peerConnection;

            // Add local stream tracks
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    socket.emit('iceCandidate', {
                        candidate: event.candidate,
                        to: call.userToCall
                    });
                }
            };

            // Handle remote stream
            peerConnection.ontrack = (event) => {
                console.log('Received remote track:', event);
                if (event.streams && event.streams[0]) {
                    if (userVideo.current) {
                        userVideo.current.srcObject = event.streams[0];
                    }
                }
            };

            // Handle connection state changes
            peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', peerConnection.connectionState);
                if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
                    console.error('Peer connection failed or disconnected');
                }
            };

            // Create and send offer
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: call.type === 'video'
            });
            await peerConnection.setLocalDescription(offer);

            console.log('Sending call offer to:', call.userToCall);
            socket.emit('callUser', {
                userToCall: call.userToCall,
                signalData: offer,
                from: currentUser._id,
                name: currentUser.username,
                type: call.type,
                conversationId: call.conversationId
            });
        } catch (err) {
            console.error('Error making call:', err);
            alert('Error making call. Please check permissions.');
            callInitiatedRef.current = false;
            setCall(null);
        }
    };

    useEffect(() => {
        // Only start outgoing call if:
        // 1. Call exists
        // 2. Not receiving call (we're the caller)
        // 3. Call not yet accepted
        // 4. Socket and stream are ready
        // 5. Call hasn't been initiated yet
        if (!call || call.isReceivingCall || callAccepted) return;
        if (!socket || !stream) {
            console.log('Waiting for socket or stream:', { socket: !!socket, stream: !!stream });
            return;
        }
        if (callInitiatedRef.current) {
            console.log('Call already initiated');
            return;
        }

        console.log('Starting outgoing call...');
        callInitiatedRef.current = true;
        // Small delay to ensure stream is ready
        setTimeout(() => {
            startOutgoingCall(stream);
        }, 200);
    }, [call, socket, stream, callAccepted]);

    const endCall = () => {
        setCallEnded(true);
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        if (connectionRef.current) {
            connectionRef.current.close();
        }
        
        if (socket) {
            socket.emit('endCall', { to: call?.userToCall || call?.from });
        }
 
        callInitiatedRef.current = false;

        setTimeout(() => {
            setCall(null);
            setCallAccepted(false);
            setCallEnded(false);
            setStream(null);
            setIsReceivingCall(false);
        }, 1000);
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    };

    if (!call) return null;

    return (
        <div className="callContainer">
            <div className="callBox">
                {call.type === 'video' && callAccepted && !callEnded ? (
                    <div className="videoContainer">
                        <div className="videoGrid">
                            <div className="videoWrapper">
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className="video"
                                />
                                <div className="videoLabel">You</div>
                            </div>
                            {callAccepted && (
                                <div className="videoWrapper">
                                    <video
                                        playsInline
                                        ref={userVideo}
                                        autoPlay
                                        className="video"
                                    />
                                    <div className="videoLabel">{receiver?.username || 'User'}</div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : call.type === 'audio' && callAccepted && !callEnded ? (
                    <div className="audioCallContainer">
                        <div className="callInfo">
                            <img
                                src={getProfileImageUrl(receiver?.profilePicture)}
                                alt={receiver?.username || 'User'}
                                className="callAvatar"
                            />
                            <h3 className="callName">{receiver?.username || 'User'}</h3>
                            <p className="callStatus">Audio Call Connected</p>
                            {/* Hidden video elements for audio stream handling */}
                            <video
                                ref={myVideo}
                                autoPlay
                                muted
                                playsInline
                                style={{ display: 'none' }}
                            />
                            <video
                                ref={userVideo}
                                autoPlay
                                playsInline
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="callInfo">
                        <img
                            src={getProfileImageUrl(receiver?.profilePicture)}
                            alt={receiver?.username || 'User'}
                            className="callAvatar"
                        />
                        <h3 className="callName">{receiver?.username || 'User'}</h3>
                        <p className="callStatus">
                            {callEnded
                                ? 'Call Ended'
                                : callAccepted
                                ? call.type === 'video'
                                    ? 'Video Call Connected'
                                    : 'Audio Call Connected'
                                : call.isReceivingCall
                                ? `Incoming ${call.type === 'video' ? 'Video' : 'Audio'} Call`
                                : `Calling...`}
                        </p>
                    </div>
                )}

                <div className="callControls">
                    {!callAccepted && call.isReceivingCall && (
                        <>
                            <button className="callButton accept" onClick={answerCall}>
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            </button>
                            <button className="callButton reject" onClick={endCall}>
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </>
                    )}

                    {callAccepted && !callEnded && (
                        <>
                            {call.type === 'video' && (
                                <button
                                    className={`callButton ${isVideoEnabled ? 'active' : 'muted'}`}
                                    onClick={toggleVideo}
                                    title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
                                >
                                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                        {isVideoEnabled ? (
                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        ) : (
                                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 01-1.343 4.472l-1.703-1.703A6 6 0 0016 10c0-3.314-2.686-6-6-6a5.94 5.94 0 00-2.769.69l-1.703-1.703A8 8 0 0118 10zM2 10a8 8 0 011.343-4.472l1.703 1.703A6 6 0 004 10c0 3.314 2.686 6 6 6a5.94 5.94 0 002.769-.69l1.703 1.703A8 8 0 012 10z" clipRule="evenodd" />
                                        )}
                                    </svg>
                                </button>
                            )}
                            <button
                                className={`callButton ${isAudioEnabled ? 'active' : 'muted'}`}
                                onClick={toggleAudio}
                                title={isAudioEnabled ? 'Mute' : 'Unmute'}
                            >
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                    {isAudioEnabled ? (
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.797-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                    ) : (
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.797-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415zM6.343 13.414l8.071-8.071a1 1 0 011.415 1.415l-8.071 8.07a1 1 0 01-1.415-1.414z" clipRule="evenodd" />
                                    )}
                                </svg>
                            </button>
                            <button className="callButton end" onClick={endCall}>
                                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            </button>
                        </>
                    )}

                    {!call.isReceivingCall && !callAccepted && (
                        <button className="callButton reject" onClick={endCall}>
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Call;

