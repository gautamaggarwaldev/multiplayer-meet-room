import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { MessageCircle, Plus, LogOut } from 'lucide-react';

const RoomList: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const { createRoom } = useRoomStore();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    const newRoomId = await createRoom();
    if (newRoomId) {
      navigate(`/room/${newRoomId}`);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <MessageCircle size={28} className="text-blue-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">WebRTC Chat App</h1>
          </div>
          
          <div className="flex items-center">
            <span className="mr-4 text-gray-600">
              Welcome, {user?.username}
            </span>
            <button
              onClick={logout}
              className="flex items-center text-gray-600 hover:text-red-500"
            >
              <LogOut size={18} className="mr-1" />
              Logout
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Join room */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
            <form onSubmit={handleJoinRoom}>
              <div className="mb-4">
                <label htmlFor="roomId" className="block text-gray-700 mb-2">
                  Enter Room ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
              >
                Join Room
              </button>
            </form>
          </div>
          
          {/* Create room */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>
            <p className="text-gray-600 mb-4">
              Create a new room and invite others to join using the room ID.
            </p>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Create New Room
            </button>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <ol className="list-decimal list-inside space-y-4 text-gray-700">
              <li>
                <span className="font-medium">Create a room</span> - Generate a unique room ID that you can share with others
              </li>
              <li>
                <span className="font-medium">Share the room ID</span> - Send the room ID to people you want to chat with
              </li>
              <li>
                <span className="font-medium">Join the room</span> - Others can use the room ID to join your room
              </li>
              <li>
                <span className="font-medium">Start chatting</span> - Send text messages, make audio calls, or start video calls
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomList;