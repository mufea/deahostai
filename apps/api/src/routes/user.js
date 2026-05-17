import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

router.post('/update-profile', async (req, res) => {
  const { name } = req.body;
  const userId = req.pocketbaseUserId;

  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const updatedUser = await pocketbaseClient.collection('users').update(userId, {
    name,
  });

  logger.info(`User profile updated for user ${userId}`);

  res.json({
    success: true,
    user: updatedUser,
  });
});

router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.pocketbaseUserId;

  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }

  const user = await pocketbaseClient.collection('users').getOne(userId);

  if (!user) {
    throw new Error('User not found');
  }

  try {
    await pocketbaseClient.collection('users').authWithPassword(user.email, currentPassword);
  } catch (error) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  await pocketbaseClient.collection('users').update(userId, {
    password: newPassword,
    passwordConfirm: newPassword,
  });

  logger.info(`Password changed for user ${userId}`);

  res.json({ success: true });
});

export default router;