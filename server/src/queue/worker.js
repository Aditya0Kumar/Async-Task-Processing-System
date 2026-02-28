import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { redisConfig, queueName } from '../config/redis.js';
import { Entry } from '../models/entry.js';

dotenv.config();

// Connect to MongoDB for the worker process
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Worker connected to MongoDB'))
  .catch(err => console.error('Worker MongoDB connection error:', err));

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const worker = new Worker(queueName, async (job) => {
  const { entryId } = job.data;
  console.log(`Processing job ${job.id} for entry ${entryId}`);

  try {
    // 1. Check idempotency: skip if already completed
    const entry = await Entry.findById(entryId);
    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }

    if (entry.status === 'COMPLETED') {
        console.log(`Entry ${entryId} already completed, skipping.`);
        return;
    }

    // SIMULATED FAILURE (20% chance) to demonstrate BullMQ retries
    if (Math.random() < 0.2) {
      throw new Error("Simulated random failure for demonstration");
    }

    // 2. Start Processing
    await Entry.findByIdAndUpdate(entryId, { 
      status: 'PROCESSING',
      progress: 0 
    });

    // Simulate work step 1
    await delay(2000);
    await Entry.findByIdAndUpdate(entryId, { progress: 33 });
    console.log(`Step 1 complete for ${entryId}`);

    // Simulate work step 2
    await delay(2000);
    await Entry.findByIdAndUpdate(entryId, { progress: 66 });
    console.log(`Step 2 complete for ${entryId}`);

    // Simulate work step 3 (final)
    await delay(2000);
    await Entry.findByIdAndUpdate(entryId, { 
      status: 'COMPLETED',
      progress: 100,
      result: `Processed successfully at ${new Date().toISOString()}`
    });
    console.log(`Step 3 complete for ${entryId}. Job done!`);

  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error.message);
    
    // Check if it's the final attempt based on job options
    if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
      await Entry.findByIdAndUpdate(entryId, { 
        status: 'FAILED',
        error: error.message 
      });
      console.log(`Job ${job.id} marked as FAILED after max retries.`);
    }
    throw error; // Important: Re-throw to trigger BullMQ retry mechanism
  }
}, {
  connection: redisConfig,
  concurrency: 5, // Process up to 5 jobs concurrently
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed successfully!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed with error: ${err.message}. Retries so far: ${job.attemptsMade}`);
});

console.log('Worker started and waiting for jobs...');
