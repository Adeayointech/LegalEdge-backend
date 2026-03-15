import express from 'express';
import { getFirmDetails } from '../controllers/firm.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/details', authenticate, getFirmDetails);

export default router;
