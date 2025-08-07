import { Pool } from 'pg';

let pool: Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'propagent_dev',
      user: process.env.DB_USER || 'propagent',
      password: process.env.DB_PASSWORD || 'dev_password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    await pool.query('SELECT NOW()');
    console.log('✅ 資料庫連接成功');
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error);
    throw error;
  }
};

export const getDB = (): Pool => {
  if (!pool) {
    throw new Error('資料庫未初始化');
  }
  return pool;
};
