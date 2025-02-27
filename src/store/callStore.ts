import { create } from 'zustand';
import { CallState, CallType } from '../types';
import { useSocketStore } from './socketStore';
import { useRoomStore } from './roomStore';

interface CallStore extends CallState {
  startCall: (userId: string, callType: CallType) => void;
  answerCall: (userId: string, accept: boolean) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
}

// Configuration for WebRTC
const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useCallStore = create<CallStore>((set, get) => {
  // Store peer connections
  const peerConnections: Record<string, RTCPeerConnection> = {};

  return {
    isInCall: false,
    callType: null,
    remoteStreams: {},
    localStream: null,
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    error: null,

    startCall: async (userId: string, callType: CallType) => {
      try {
        const { socket } = useSocketStore.getState();
        const { currentRoom } = useRoomStore.getState();
        
        if (!socket || !currentRoom) {
          throw new Error('Socket connection or room required');
        }

        // Request media stream
        const constraints = {
          audio: true,
          video: callType === 'video',
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Create peer connection
        const peerConnection = new RTCPeerConnection(peerConnectionConfig);
        peerConnections[userId] = peerConnection;
        
        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', {
              userId,
              signal: {
                type: 'ice-candidate',
                candidate: event.candidate,
              },
            });
          }
        };
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
          set((state) => ({
            remoteStreams: {
              ...state.remoteStreams,
              [userId]: event.streams[0],
            },
          }));
        };
        
        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('signal', {
          userId,
          signal: {
            type: 'offer',
            sdp: peerConnection.localDescription,
          },
        });
        
        // Send call request
        socket.emit('call-user', {
          roomId: currentRoom.id,
          userId,
          callType,
        });
        
        set({
          isInCall: true,
          callType,
          localStream: stream,
          error: null,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to start call',
        });
      }
    },

    answerCall: async (userId: string, accept: boolean) => {
      try {
        const { socket } = useSocketStore.getState();
        
        if (!socket) {
          throw new Error('Socket connection required');
        }
        
        // Send response
        socket.emit('call-response', {
          userId,
          accepted: accept,
        });
        
        if (!accept) return;
        
        const { callType } = get();
        
        // Request media stream
        const constraints = {
          audio: true,
          video: callType === 'video',
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Create peer connection
        const peerConnection = new RTCPeerConnection(peerConnectionConfig);
        peerConnections[userId] = peerConnection;
        
        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', {
              userId,
              signal: {
                type: 'ice-candidate',
                candidate: event.candidate,
              },
            });
          }
        };
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
          set((state) => ({
            remoteStreams: {
              ...state.remoteStreams,
              [userId]: event.streams[0],
            },
          }));
        };
        
        set({
          isInCall: true,
          localStream: stream,
          error: null,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to answer call',
        });
      }
    },

    endCall: () => {
      const { localStream, remoteStreams } = get();
      
      // Stop local stream tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Close peer connections
      Object.values(peerConnections).forEach(pc => pc.close());
      
      set({
        isInCall: false,
        callType: null,
        localStream: null,
        remoteStreams: {},
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
      });
    },

    toggleMute: () => {
      const { localStream, isMuted } = get();
      
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = isMuted;
        });
        
        set({ isMuted: !isMuted });
      }
    },

    toggleCamera: () => {
      const { localStream, isCameraOff } = get();
      
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = isCameraOff;
        });
        
        set({ isCameraOff: !isCameraOff });
      }
    },

    toggleScreenShare: async () => {
      try {
        const { localStream, isScreenSharing } = get();
        
        if (isScreenSharing) {
          // Switch back to camera
          const constraints = {
            audio: true,
            video: true,
          };
          
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
          }
          
          // Replace tracks in peer connections
          Object.values(peerConnections).forEach(pc => {
            const senders = pc.getSenders();
            newStream.getTracks().forEach(track => {
              const sender = senders.find(s => s.track?.kind === track.kind);
              if (sender) {
                sender.replaceTrack(track);
              }
            });
          });
          
          set({
            localStream: newStream,
            isScreenSharing: false,
          });
        } else {
          // Switch to screen sharing
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });
          
          // Keep audio from current stream
          if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
              screenStream.addTrack(audioTrack);
            }
            
            // Stop video tracks
            localStream.getVideoTracks().forEach(track => track.stop());
          }
          
          // Replace tracks in peer connections
          Object.values(peerConnections).forEach(pc => {
            const senders = pc.getSenders();
            screenStream.getTracks().forEach(track => {
              const sender = senders.find(s => s.track?.kind === track.kind);
              if (sender) {
                sender.replaceTrack(track);
              }
            });
          });
          
          set({
            localStream: screenStream,
            isScreenSharing: true,
          });
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to toggle screen sharing',
        });
      }
    },
  };
});

// Setup WebRTC signal listeners
export const setupCallListeners = () => {
  const { socket } = useSocketStore.getState();
  const callStore = useCallStore.getState();
  
  if (!socket) return;

  // Handle incoming signals
  socket.on('signal', async ({ userId, signal }) => {
    try {
      const { peerConnections } = useCallStore.getState() as any;
      let peerConnection = peerConnections[userId];
      
      if (!peerConnection) {
        // Create new peer connection if it doesn't exist
        peerConnection = new RTCPeerConnection(peerConnectionConfig);
        peerConnections[userId] = peerConnection;
        
        // Add local stream tracks
        const { localStream } = callStore;
        if (localStream) {
          localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
          });
        }
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', {
              userId,
              signal: {
                type: 'ice-candidate',
                candidate: event.candidate,
              },
            });
          }
        };
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
          useCallStore.setState((state) => ({
            remoteStreams: {
              ...state.remoteStreams,
              [userId]: event.streams[0],
            },
          }));
        };
      }
      
      // Handle different signal types
      if (signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        socket.emit('signal', {
          userId,
          signal: {
            type: 'answer',
            sdp: peerConnection.localDescription,
          },
        });
      } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'ice-candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (error) {
      useCallStore.setState({
        error: error instanceof Error ? error.message : 'WebRTC signaling error',
      });
    }
  });

  // Handle call requests
  socket.on('call-request', ({ callerId, callerName, callType }) => {
    // Show UI for incoming call
    // This would typically trigger a UI component to show
    useCallStore.setState({
      callType: callType,
    });
  });

  // Handle call responses
  socket.on('call-response', ({ userId, accepted }) => {
    if (!accepted) {
      // Handle rejected call
      useCallStore.setState((state) => ({
        remoteStreams: {
          ...state.remoteStreams,
          [userId]: undefined,
        },
      }));
    }
  });
};