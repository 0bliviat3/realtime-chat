// Define socket-related types here

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