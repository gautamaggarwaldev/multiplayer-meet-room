import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { SocketState } from '../types';
import { useAuthStore } from './authStore';

interface SocketStore extends SocketState {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

const SOCKET_URL = 'http://localhost:3001';

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  error: null,

  connect: () => {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      set({ error: 'Authentication required' });
      return;
    }

    try {
      const socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        set({ isConnected: true, error: null });
      });

      socket.on('connect_error', (err) => {
        set({ isConnected: false, error: err.message });
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
      });

      set({ socket });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnected: false 
      });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));