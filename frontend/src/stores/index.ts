import { io } from 'socket.io-client';

// Connect to backend socket server
export const socket = io('http://localhost:3000');

// Define socket event types
export type SocketEvents = {
  'chat:send': (data: { message: string; roomId: string }) => void;
  'chat:receive': (data: { message: string; username: string; roomId: string; timestamp: Date }) => void;
  'room:join': (data: { username: string; roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'user:typing': (data: { username: string; isTyping: boolean; roomId: string }) => void;
  'system:message': (data: { message: string; timestamp: Date }) => void;
  'room:members': (data: { users: Array<{ id: string; username: string }> }) => void;
};