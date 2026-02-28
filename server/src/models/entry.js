import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW',
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  result: {
    type: String,
    default: '',
  },
  progress: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
  }
}, { timestamps: true });

export const Entry = mongoose.model('Entry', entrySchema);
