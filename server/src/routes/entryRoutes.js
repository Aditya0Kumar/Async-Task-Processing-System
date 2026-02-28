import express from 'express';
import { createEntry, getEntries, getEntryById } from '../controllers/entryController.js';

const router = express.Router();

router.post('/', createEntry);
router.get('/', getEntries);
router.get('/:id', getEntryById);

export default router;
