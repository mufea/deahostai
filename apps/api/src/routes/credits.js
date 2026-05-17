import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

const VALID_TOOL_TYPES = ['text', 'image', 'tts', 'pdf', 'video', 'music', 'image_analysis'];

const CREDIT_COSTS = {
  text: 10,
  image: 5,
  tts: 2,
  pdf: 3,
  video: 3,
  music: 3,
  image_analysis: 3,
};

router.post('/deduct', async (req, res) => {
  const { tool_type, credits_used } = req.body;
  const userId = req.pocketbaseUserId;

  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  if (!tool_type) {
    return res.status(400).json({ error: 'tool_type is required' });
  }

  if (!VALID_TOOL_TYPES.includes(tool_type)) {
    return res.status(400).json({
      error: `Invalid tool_type. Must be one of: ${VALID_TOOL_TYPES.join(', ')}`,
    });
  }

  // Use provided credits_used or default to tool's cost
  let finalCreditsUsed = credits_used;
  if (credits_used === undefined) {
    finalCreditsUsed = CREDIT_COSTS[tool_type];
  }

  if (typeof finalCreditsUsed !== 'number' || finalCreditsUsed <= 0) {
    return res.status(400).json({ error: 'credits_used must be a positive number' });
  }

  const user = await pocketbaseClient.collection('users').getOne(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const currentBalance = user.credits_balance || 0;

  if (currentBalance < finalCreditsUsed) {
    return res.status(400).json({ error: 'Insufficient credits' });
  }

  const newBalance = currentBalance - finalCreditsUsed;

  const updatedUser = await pocketbaseClient.collection('users').update(userId, {
    credits_balance: newBalance,
  });

  await pocketbaseClient.collection('credit_history').create({
    user_id: userId,
    tool_type,
    credits_used: finalCreditsUsed,
    credits_remaining: newBalance,
    action_description: `Used ${finalCreditsUsed} credits for ${tool_type}`,
  });

  logger.info(`Credits deducted for user ${userId}: ${finalCreditsUsed} credits for ${tool_type}`);

  res.json({
    success: true,
    credits_remaining: newBalance,
  });
});

export default router;