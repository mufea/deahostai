import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { validateModelId, getModelConfigWithValidation, calculateCreditsNeeded, getProviderByModelIdWithValidation, validateModelCapability } from '../utils/models.validator.js';
import { isProviderConfigured } from '../utils/provider-config.js';
import { generateImageOpenAI } from '../providers/openai.js';

const router = express.Router();

router.use(pocketbaseAuth);

router.post('/generate', async (req, res) => {
  const { prompt, model_id, style, size = '1024x1024', quality = 'standard', negative_prompt, seed, num_images = 1, user_id } = req.body;
  const userId = user_id || req.pocketbaseUserId;

  logger.info('[IMAGE-MULTI] ========== POST /generate REQUEST =========');
  logger.info(`[IMAGE-MULTI] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-MULTI] User ID: ${userId}`);
  logger.info(`[IMAGE-MULTI] Model ID: ${model_id}`);
  logger.info(`[IMAGE-MULTI] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-MULTI] Size: ${size}, Quality: ${quality}, Num Images: ${num_images}`);

  if (!prompt) {
    logger.warn('[IMAGE-MULTI] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (!model_id) {
    logger.warn('[IMAGE-MULTI] ❌ Missing model_id in request body');
    return res.status(400).json({ error: 'model_id is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-MULTI] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-MULTI] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  if (typeof num_images !== 'number' || num_images < 1 || num_images > 10) {
    logger.warn(`[IMAGE-MULTI] ❌ Invalid num_images: ${num_images}`);
    return res.status(400).json({ error: 'num_images must be between 1 and 10' });
  }

  // Validate model exists
  logger.info(`[IMAGE-MULTI] Validating model_id: ${model_id}`);
  if (!validateModelId(model_id)) {
    logger.error(`[IMAGE-MULTI] ❌ Model not found: ${model_id}`);
    return res.status(400).json({ error: `Model '${model_id}' not found` });
  }

  // Get model config
  logger.info('[IMAGE-MULTI] Getting model config...');
  const modelConfig = getModelConfigWithValidation(model_id);

  // Validate model is image type
  if (modelConfig.type !== 'image') {
    logger.error(`[IMAGE-MULTI] ❌ Model '${model_id}' is not an image model`);
    return res.status(400).json({ error: `Model '${model_id}' is not an image model` });
  }

  // Validate model supports image generation
  logger.info(`[IMAGE-MULTI] Validating model capability: image_generation`);
  if (!validateModelCapability(model_id, 'image_generation')) {
    logger.error(`[IMAGE-MULTI] ❌ Model '${model_id}' does not support image generation`);
    return res.status(400).json({ error: `Model '${model_id}' does not support image generation` });
  }

  // Get provider
  logger.info('[IMAGE-MULTI] Getting provider...');
  const provider = getProviderByModelIdWithValidation(model_id);
  logger.info(`[IMAGE-MULTI] ✓ Provider: ${provider}`);

  // Check if provider is configured
  logger.info(`[IMAGE-MULTI] Checking if provider '${provider}' is configured`);
  if (!isProviderConfigured(provider)) {
    logger.error(`[IMAGE-MULTI] ❌ Provider '${provider}' is not configured with API key`);
    throw new Error(`Provider '${provider}' is not configured with API key`);
  }
  logger.info(`[IMAGE-MULTI] ✓ Provider '${provider}' is configured`);

  // Verify user exists
  logger.info(`[IMAGE-MULTI] Verifying user: ${userId}`);
  const user = await pocketbaseClient.collection('users').getOne(userId).catch(() => null);
  if (!user) {
    logger.error(`[IMAGE-MULTI] ❌ User not found: ${userId}`);
    throw new Error('User not found');
  }
  logger.info(`[IMAGE-MULTI] ✓ User verified: ${user.email}`);

  // Call appropriate provider
  let imageUrls;

  logger.info(`[IMAGE-MULTI] Calling provider: ${provider}`);
  if (provider === 'openai') {
    logger.info('[IMAGE-MULTI] Calling generateImageOpenAI...');
    const result = await generateImageOpenAI(prompt, size, quality);
    imageUrls = [result.imageUrl];
    logger.info('[IMAGE-MULTI] ✓ Image generated from OpenAI');
  } else {
    logger.error(`[IMAGE-MULTI] ❌ Provider '${provider}' image generation is not yet implemented`);
    throw new Error(`Provider '${provider}' image generation is not yet implemented`);
  }

  // Calculate credits needed (per image)
  logger.info('[IMAGE-MULTI] Calculating credits needed...');
  const creditsPerImage = calculateCreditsNeeded(model_id, 0, 0);
  const creditsUsed = creditsPerImage * num_images;
  logger.info(`[IMAGE-MULTI] Credits needed: ${creditsUsed}`);

  // Check if user has enough credits
  const currentBalance = user.credits_balance || 0;
  logger.info(`[IMAGE-MULTI] Current balance: ${currentBalance}, needed: ${creditsUsed}`);
  if (currentBalance < creditsUsed) {
    logger.warn(`[IMAGE-MULTI] ❌ Insufficient credits: ${currentBalance} < ${creditsUsed}`);
    return res.status(400).json({ error: 'Insufficient credits' });
  }

  // Deduct credits
  logger.info('[IMAGE-MULTI] Deducting credits...');
  const newBalance = currentBalance - creditsUsed;
  await pocketbaseClient.collection('users').update(userId, {
    credits_balance: newBalance,
  });
  logger.info(`[IMAGE-MULTI] ✓ Credits deducted: ${currentBalance} - ${creditsUsed} = ${newBalance}`);

  // Store in _integratedAiImage collection
  logger.info('[IMAGE-MULTI] Storing image record in PocketBase...');
  const imageRecord = await pocketbaseClient.collection('_integratedAiImage').create({
    user_id: userId,
    model_id,
    prompt,
    image_urls: imageUrls,
    style: style || null,
    size,
    quality,
    negative_prompt: negative_prompt || null,
    seed: seed || null,
    num_images,
    credits_used: creditsUsed,
  });
  logger.info(`[IMAGE-MULTI] ✓ Image record stored: ${imageRecord.id}`);

  // Log credit history
  logger.info('[IMAGE-MULTI] Logging credit history...');
  await pocketbaseClient.collection('credit_history').create({
    user_id: userId,
    tool_type: 'image',
    credits_used: creditsUsed,
    credits_remaining: newBalance,
    action_description: `Generated ${num_images} image(s) with ${modelConfig.name}`,
  });
  logger.info('[IMAGE-MULTI] ✓ Credit history logged');

  logger.info(`[IMAGE-MULTI] ✓ Success: Images generated for user ${userId}`);
  logger.info('[IMAGE-MULTI] ========== REQUEST COMPLETE =========');

  res.json({
    image_urls: imageUrls,
    credits_used: creditsUsed,
    model_info: {
      id: modelConfig.id,
      name: modelConfig.name,
      provider: modelConfig.provider,
    },
    record_id: imageRecord.id,
  });
});

export default router;