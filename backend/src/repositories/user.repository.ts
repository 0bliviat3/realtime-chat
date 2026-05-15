import { pool } from '../db/db';
import { UserEntity } from '../entities/user.entity';

export class UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByNickname(nickname: string): Promise<UserEntity | null> {
    const result = await pool.query('SELECT * FROM users WHERE nickname = $1', [nickname]);
    return result.rows[0] || null;
  }

  async create(user: Omit<UserEntity, 'created_at' | 'updated_at'>): Promise<UserEntity> {
    const result = await pool.query(
      'INSERT INTO users (id, nickname) VALUES ($1, $2) RETURNING *',
      [user.id, user.nickname]
    );
    return result.rows[0];
  }

  async update(id: string, nickname: string): Promise<UserEntity> {
    const result = await pool.query(
      'UPDATE users SET nickname = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [nickname, id]
    );
    return result.rows[0];
  }
}