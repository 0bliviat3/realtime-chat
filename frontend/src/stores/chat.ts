import { defineStore } from 'pinia';
import { socket, SocketEvents } from './index';
import { ChatMessage, User } from './types';

export const useChatStore = defineStore('chat', {
  state: () => ({
    username: '',
    roomId: '',
    messages: [] as ChatMessage[],
    users: [] as User[],
    isTyping: false,
    typingUsers: [] as string[]
  }),
  
  actions: {
    setUsername(username: string) {
      this.username = username;
    },
    
    setRoomId(roomId: string) {
      this.roomId = roomId;
    },
    
    joinRoom() {
      if (this.username && this.roomId) {
        socket.emit('room:join', { username: this.username, roomId: this.roomId });
      }
    },
    
    leaveRoom() {
      if (this.roomId) {
        socket.emit('room:leave', { roomId: this.roomId });
      }
    },
    
    sendMessage(message: string) {
      if (message.trim() && this.roomId) {
        socket.emit('chat:send', { message, roomId: this.roomId });
      }
    },
    
    startTyping() {
      if (this.roomId) {
        socket.emit('user:typing', { isTyping: true, roomId: this.roomId });
      }
    },
    
    stopTyping() {
      if (this.roomId) {
        socket.emit('user:typing', { isTyping: false, roomId: this.roomId });
      }
    },
    
    // Initialize socket listeners
    initSocketListeners() {
      socket.on('chat:receive', (message: ChatMessage) => {
        this.messages.push(message);
      });
      
      socket.on('system:message', (data: { message: string; timestamp: Date }) => {
        this.messages.push({
          id: Date.now().toString(),
          userId: '',
          username: 'System',
          message: data.message,
          timestamp: data.timestamp,
          roomId: this.roomId
        });
      });
      
      socket.on('room:members', (users: User[]) => {
        this.users = users;
      });
      
      socket.on('user:typing', (data: { username: string; isTyping: boolean }) => {
        if (data.isTyping) {
          this.typingUsers.push(data.username);
        } else {
          this.typingUsers = this.typingUsers.filter(name => name !== data.username);
        }
      });
    }
  }
});