import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { callOpenAI } from '../providers/openai.js';
import { callGemini } from '../providers/gemini.js';
import { callAnthropic } from '../providers/anthropic.js';
import { callDeepseek } from '../providers/deepseek.js';
import { validateModelId, getModelConfigWithValidation, getProviderByModelIdWithValidation } from '../utils/models.validator.js';
import { isProviderConfigured } from '../utils/provider-config.js';

const router = express.Router();

router.use(pocketbaseAuth);

// Supported text models with base credits
const TEXT_MODELS = {
  'gpt-4o': { provider: 'openai', baseCredits: 10 },
  'gpt-4-turbo': { provider: 'openai', baseCredits: 10 },
  'gpt-3.5-turbo': { provider: 'openai', baseCredits: 5 },
  'claude-3-5-sonnet': { provider: 'anthropic', baseCredits: 12 },
  'claude-3-opus': { provider: 'anthropic', baseCredits: 12 },
  'claude-3-sonnet': { provider: 'anthropic', baseCredits: 8 },
  'claude-3-haiku': { provider: 'anthropic', baseCredits: 4 },
  'gemini-2.0-flash': { provider: 'gemini', baseCredits: 7 },
  'gemini-1.5-pro': { provider: 'gemini', baseCredits: 7 },
  'gemini-1.5-flash': { provider: 'gemini', baseCredits: 5 },
  'deepseek-chat': { provider: 'deepseek', baseCredits: 4 },
  'deepseek-coder': { provider: 'deepseek', baseCredits: 4 },
};

/**
 * Calculate prompt length multiplier based on message length
 * @param {string} message - The message text
 * @returns {number} Multiplier (1x, 1.2x, or 1.5x)
 */
function getPromptLengthMultiplier(message) {
  const length = message.length;
  if (length < 100) return 1.0;
  if (length < 500) return 1.2;
  return 1.5;
}

/**
 * Calculate credits needed for text generation
 * @param {string} modelId - The model ID
 * @param {string} message - The message text
 * @returns {number} Credits needed
 */
function calculateTextCredits(modelId, message) {
  const modelConfig = TEXT_MODELS[modelId];
  if (!modelConfig) {
    throw new Error(`Model '${modelId}' not found`);
  }

  const baseCredits = modelConfig.baseCredits;
  const multiplier = getPromptLengthMultiplier(message);
  const totalCredits = Math.ceil(baseCredits * multiplier);
  return totalCredits;
}

