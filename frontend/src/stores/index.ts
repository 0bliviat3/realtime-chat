import { io } from 'socket.io-client';

// Connect to backend socket server
export const socket = io('http://localhost:3000');

// Define socket event types
export type SocketEvents = {
  'chat:send': (data: { message: string; roomId: string }) => void;
  'chat:receive': (data: { message: string; username: string; roomId: string; timestamp: string }) => void;
  'room:join': (data: { username: string; roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'user:typing': (data: { username: string; isTyping: boolean; roomId: string }) => void;
  'system:message': (data: { message: string; timestamp: string }) => void;
  'user:list': (data: { user: string; timestamp: string }) => void;
  'user:join': (data: { user: User; timestamp: string }) => void;
  'user:leave': (data: { user: User; timestamp: string }) => void;
  'connect': () => void;
  'disconnect': () => void;
};