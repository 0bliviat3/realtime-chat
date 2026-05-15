import { Pool } from 'pg';
import { DATABASE_CONFIG } from '../config/db.config';

// PostgreSQL connection pool
export const pool = new Pool({
  user: DATABASE_CONFIG.user,
  host: DATABASE_CONFIG.host,
  database: DATABASE_CONFIG.database,
  password: DATABASE_CONFIG.password,
  port: DATABASE_CONFIG.port,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection error:', err.stack);
  } else {
    console.log('DB connected successfully');
  }
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};