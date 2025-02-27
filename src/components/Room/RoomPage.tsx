import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import { useRoomStore } from '../../store/roomStore';
import { useChatStore, setupChatListeners } from '../../store/chatStore';
import { useCallStore, setupCallListeners } from '../../store/callStore';
import ChatPanel from './ChatPanel';
import ParticipantsList from './ParticipantsList';
import CallControls from './CallControls';
import VideoGrid from './VideoGrid';
import { Copy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { isAuthenticated } = useAuthStore();
  const { connect, disconnect, socket, isConnected } = useSocketStore();
  const { joinRoom, leaveRoom, currentRoom, error: roomError } = useRoomStore();
  const { clearMessages } = useChatStore();
  const { isInCall, callType } = useCallStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthenticated && roomId) {
      connect();
    }

    return () => {
      leaveRoom();
      clearMessages();
      disconnect();
    };
  }, [isAuthenticated, roomId]);

  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
      setupChatListeners();
      setupCallListeners();
    }
  }, [isConnected, roomId]);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (!roomId) {
    return <Navigate to="/rooms" />;
  }

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/rooms" className="mr-4">
              <ArrowLeft className="text-gray-600 hover:text-gray-900" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-800">
              Room: {roomId}
            </h1>
          </div>
          <button
            onClick={copyRoomLink}
            className="flex items-center bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded"
          >
            <Copy size={16} className="mr-1" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-white shadow-md flex flex-col">
          <ParticipantsList />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video area */}
          <div className={`${isInCall ? 'flex-1' : 'h-0'} bg-gray-900 overflow-hidden`}>
            {isInCall && <VideoGrid />}
          </div>

          {/* Call controls */}
          {isInCall && (
            <div className="bg-gray-800 p-4">
              <CallControls />
            </div>
          )}

          {/* Chat area */}
          <div className={`${isInCall ? 'h-64 md:h-96' : 'flex-1'} overflow-hidden`}>
            <ChatPanel />
          </div>
        </div>
      </div>

      {/* Error message */}
      {roomError && (
        <div className="absolute bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
          <p>{roomError}</p>
        </div>
      )}
    </div>
  );
};

export default RoomPage;