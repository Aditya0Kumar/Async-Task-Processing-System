import { Queue } from 'bullmq';
import { redisConfig, queueName } from '../config/redis.js';

export const asyncQueue = new Queue(queueName, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log('BullMQ Queue initialized');
