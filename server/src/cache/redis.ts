import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (error) => {
  console.error('❌ Redis Client Background Error:', error);
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis Client is attempting to reconnect...');
});

export async function connectCache() {
  try {
    await redisClient.connect();
    console.log('✅ Redis Cache Connected to [picturehouse]');
  } catch (error) {
    throw new Error('Failed to connect to Redis', {
      cause: error,
    });
  }
}
