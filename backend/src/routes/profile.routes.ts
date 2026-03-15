import express from 'express';
import { authenticate } from '../middleware/auth';
import * as profileController from '../controllers/profile.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get current user's profile
router.get('/', profileController.getProfile);

// Update profile information
router.put('/', profileController.updateProfile);

// Change password
router.put('/password', profileController.changePassword);

export default router;
