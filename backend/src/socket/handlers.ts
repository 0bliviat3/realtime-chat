import { Server, Socket } from 'socket.io';
import { ChatMessage, User } from './types';
import { SOCKET_EVENTS } from './events';
import { UserService, RoomService, MessageService } from '../services/chat.service';
import { pool } from '../db/db';

// Initialize services
const userService = new UserService();
const roomService = new RoomService();
const messageService = new MessageService();

export const setupSocketEvents = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining a room
    socket.on(SOCKET_EVENTS.ROOM_JOIN, async (data: { username: string; roomId: string }) => {
      const { username, roomId } = data;
      
      // Store user info
      const user: User = {
        id: socket.id,
        username,
        roomId,
        joinedAt: new Date().toISOString()
      };
      
      try {
        // Create or update user in DB
        await userService.createOrUpdate({
          id: user.id,
          nickname: user.username
        });
        
        // Check if room exists, if not create it
        const existingRoom = await roomService.findById(roomId);
        if (!existingRoom) {
          await roomService.create({
            id: roomId,
            name: roomId // Using room ID as name for simplicity
          });
        }
        
        // Join the room
        socket.join(roomId);
        
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
        // (Note: we don't need to send user list as we have DB persistence)
        
        console.log(`${username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error in room join:', error);
      }
    });

    // Handle user leaving a room
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (data: { roomId: string }) => {
      const { roomId } = data;
      // In memory for now - can be expanded later
      console.log(`User left room: ${roomId}`);
    });

    // Handle chat message sending
    socket.on(SOCKET_EVENTS.CHAT_SEND, async (data: { message: string; roomId: string }) => {
      const { message, roomId } = data;
      
      try {
        const user = await userService.findById(socket.id);
        
        if (user && message.trim()) {
          const chatMessage: ChatMessage = {
            id: Date.now().toString(),
            userId: user.id,
            username: user.nickname,
            message,
            timestamp: new Date().toISOString(),
            roomId
          };
          
          // Save message to DB
          const savedMessage = await messageService.create({
            id: chatMessage.id,
            room_id: chatMessage.roomId,
            user_id: chatMessage.userId,
            message: chatMessage.message
          });
          
          // Broadcast to room
          io.to(roomId).emit(SOCKET_EVENTS.CHAT_RECEIVE, savedMessage);
        }
      } catch (error) {
        console.error('Error sending chat message:', error);
      }
    });

    // Handle room history request
    socket.on(SOCKET_EVENTS.ROOM_HISTORY, async (data: { roomId: string }) => {
      const { roomId } = data;
      
      try {
        // Get recent messages for the room
        const messages = await messageService.findRecentByRoom(roomId, 100);
        
        // Send history to the requesting user
        socket.emit(SOCKET_EVENTS.MESSAGE_HISTORY, messages);
      } catch (error) {
        console.error('Error retrieving room history:', error);
      }
    });

    // Handle user typing
    socket.on(SOCKET_EVENTS.USER_TYPING, (data: { isTyping: boolean; roomId: string }) => {
      const { isTyping, roomId } = data;
      const user = { id: socket.id }; // Simplified for now
      
      if (user) {
        socket.to(roomId).emit(SOCKET_EVENTS.USER_TYPING, {
          username: user.id,
          isTyping
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      const user = await userService.findById(socket.id);
      
      if (user) {
        // Notify others in the room
        socket.to(user.roomId).emit(SOCKET_EVENTS.SYSTEM_MESSAGE, {
          message: `[System] ${user.nickname} left`,
          timestamp: new Date().toISOString()
        });
        
        // Notify others in the room about user leave
        socket.to(user.roomId).emit(SOCKET_EVENTS.USER_LEAVE, {
          user: user,
          timestamp: new Date().toISOString()
        });
        
        console.log(`User disconnected: ${user.nickname}`);
      }
    });
  });
};