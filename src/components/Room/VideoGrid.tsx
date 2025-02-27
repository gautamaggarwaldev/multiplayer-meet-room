import React, { useEffect, useRef } from 'react';
import { useCallStore } from '../../store/callStore';

const VideoGrid: React.FC = () => {
  const { localStream, remoteStreams } = useCallStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Count total videos (local + remote)
  const totalVideos = 1 + Object.keys(remoteStreams).length;
  
  // Determine grid layout class based on number of videos
  const getGridClass = () => {
    switch (totalVideos) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2 md:grid-cols-3';
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-2 p-2 h-full`}>
      {/* Local video */}
      <div className="relative bg-black rounded overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
          You
        </div>
      </div>
      
      {/* Remote videos */}
      {Object.entries(remoteStreams).map(([userId, stream]) => {
        if (!stream) return null;
        
        return (
          <RemoteVideo key={userId} userId={userId} stream={stream} />
        );
      })}
    </div>
  );
};

interface RemoteVideoProps {
  userId: string;
  stream: MediaStream;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ userId, stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return (
    <div className="relative bg-black rounded overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
        Participant
      </div>
    </div>
  );
};

export default VideoGrid;