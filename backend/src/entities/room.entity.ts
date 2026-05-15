export interface UserEntity {
  id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

export interface RoomEntity {
  id: string;
  name: string;
  created_at: string;
}

export interface MessageEntity {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
}