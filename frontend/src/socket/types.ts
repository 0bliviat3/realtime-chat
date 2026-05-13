import { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  roomId: string;
}

export interface User {
  id: string;
  username: string;
  roomId: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  createdAt: Date;
}

export interface SocketEvents {
  // Chat events
  'chat:send': (data: { message: string; roomId: string }) => void;
  'chat:receive': (data: ChatMessage) => void;
  
  // Room events
  'room:join': (data: { username: string; roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  
  // User events
  'user:typing': (data: { username: string; isTyping: boolean }) => void;
  
  // System events
  'system:message': (data: { message: string; timestamp: Date }) => void;
  
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
}