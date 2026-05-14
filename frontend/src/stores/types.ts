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
}
