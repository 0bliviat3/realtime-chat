import { UserRepository } from '../repositories/user.repository';
import { RoomRepository } from '../repositories/room.repository';
import { MessageRepository } from '../repositories/message.repository';
import { UserEntity } from '../entities/user.entity';
import { RoomEntity } from '../entities/room.entity';
import { MessageEntity } from '../entities/message.entity';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  async findByNickname(nickname: string): Promise<UserEntity | null> {
    return this.userRepository.findByNickname(nickname);
  }

  async createOrUpdate(user: Omit<UserEntity, 'created_at' | 'updated_at'>): Promise<UserEntity> {
    const existingUser = await this.userRepository.findByNickname(user.nickname);
    if (existingUser) {
      return this.userRepository.update(existingUser.id, user.nickname);
    }
    return this.userRepository.create(user);
  }
}

export class RoomService {
  private roomRepository: RoomRepository;

  constructor() {
    this.roomRepository = new RoomRepository();
  }

  async findById(id: string): Promise<RoomEntity | null> {
    return this.roomRepository.findById(id);
  }

  async findAll(): Promise<RoomEntity[]> {
    return this.roomRepository.findAll();
  }

  async create(room: Omit<RoomEntity, 'created_at'>): Promise<RoomEntity> {
    return this.roomRepository.create(room);
  }

  async delete(id: string): Promise<void> {
    return this.roomRepository.delete(id);
  }
}

export class MessageService {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  async create(message: Omit<MessageEntity, 'created_at'>): Promise<MessageEntity> {
    return this.messageRepository.create(message);
  }

  async findRecentByRoom(roomId: string, limit: number = 100): Promise<MessageEntity[]> {
    return this.messageRepository.findRecentByRoom(roomId, limit);
  }

  async countByRoom(roomId: string): Promise<number> {
    return this.messageRepository.countByRoom(roomId);
  }
}