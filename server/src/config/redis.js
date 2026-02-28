import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export let redisConfig;

if (process.env.REDIS_URL) {
  console.log('Connecting to Redis via REDIS_URL provided in .env');
  redisConfig = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: { rejectUnauthorized: false } // Required for Upstash
  });
} else {
  console.log('Connecting to Local Redis at 127.0.0.1:6379');
  redisConfig = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    }
  });
}

redisConfig.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

export const queueName = 'Async-Task-Processing-System';
