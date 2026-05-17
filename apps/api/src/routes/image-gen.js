import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { generateImageOpenAI } from '../providers/openai.js';

const router = express.Router();

router.use(pocketbaseAuth);

/**
 * POST /image-gen
 * Generate images using DALL-E 3
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "1024x1024",
 *   "quality": "hd"
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "revisedPrompt": "A beautiful sunset over mountains..."
 * }
 */
router.post('/', async (req, res) => {
  const requestId = `imggen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { prompt, size = '1024x1024', quality = 'hd' } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[IMAGE-GEN] ========== POST / REQUEST =========');
  logger.info(`[IMAGE-GEN] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-GEN] Request ID: ${requestId}`);
  logger.info(`[IMAGE-GEN] User ID: ${userId}`);
  logger.info(`[IMAGE-GEN] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-GEN] Size: ${size}, Quality: ${quality}`);
  logger.info(`[IMAGE-GEN] Request body: ${JSON.stringify({ prompt: prompt?.substring(0, 50) + '...', size, quality })}`);

  // Validate required fields
  logger.info('[IMAGE-GEN] Validating request body...');
  if (!prompt) {
    logger.warn('[IMAGE-GEN] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-GEN] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-GEN] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  // Validate size
  const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
  if (!validSizes.includes(size)) {
    logger.warn(`[IMAGE-GEN] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
    });
  }

  // Validate quality
  const validQualities = ['standard', 'hd'];
  if (!validQualities.includes(quality)) {
    logger.warn(`[IMAGE-GEN] ❌ Invalid quality: ${quality}`);
    return res.status(400).json({
      error: `Invalid quality. Must be one of: ${validQualities.join(', ')}`,
    });
  }

  logger.info('[IMAGE-GEN] ✓ Request validation passed');

  logger.info(`[IMAGE-GEN] Validating user: ${userId}`);
  const user = await pocketbaseClient.collection('users').getOne(userId).catch((error) => {
    logger.error(`[IMAGE-GEN] Failed to fetch user: ${error.message}`);
    return null;
  });

  if (!user) {
    logger.error(`[IMAGE-GEN] ❌ User not found: ${userId}`);
    throw new Error('User not found');
  }

  logger.info(`[IMAGE-GEN] ✓ User verified: ${user.email}`);

  logger.info(`[IMAGE-GEN] Calling generateImageOpenAI: prompt="${prompt.substring(0, 50)}...", size=${size}, quality=${quality}`);

  // Call OpenAI DALL-E 3
  const result = await generateImageOpenAI(prompt, size, quality);

  const imageUrl = result.imageUrl;
  const revisedPrompt = result.revisedPrompt;

  logger.info(`[IMAGE-GEN] ✓ Image generated successfully`);

  // Store image record in PocketBase if collection exists
  try {
    await pocketbaseClient.collection('_integratedAiImage').create({
      user_id: userId,
      model_id: 'dall-e-3',
      prompt,
      image_url: imageUrl,
      revised_prompt: revisedPrompt,
      size,
      quality,
    });
    logger.info('[IMAGE-GEN] ✓ Image record stored in PocketBase');
  } catch (error) {
    logger.warn(`[IMAGE-GEN] Failed to store image record: ${error.message}`);
    // Don't throw - this is not critical
  }

  logger.info(`[IMAGE-GEN] ✓ Success: Image generated for user ${userId}`);
  logger.info('[IMAGE-GEN] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    revisedPrompt,
  });
});

export default router;