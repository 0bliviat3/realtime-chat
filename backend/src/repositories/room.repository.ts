import { pool } from '../db/db';
import { RoomEntity } from '../entities/room.entity';

export class RoomRepository {
  async findById(id: string): Promise<RoomEntity | null> {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findAll(): Promise<RoomEntity[]> {
    const result = await pool.query('SELECT * FROM rooms ORDER BY created_at DESC');
    return result.rows;
  }

  async create(room: Omit<RoomEntity, 'created_at'>): Promise<RoomEntity> {
    const result = await pool.query(
      'INSERT INTO rooms (id, name) VALUES ($1, $2) RETURNING *',
      [room.id, room.name]
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
  }
}