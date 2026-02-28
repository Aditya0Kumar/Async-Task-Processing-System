import { Entry } from '../models/entry.js';
import { asyncQueue } from '../queue/queue.js';

export const createEntry = async (req, res) => {
  try {
    const { title, priority = 'LOW' } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const entry = await Entry.create({ title, priority });

    // Map priority string to BullMQ numeric priority (lower number = higher priority)
    const priorityMap = {
      'HIGH': 1,
      'MEDIUM': 2,
      'LOW': 3
    };

    // Enqueue the job with priority. True separation.
    await asyncQueue.add('process-entry', { entryId: entry._id }, {
      priority: priorityMap[priority]
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEntries = async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEntryById = async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
