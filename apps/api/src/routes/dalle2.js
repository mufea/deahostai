import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import { getOpenAIClient } from '../providers/openai.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

/**
 * POST /image-generation/dalle2
 * Generate images using DALL-E 2
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "256x256" | "512x512" | "1024x1024",
 *   "quality": "standard" (DALL-E 2 only supports standard)
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "model": "dall-e-2",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/', async (req, res) => {
  const { prompt, size = '1024x1024', quality = 'standard' } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[DALLE2] ========== POST / REQUEST =========');
  logger.info(`[DALLE2] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[DALLE2] User ID: ${userId}`);
  logger.info(`[DALLE2] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[DALLE2] Size: ${size}, Quality: ${quality}`);

  // Validate required fields
  logger.info('[DALLE2] Validating request body...');
  if (!prompt) {
    logger.warn('[DALLE2] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[DALLE2] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 1000) {
    logger.warn(`[DALLE2] ❌ Prompt exceeds max length: ${prompt.length} > 1000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 1000 characters' });
  }

  // Validate size
  const validSizes = ['256x256', '512x512', '1024x1024'];
  if (!validSizes.includes(size)) {
    logger.warn(`[DALLE2] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
    });
  }

  // CRITICAL: DALL-E 2 ONLY supports "standard" quality, NOT "hd"
  logger.info(`[DALLE2] Validating quality parameter: ${quality}`);
  if (quality !== 'standard') {
    logger.warn(`[DALLE2] ❌ Invalid quality: ${quality}`);
    logger.warn('[DALLE2] DALL-E 2 ONLY supports quality: "standard"');
    return res.status(400).json({
      error: 'DALL-E 2 only supports quality: "standard" (not "hd")',
    });
  }
  logger.info('[DALLE2] ✓ Quality validation passed: standard');

  logger.info('[DALLE2] ✓ Request validation passed');

  logger.info('[DALLE2] Getting OpenAI client...');
  const client = getOpenAIClient();
  logger.info('[DALLE2] ✓ OpenAI client obtained');

  logger.info('[DALLE2] Calling OpenAI DALL-E 2 API...');
  logger.info(`[DALLE2] Model: dall-e-2, Size: ${size}, Quality: ${quality}`);
  logger.info(`[DALLE2] Prompt: ${prompt.substring(0, 50)}...`);

  const response = await client.images.generate({
    model: 'dall-e-2',
    prompt: prompt,
    size: size,
    quality: quality,
    n: 1,
  });

  logger.info('[DALLE2] ✓ Response received from OpenAI');
  logger.info(`[DALLE2] Response timestamp: ${new Date().toISOString()}`);

  // Validate response structure
  if (!response.data || response.data.length === 0) {
    logger.error('[DALLE2] ❌ No image data in response');
    throw new Error('No image data in response from OpenAI API');
  }

  const imageUrl = response.data[0].url;

  if (!imageUrl) {
    logger.error('[DALLE2] ❌ No image URL in response');
    throw new Error('No image URL in response from OpenAI API');
  }

  logger.info('[DALLE2] ✓ Image generated successfully');
  logger.info(`[DALLE2] Image URL: ${imageUrl.substring(0, 50)}...`);
  logger.info(`[DALLE2] ✓ Success: Image generated for user ${userId}`);
  logger.info('[DALLE2] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl: imageUrl,
    model: 'dall-e-2',
    prompt: prompt,
  });
});

export default router;