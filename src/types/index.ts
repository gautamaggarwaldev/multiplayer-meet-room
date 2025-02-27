// User types
export interface User {
  id: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Room types
export interface Participant {
  id: string;
  username: string;
  socketId: string;
}

export interface Room {
  id: string;
  createdBy: string;
  participants: Record<string, Participant>;
  createdAt: string;
}

export interface RoomState {
  currentRoom: Room | null;
  isJoining: boolean;
  error: string | null;
}

// Message types
export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
  };
  timestamp: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// Call types
export type CallType = 'audio' | 'video';

export interface CallState {
  isInCall: boolean;
  callType: CallType | null;
  remoteStreams: Record<string, MediaStream>;
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  error: string | null;
}

// Socket types
export interface SocketState {
  isConnected: boolean;
  error: string | null;
}