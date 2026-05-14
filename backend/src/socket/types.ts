// Define socket-related types here

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