import Redis from 'ioredis';

let redis: Redis;

export const connectRedis = async (): Promise<void> => {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    await redis.ping();
    console.log('✅ Redis 連接成功');
  } catch (error) {
    console.error('❌ Redis 連接失敗:', error);
    throw error;
  }
};

export const getRedis = (): Redis => {
  if (!redis) {
    throw new Error('Redis 未初始化');
  }
  return redis;
};
