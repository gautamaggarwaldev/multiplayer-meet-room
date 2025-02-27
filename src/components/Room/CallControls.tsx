import React from 'react';
import { useCallStore } from '../../store/callStore';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor, 
  PhoneOff 
} from 'lucide-react';

const CallControls: React.FC = () => {
  const { 
    isMuted, 
    isCameraOff, 
    isScreenSharing, 
    callType,
    toggleMute, 
    toggleCamera, 
    toggleScreenShare, 
    endCall 
  } = useCallStore();

  return (
    <div className="flex justify-center items-center space-x-4">
      <button
        onClick={toggleMute}
        className={`p-3 rounded-full ${
          isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      
      {callType === 'video' && (
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${
            isCameraOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>
      )}
      
      {callType === 'video' && (
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${
            isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor size={20} />
        </button>
      )}
      
      <button
        onClick={endCall}
        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
        title="End call"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
};

export default CallControls;