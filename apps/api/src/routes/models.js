import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { getAvailableModels, getAvailableModelsByType, getAvailableModelsByProvider, isProviderConfigured } from '../utils/provider-config.js';
import { validateModelId, getModelConfigWithValidation, calculateCreditsNeeded } from '../utils/models.validator.js';

const router = express.Router();

router.use(pocketbaseAuth);

// GET /models/list - List all available models
router.get('/list', async (req, res) => {
  const { type, provider } = req.query;

  let models = getAvailableModels();

  // Filter by type if provided
  if (type) {
    if (!['chat', 'image'].includes(type)) {
      return res.status(400).json({ error: 'type must be "chat" or "image"' });
    }
    models = models.filter(m => m.type === type);
  }

  // Filter by provider if provided
  if (provider) {
    if (!isProviderConfigured(provider)) {
      return res.status(400).json({ error: `Provider '${provider}' is not configured` });
    }
    models = models.filter(m => m.provider === provider);
  }

  const formattedModels = models.map(model => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    type: model.type,
    pricing: model.pricing,
    maxTokens: model.maxTokens || null,
    capabilities: model.capabilities || [],
    description: model.description,
    available: true,
  }));

  logger.info(`Models list retrieved: ${formattedModels.length} models`);

  res.json({
    models: formattedModels,
    total: formattedModels.length,
  });
});

// POST /models/compare - Compare multiple models
router.post('/compare', async (req, res) => {
  const { message_or_prompt, model_ids, user_id, type = 'chat' } = req.body;
  const userId = user_id || req.pocketbaseUserId;

  if (!message_or_prompt) {
    return res.status(400).json({ error: 'message_or_prompt is required' });
  }

  if (!Array.isArray(model_ids) || model_ids.length === 0) {
    return res.status(400).json({ error: 'model_ids must be a non-empty array' });
  }

  if (model_ids.length > 5) {
    return res.status(400).json({ error: 'Cannot compare more than 5 models at once' });
  }

  if (!['chat', 'image'].includes(type)) {
    return res.status(400).json({ error: 'type must be "chat" or "image"' });
  }

  // Validate all models exist and are correct type
  for (const modelId of model_ids) {
    if (!validateModelId(modelId)) {
      return res.status(400).json({ error: `Model '${modelId}' not found` });
    }
    const config = getModelConfigWithValidation(modelId);
    if (config.type !== type) {
      return res.status(400).json({ error: `Model '${modelId}' is not a ${type} model` });
    }
  }

  // Verify user exists
  const user = await pocketbaseClient.collection('users').getOne(userId).catch(() => null);
  if (!user) {
    throw new Error('User not found');
  }

  // Calculate total credits needed (estimate)
  let totalCreditsNeeded = 0;
  for (const modelId of model_ids) {
    // Estimate: 100 input tokens, 100 output tokens for chat; 1 image for image models
    const credits = calculateCreditsNeeded(modelId, 100, 100);
    totalCreditsNeeded += credits;
  }

  // Check if user has enough credits
  const currentBalance = user.credits_balance || 0;
  if (currentBalance < totalCreditsNeeded) {
    return res.status(400).json({ error: `Insufficient credits. Need ${totalCreditsNeeded}, have ${currentBalance}` });
  }

  // Deduct credits
  const newBalance = currentBalance - totalCreditsNeeded;
  await pocketbaseClient.collection('users').update(userId, {
    credits_balance: newBalance,
  });

  // Log credit history
  await pocketbaseClient.collection('credit_history').create({
    user_id: userId,
    tool_type: 'comparison',
    credits_used: totalCreditsNeeded,
    credits_remaining: newBalance,
    action_description: `Compared ${model_ids.length} models`,
  });

  logger.info(`Model comparison initiated for user ${userId}: models=${model_ids.join(', ')}`);

  res.json({
    comparison_id: `comp_${Date.now()}`,
    models: model_ids,
    type,
    total_credits_used: totalCreditsNeeded,
    status: 'initiated',
    message: 'Model comparison initiated. Results will be available shortly.',
  });
});

export default router;