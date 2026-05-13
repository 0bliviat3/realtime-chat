import { io, Socket } from 'socket.io-client';
import { SocketEvents } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const socket: Socket<SocketEvents> = io(SOCKET_URL, {
  transports: ['websocket', 'polling']
});