import { create } from 'zustand';
import { Room, RoomState } from '../types';
import { useSocketStore } from './socketStore';
import { useAuthStore } from './authStore';

interface RoomStore extends RoomState {
  createRoom: () => Promise<string | null>;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

const API_URL = 'http://localhost:3001/api';

export const useRoomStore = create<RoomStore>((set, get) => ({
  currentRoom: null,
  isJoining: false,
  error: null,

  createRoom: async () => {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      set({ error: 'Authentication required' });
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const data = await response.json();
      return data.roomId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create room' 
      });
      return null;
    }
  },

  joinRoom: (roomId: string) => {
    const { socket } = useSocketStore.getState();
    
    if (!socket) {
      set({ error: 'Socket connection required' });
      return;
    }

    set({ isJoining: true, error: null });

    socket.emit('join-room', { roomId });

    socket.on('room-joined', ({ room }) => {
      set({ currentRoom: room as Room, isJoining: false });
    });

    socket.on('participants-updated', (participants) => {
      set((state) => ({
        currentRoom: state.currentRoom 
          ? { ...state.currentRoom, participants } 
          : null
      }));
    });

    socket.on('error', ({ message }) => {
      set({ error: message, isJoining: false });
    });
  },

  leaveRoom: () => {
    const { socket } = useSocketStore.getState();
    const { currentRoom } = get();
    
    if (socket && currentRoom) {
      socket.emit('leave-room', { roomId: currentRoom.id });
      set({ currentRoom: null });
    }
  },
}));