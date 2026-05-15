import { pool } from '../db/db';
import { MessageEntity } from '../entities/message.entity';

export class MessageRepository {
  async create(message: Omit<MessageEntity, 'created_at'>): Promise<MessageEntity> {
    const result = await pool.query(
      'INSERT INTO messages (id, room_id, user_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [message.id, message.room_id, message.user_id, message.message]
    );
    return result.rows[0];
  }

  async findRecentByRoom(roomId: string, limit: number = 100): Promise<MessageEntity[]> {
    const result = await pool.query(
      'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT $2',
      [roomId, limit]
    );
    return result.rows;
  }

  async countByRoom(roomId: string): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM messages WHERE room_id = $1', [roomId]);
    return parseInt(result.rows[0].count);
  }
}