import React from 'react';
import { useRoomStore } from '../../store/roomStore';
import { useCallStore } from '../../store/callStore';
import { User, Phone, Video } from 'lucide-react';

const ParticipantsList: React.FC = () => {
  const { currentRoom } = useRoomStore();
  const { startCall, isInCall } = useCallStore();
  
  const participants = currentRoom?.participants || {};

  const handleStartCall = (userId: string, callType: 'audio' | 'video') => {
    startCall(userId, callType);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Participants</h2>
        <p className="text-sm text-gray-500">
          {Object.keys(participants).length} online
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200">
          {Object.values(participants).map((participant) => (
            <li key={participant.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-500 p-2 rounded-full mr-3">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{participant.username}</p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
                
                {!isInCall && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartCall(participant.id, 'audio')}
                      className="text-gray-500 hover:text-green-500 p-1"
                      title="Start audio call"
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      onClick={() => handleStartCall(participant.id, 'video')}
                      className="text-gray-500 hover:text-blue-500 p-1"
                      title="Start video call"
                    >
                      <Video size={18} />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ParticipantsList;