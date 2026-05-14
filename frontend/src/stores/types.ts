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
}
