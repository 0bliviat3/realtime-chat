import { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  roomId: string;
}

export interface User {
  id: string;
  username: string;
  roomId: string;
  joinedAt: string;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  createdAt: string;
}

export interface SocketEvents {
  // Chat events
  'chat:send': (data: { message: string; roomId: string }) => void;
  'chat:receive': (data: ChatMessage) => void;
  
  // Room events
  'room:join': (data: { username: string; roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:history': (data: { roomId: string }) => void; // New event
  
  // User events
  'user:list': (data: User[]) => void;
  'user:join': (data: { user: User; timestamp: string }) => void;
  'user:leave': (data: { user: User; timestamp: string }) => void;
  'user:typing': (data: { username: string; isTyping: boolean }) => void;
  
  // System events
  'system:message': (data: { message: string; timestamp: string }) => void;
  
  // Message events
  'message:history': (data: ChatMessage[]) => void; // New event
  
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
}