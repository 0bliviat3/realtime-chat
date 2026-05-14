import { Server, Socket } from 'socket.io';
import { ChatMessage, User } from './types';
import { SOCKET_EVENTS } from './events';

// In-memory storage for users and rooms (in production, use a database)
const users: Map<string, User> = new Map();
const rooms: Map<string, User[]> = new Map();

export const setupSocketEvents = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining a room
    socket.on(SOCKET_EVENTS.ROOM_JOIN, (data: { username: string; roomId: string }) => {
      const { username, roomId } = data;
      
      // Store user info
      const user: User = {
        id: socket.id,
        username,
        roomId,
        joinedAt: new Date().toISOString()
      };
      
      users.set(socket.id, user);
      
      // Join the room
      socket.join(roomId);
      
      // Add user to room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
      }
      rooms.get(roomId)?.push(user);
      
      // Notify others in the room
      socket.to(roomId).emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
        message: `[System] ${username} joined`,
        timestamp: new Date().toISOString()
      });
      
      // Notify others in the room about user join
      socket.to(roomId).emit(SOCKET_EVENTS.USER_JOIN, {
        user: user,
        timestamp: new Date().toISOString()
      });
      
      // Send room members to the user
      const roomUsers = rooms.get(roomId) || [];
      socket.emit(SOCKET_EVENTS.USER_LIST, roomUsers);
      
      console.log(`${username} joined room ${roomId}`);
    });

    // Handle user leaving a room
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (data: { roomId: string }) => {
      const { roomId } = data;
      const user = users.get(socket.id);
      
      if (user) {
        // Remove user from room
        const roomUsers = rooms.get(roomId);
        if (roomUsers) {
          const userIndex = roomUsers.findIndex(u => u.id === socket.id);
          if (userIndex !== -1) {
            roomUsers.splice(userIndex, 1);
            
            // Notify others in the room
            socket.to(roomId).emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
              message: `[System] ${user.username} left`,
              timestamp: new Date().toISOString()
            });
            
            // Notify others in the room about user leave
            socket.to(roomId).emit(SOCKET_EVENTS.USER_LEAVE, {
              user: user,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Remove user from users map
        users.delete(socket.id);
      }
    });

    // Handle chat message sending
    socket.on(SOCKET_EVENTS.CHAT_SEND, (data: { message: string; roomId: string }) => {
      const { message, roomId } = data;
      const user = users.get(socket.id);
      
      if (user && message.trim()) {
        const chatMessage: ChatMessage = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          message,
          timestamp: new Date().toISOString(),
          roomId
        };
        
        // Broadcast to room
        io.to(roomId).emit(SOCKET_EVENTS.CHAT_RECEIVE, chatMessage);
      }
    });

    // Handle user typing
    socket.on(SOCKET_EVENTS.USER_TYPING, (data: { isTyping: boolean; roomId: string }) => {
      const { isTyping, roomId } = data;
      const user = users.get(socket.id);
      
      if (user) {
        socket.to(roomId).emit(SOCKET_EVENTS.USER_TYPING, {
          username: user.username,
          isTyping
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      
      if (user) {
        // Remove user from rooms
        const roomUsers = rooms.get(user.roomId);
        if (roomUsers) {
          const userIndex = roomUsers.findIndex(u => u.id === socket.id);
          if (userIndex !== -1) {
            roomUsers.splice(userIndex, 1);
            
            // Notify others in the room
            socket.to(user.roomId).emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
              message: `[System] ${user.username} left`,
              timestamp: new Date().toISOString()
            });
            
            // Notify others in the room about user leave
            socket.to(user.roomId).emit(SOCKET_EVENTS.USER_LEAVE, {
              user: user,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Clean up
        users.delete(socket.id);
        console.log(`User disconnected: ${user.username}`);
      }
    });
  });
};