router.post('/generate', async (req, res) => {
  const { message, model_id, temperature = 0.7, top_p = 1.0, max_tokens = 2048, system_prompt, user_id } = req.body;
  const userId = user_id || req.pocketbaseUserId;

  logger.info('[TEXT] ========== POST /generate REQUEST =========');
  logger.info(`[TEXT] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[TEXT] User ID: ${userId}`);
  logger.info(`[TEXT] Model ID: ${model_id}`);
  logger.info(`[TEXT] Message length: ${message?.length || 0}`);
  logger.info(`[TEXT] Temperature: ${temperature}, Top P: ${top_p}, Max Tokens: ${max_tokens}`);

  // Validate required fields
  if (!message) {
    logger.warn('[TEXT] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (!model_id) {
    logger.warn('[TEXT] ❌ Missing model_id in request body');
    return res.status(400).json({ error: 'model_id is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('[TEXT] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.warn(`[TEXT] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  // Validate temperature and top_p
  if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
    logger.warn(`[TEXT] ❌ Invalid temperature: ${temperature}`);
    return res.status(400).json({ error: 'temperature must be a number between 0 and 2' });
  }

  if (typeof top_p !== 'number' || top_p < 0 || top_p > 1) {
    logger.warn(`[TEXT] ❌ Invalid top_p: ${top_p}`);
    return res.status(400).json({ error: 'top_p must be a number between 0 and 1' });
  }

  // Validate model exists in config
  logger.info(`[TEXT] Validating model_id: ${model_id}`);
  if (!validateModelId(model_id)) {
    logger.error(`[TEXT] ❌ Model not found in config: ${model_id}`);
    return res.status(400).json({
      error: `Model '${model_id}' is not supported. Supported models: ${Object.keys(TEXT_MODELS).join(', ')}`,
    });
  }

  // Get model config
  let modelConfig;
  try {
    modelConfig = getModelConfigWithValidation(model_id);
    logger.info(`[TEXT] ✓ Model config retrieved: ${JSON.stringify(modelConfig)}`);
  } catch (error) {
    logger.error(`[TEXT] ❌ Failed to get model config: ${error.message}`);
    throw error;
  }

  // Get provider
  let provider;
  try {
    provider = getProviderByModelIdWithValidation(model_id);
    logger.info(`[TEXT] ✓ Provider determined: ${provider}`);
  } catch (error) {
    logger.error(`[TEXT] ❌ Failed to get provider: ${error.message}`);
    throw error;
  }

  // Check if provider is configured
  logger.info(`[TEXT] Checking if provider '${provider}' is configured`);
  if (!isProviderConfigured(provider)) {
    logger.error(`[TEXT] ❌ Provider '${provider}' is not configured with API key`);
    throw new Error(`Provider '${provider}' is not configured with API key`);
  }
  logger.info(`[TEXT] ✓ Provider '${provider}' is configured`);

  // Verify user exists and get current credits
  logger.info(`[TEXT] Verifying user exists: ${userId}`);
  const user = await pocketbaseClient.collection('users').getOne(userId).catch((error) => {
    logger.error(`[TEXT] Failed to fetch user: ${error.message}`);
    return null;
  });
  if (!user) {
    logger.error(`[TEXT] ❌ User not found: ${userId}`);
    throw new Error('User not found');
  }
  logger.info(`[TEXT] ✓ User verified: ${user.email}`);

  // Calculate credits needed
  const creditsNeeded = calculateTextCredits(model_id, message);
  logger.info(`[TEXT] Credits needed: ${creditsNeeded}`);

  // Check if user has sufficient credits
  const currentBalance = user.credits_balance || 0;
  logger.info(`[TEXT] Current balance: ${currentBalance}, needed: ${creditsNeeded}`);
  if (currentBalance < creditsNeeded) {
    logger.warn(`[TEXT] ❌ Insufficient credits: ${currentBalance} < ${creditsNeeded}`);
    return res.status(400).json({
      error: `Insufficient credits. Need ${creditsNeeded}, have ${currentBalance}`,
    });
  }

  // Call appropriate provider
  let response;
  let inputTokens = 0;
  let outputTokens = 0;

  logger.info(`[TEXT] Calling provider: ${provider}`);
  logger.info(`[TEXT] Request: model=${model_id}, temp=${temperature}, top_p=${top_p}, max_tokens=${max_tokens}`);

  if (provider === 'openai') {
    logger.info('[TEXT] Calling OpenAI API');
    const result = await callOpenAI({
      message,
      model_id,
      temperature,
      top_p,
      max_tokens,
      system_prompt: system_prompt || 'You are a helpful AI assistant.',
    });
    response = result.response;
    inputTokens = result.input_tokens;
    outputTokens = result.output_tokens;
    logger.info(`[TEXT] ✓ OpenAI response received: tokens=${inputTokens + outputTokens}`);
  } else if (provider === 'anthropic') {
    logger.info('[TEXT] Calling Anthropic API');
    const result = await callAnthropic({
      message,
      model_id,
      temperature,
      top_p,
      max_tokens,
      system_prompt: system_prompt || 'You are a helpful AI assistant.',
    });
    response = result.response;
    inputTokens = result.input_tokens;
    outputTokens = result.output_tokens;
    logger.info(`[TEXT] ✓ Anthropic response received: tokens=${inputTokens + outputTokens}`);
  } else if (provider === 'gemini') {
    logger.info('[TEXT] Calling Gemini API');
    const result = await callGemini({
      message,
      model_id,
      temperature,
      top_p,
      max_tokens,
      system_prompt: system_prompt || 'You are a helpful AI assistant.',
    });
    response = result.response;
    inputTokens = result.input_tokens;
    outputTokens = result.output_tokens;
    logger.info(`[TEXT] ✓ Gemini response received: tokens=${inputTokens + outputTokens}`);
  } else if (provider === 'deepseek') {
    logger.info('[TEXT] Calling Deepseek API');
    const result = await callDeepseek({
      message,
      model_id,
      temperature,
      top_p,
      max_tokens,
      system_prompt: system_prompt || 'You are a helpful AI assistant.',
    });
    response = result.response;
    inputTokens = result.input_tokens;
    outputTokens = result.output_tokens;
    logger.info(`[TEXT] ✓ Deepseek response received: tokens=${inputTokens + outputTokens}`);
  } else {
    logger.error(`[TEXT] ❌ Provider '${provider}' is not yet implemented`);
    throw new Error(`Provider '${provider}' is not yet implemented`);
  }

  if (!response) {
    logger.error('[TEXT] ❌ No response received from provider');
    throw new Error('No response received from AI provider');
  }

  logger.info(`[TEXT] ✓ Response generated successfully: ${response.length} characters`);

  // Deduct credits
  const newBalance = currentBalance - creditsNeeded;
  logger.info(`[TEXT] Deducting credits: ${currentBalance} - ${creditsNeeded} = ${newBalance}`);
  await pocketbaseClient.collection('users').update(userId, {
    credits_balance: newBalance,
  });
  logger.info('[TEXT] ✓ Credits deducted successfully');

  // Store in _integratedAiText collection
  logger.info('[TEXT] Storing record in _integratedAiText collection');
  const textRecord = await pocketbaseClient.collection('_integratedAiText').create({
    user_id: userId,
    model_id,
    prompt: message,
    response,
    credits_used: creditsNeeded,
    tokens_used: inputTokens + outputTokens,
    temperature,
    top_p,
    max_tokens,
    system_prompt: system_prompt || null,
  });
  logger.info(`[TEXT] ✓ Record stored: ${textRecord.id}`);

  // Log credit history
  logger.info('[TEXT] Logging credit history');
  await pocketbaseClient.collection('credit_history').create({
    user_id: userId,
    tool_type: 'text',
    credits_used: creditsNeeded,
    credits_remaining: newBalance,
    action_description: `Text generation with ${model_id}`,
  });
  logger.info('[TEXT] ✓ Credit history logged');

  logger.info(`[TEXT] ✓ Success: Generated text for user ${userId} using ${model_id}`);
  logger.info('[TEXT] ========== REQUEST COMPLETE =========');

  res.json({
    response,
    credits_used: creditsNeeded,
    remaining_credits: newBalance,
    model_id,
    record_id: textRecord.id,
  });
});

export default router;