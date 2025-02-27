import { create } from 'zustand';
import { ChatState, Message } from '../types';
import { useSocketStore } from './socketStore';
import { useRoomStore } from './roomStore';

interface ChatStore extends ChatState {
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  sendMessage: (content: string) => {
    const { socket } = useSocketStore.getState();
    const { currentRoom } = useRoomStore.getState();
    
    if (!socket || !currentRoom) {
      set({ error: 'Socket connection or room required' });
      return;
    }

    socket.emit('send-message', {
      roomId: currentRoom.id,
      content,
    });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));

// Setup message listeners
export const setupChatListeners = () => {
  const { socket } = useSocketStore.getState();
  
  if (!socket) return;

  socket.on('room-joined', ({ messages }) => {
    useChatStore.setState({ messages: messages || [] });
  });

  socket.on('new-message', (message: Message) => {
    useChatStore.setState((state) => ({
      messages: [...state.messages, message],
    }));
  });
};