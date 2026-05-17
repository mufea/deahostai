import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import { callAnthropic } from '../providers/anthropic.js';
import { getSystemPromptWithLanguage } from '../constants/prompts.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

/**
 * POST /claude
 * Chat with Claude Sonnet 4 model
 * 
 * Request body:
 * {
 *   "message": "Your message here",
 *   "temperature": 0.7,
 *   "maxTokens": 2048,
 *   "language": "en"
 * }
 * 
 * Response:
 * {
 *   "response": "Claude's response text",
 *   "tokens": { "input": 10, "output": 20 },
 *   "model": "claude"
 * }
 */
router.post('/', async (req, res) => {
  const { message, temperature = 0.7, maxTokens = 2048, language = 'en' } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[CLAUDE] ========== POST / REQUEST =========');
  logger.info(`[CLAUDE] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CLAUDE] User ID: ${userId}`);
  logger.info(`[CLAUDE] Message length: ${message ? message.length : 0}`);
  logger.info(`[CLAUDE] Temperature: ${temperature}, Max Tokens: ${maxTokens}`);
  logger.info(`[CLAUDE] Language: ${language}`);

  // Validate required fields
  logger.info('[CLAUDE] Validating request body...');
  if (!message) {
    logger.warn('[CLAUDE] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('[CLAUDE] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.warn(`[CLAUDE] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  // Validate temperature
  if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
    logger.warn(`[CLAUDE] ❌ Invalid temperature: ${temperature}`);
    return res.status(400).json({ error: 'temperature must be a number between 0 and 2' });
  }

  // Validate maxTokens
  if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4096) {
    logger.warn(`[CLAUDE] ❌ Invalid maxTokens: ${maxTokens}`);
    return res.status(400).json({ error: 'maxTokens must be a number between 1 and 4096' });
  }

  logger.info('[CLAUDE] ✓ Request validation passed');

  // Get system prompt with language
  logger.info('[CLAUDE] Getting system prompt...');
  const systemPrompt = getSystemPromptWithLanguage(language);
  logger.info(`[CLAUDE] ✓ System prompt length: ${systemPrompt.length}`);

  logger.info('[CLAUDE] Calling Anthropic Claude Sonnet 4 API...');
  logger.info(`[CLAUDE] Request: model=claude-sonnet-4-20250514, temp=${temperature}, max_tokens=${maxTokens}`);

  // Call Anthropic Claude Sonnet 4
  const result = await callAnthropic({
    message,
    model_id: 'claude-sonnet-4-20250514',
    temperature,
    top_p: 1.0,
    max_tokens: maxTokens,
    system_prompt: systemPrompt,
  });

  const response = result.response;
  const inputTokens = result.input_tokens;
  const outputTokens = result.output_tokens;

  logger.info('[CLAUDE] ✓ Claude response received');
  logger.info(`[CLAUDE] Response length: ${response.length} characters`);
  logger.info(`[CLAUDE] Tokens - Input: ${inputTokens}, Output: ${outputTokens}`);
  logger.info(`[CLAUDE] ✓ Success: Chat response generated for user ${userId}`);
  logger.info('[CLAUDE] ========== REQUEST COMPLETE =========');

  res.json({
    response: response,
    tokens: {
      input: inputTokens,
      output: outputTokens,
    },
    model: 'claude',
  });
});

export default router;