import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import { callOpenAI } from '../providers/openai.js';
import { callAnthropic } from '../providers/anthropic.js';
import { callGemini } from '../providers/gemini.js';
import { callDeepseek } from '../providers/deepseek.js';
import { callXAI } from '../providers/xai.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

/**
 * POST /chat
 * Chat with OpenAI GPT-4o model
 * 
 * Request body:
 * {
 *   "message": "Your message here",
 *   "conversationHistory": [
 *     { "role": "user", "content": "Previous message" },
 *     { "role": "assistant", "content": "Previous response" }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "response": "AI response text",
 *   "tokens": { "input": 10, "output": 20 }
 * }
 */
router.post('/', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[CHAT] ========== POST / REQUEST =========');
  logger.info(`[CHAT] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CHAT] User ID: ${userId}`);
  logger.info(`[CHAT] Message length: ${message ? message.length : 0}`);
  logger.info(`[CHAT] Conversation history length: ${conversationHistory.length}`);

  // Validate required fields
  logger.info('[CHAT] Validating request body...');
  if (!message) {
    logger.info('[CHAT] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.info('[CHAT] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.info(`[CHAT] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  if (!Array.isArray(conversationHistory)) {
    logger.info('[CHAT] ❌ conversationHistory is not an array');
    return res.status(400).json({ error: 'conversationHistory must be an array' });
  }

  logger.info('[CHAT] ✓ Request validation passed');

  // Build messages array with conversation history
  const messages = [
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  logger.info(`[CHAT] Messages array built with ${messages.length} messages`);
  logger.info('[CHAT] Calling OpenAI API...');

  // Call OpenAI
  const result = await callOpenAI(messages, 'You are a helpful AI assistant.');

  const response = result.content;
  const tokens = result.tokens;

  logger.info('[CHAT] ✓ OpenAI response received');
  logger.info(`[CHAT] Response length: ${response.length} characters`);
  logger.info(`[CHAT] Tokens - Input: ${tokens.input}, Output: ${tokens.output}`);
  logger.info(`[CHAT] ✓ Success: Chat response generated for user ${userId}`);
  logger.info('[CHAT] ========== REQUEST COMPLETE =========');

  res.json({
    response: response,
    tokens: tokens,
  });
});

/**
 * POST /chat/gemini
 * Chat with Google Gemini 2.5 Flash model
 * 
 * Request body:
 * {
 *   "message": "Your message here"
 * }
 * 
 * Response:
 * {
 *   "response": "AI response text",
 *   "tokens": { "input": 10, "output": 20 },
 *   "model": "gemini"
 * }
 */
router.post('/gemini', async (req, res) => {
  const { message } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[CHAT-GEMINI] ========== POST /gemini REQUEST =========');
  logger.info(`[CHAT-GEMINI] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CHAT-GEMINI] User ID: ${userId}`);
  logger.info(`[CHAT-GEMINI] Message length: ${message ? message.length : 0}`);

  // Validate required fields
  logger.info('[CHAT-GEMINI] Validating request body...');
  if (!message) {
    logger.warn('[CHAT-GEMINI] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('[CHAT-GEMINI] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.warn(`[CHAT-GEMINI] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  logger.info('[CHAT-GEMINI] ✓ Request validation passed');

  logger.info('[CHAT-GEMINI] Calling Gemini API with gemini-2.5-flash...');

  // Call Gemini with gemini-2.5-flash model
  const result = await callGemini({
    message,
    model_id: 'gemini-2.5-flash',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 2048,
    system_prompt: 'You are a helpful AI assistant.',
  });

  const response = result.response;
  const inputTokens = result.input_tokens;
  const outputTokens = result.output_tokens;

  logger.info('[CHAT-GEMINI] ✓ Gemini response received');
  logger.info(`[CHAT-GEMINI] Response length: ${response.length} characters`);
  logger.info(`[CHAT-GEMINI] Tokens - Input: ${inputTokens}, Output: ${outputTokens}`);
  logger.info(`[CHAT-GEMINI] ✓ Success: Chat response generated for user ${userId}`);
  logger.info('[CHAT-GEMINI] ========== REQUEST COMPLETE =========');

  res.json({
    response: response,
    tokens: {
      input: inputTokens,
      output: outputTokens,
    },
    model: 'gemini',
  });
});

/**
 * POST /chat/deepseek
 * Chat with Deepseek model using OpenAI-compatible API
 * 
 * Request body:
 * {
 *   "message": "Your message here"
 * }
 * 
 * Response:
 * {
 *   "response": "AI response text",
 *   "tokens": { "input": 10, "output": 20 },
 *   "model": "deepseek"
 * }
 */
router.post('/deepseek', async (req, res) => {
  const { message } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[CHAT-DEEPSEEK] ========== POST /deepseek REQUEST =========');
  logger.info(`[CHAT-DEEPSEEK] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CHAT-DEEPSEEK] User ID: ${userId}`);
  logger.info(`[CHAT-DEEPSEEK] Message length: ${message ? message.length : 0}`);

  // Validate required fields
  logger.info('[CHAT-DEEPSEEK] Validating request body...');
  if (!message) {
    logger.warn('[CHAT-DEEPSEEK] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('[CHAT-DEEPSEEK] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.warn(`[CHAT-DEEPSEEK] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  logger.info('[CHAT-DEEPSEEK] ✓ Request validation passed');

  logger.info('[CHAT-DEEPSEEK] Calling Deepseek API...');

  // Call Deepseek
  const result = await callDeepseek({
    message,
    model_id: 'deepseek-chat',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 2048,
    system_prompt: 'You are a helpful AI assistant.',
  });

  const response = result.response;
  const inputTokens = result.input_tokens;
  const outputTokens = result.output_tokens;

  logger.info('[CHAT-DEEPSEEK] ✓ Deepseek response received');
  logger.info(`[CHAT-DEEPSEEK] Response length: ${response.length} characters`);
  logger.info(`[CHAT-DEEPSEEK] Tokens - Input: ${inputTokens}, Output: ${outputTokens}`);
  logger.info(`[CHAT-DEEPSEEK] ✓ Success: Chat response generated for user ${userId}`);
  logger.info('[CHAT-DEEPSEEK] ========== REQUEST COMPLETE =========');

  res.json({
    response: response,
    tokens: {
      input: inputTokens,
      output: outputTokens,
    },
    model: 'deepseek',
  });
});

/**
 * POST /chat/xai
 * Chat with X.AI Grok-4 model
 * 
 * Request body:
 * {
 *   "message": "Your message here"
 * }
 * 
 * Response:
 * {
 *   "response": "AI response text",
 *   "tokens": { "input": 10, "output": 20 },
 *   "model": "xai"
 * }
 */
router.post('/xai', async (req, res) => {
  const { message } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[CHAT-XAI] ========== POST /xai REQUEST =========');
  logger.info(`[CHAT-XAI] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CHAT-XAI] User ID: ${userId}`);
  logger.info(`[CHAT-XAI] Message length: ${message ? message.length : 0}`);

  // Validate required fields
  logger.info('[CHAT-XAI] Validating request body...');
  if (!message) {
    logger.warn('[CHAT-XAI] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('[CHAT-XAI] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.warn(`[CHAT-XAI] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  logger.info('[CHAT-XAI] ✓ Request validation passed');

  logger.info('[CHAT-XAI] Calling X.AI API with grok-4...');

  // Call X.AI with grok-4 model
  const result = await callXAI({
    message,
    model_id: 'grok-4',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 2048,
    system_prompt: 'You are a helpful AI assistant.',
  });

  const response = result.response;
  const inputTokens = result.tokens.input;
  const outputTokens = result.tokens.output;

  logger.info('[CHAT-XAI] ✓ X.AI response received');
  logger.info(`[CHAT-XAI] Response length: ${response.length} characters`);
  logger.info(`[CHAT-XAI] Tokens - Input: ${inputTokens}, Output: ${outputTokens}`);
  logger.info(`[CHAT-XAI] ✓ Success: Chat response generated for user ${userId}`);
  logger.info('[CHAT-XAI] ========== REQUEST COMPLETE =========');

  res.json({
    response: response,
    tokens: {
      input: inputTokens,
      output: outputTokens,
    },
    model: 'xai',
  });
});

/**
 * POST /chat/unified
 * Unified chat endpoint supporting multiple AI providers
 * 
 * Request body:
 * {
 *   "message": "Your message here",
 *   "model": "openai" | "claude" | "gemini" | "deepseek" | "xai"
 * }
 * 
 * Response:
 * {
 *   "response": "AI response text",
 *   "model": "openai",
 *   "tokens": {
 *     "prompt": 10,
 *     "completion": 20,
 *     "total": 30
 *   },
 *   "timestamp": "2024-01-15T10:30:00.000Z"
 * }
 */
router.post('/unified', async (req, res) => {
  const { message, model } = req.body;
  const userId = req.pocketbaseUserId;
  const requestTimestamp = new Date().toISOString();

  logger.info('[CHAT-UNIFIED] ========== POST /unified REQUEST =========');
  logger.info(`[CHAT-UNIFIED] Timestamp: ${requestTimestamp}`);
  logger.info(`[CHAT-UNIFIED] User ID: ${userId}`);
  logger.info(`[CHAT-UNIFIED] Message length: ${message ? message.length : 0}`);
  logger.info(`[CHAT-UNIFIED] Requested model: ${model}`);

  // Validate required fields
  logger.info('[CHAT-UNIFIED] Validating request body...');
  if (!message) {
    logger.warn('[CHAT-UNIFIED] ❌ Missing message in request body');
    return res.status(400).json({ error: 'message is required' });
  }

  if (!model) {
    logger.warn('[CHAT-UNIFIED] ❌ Missing model in request body');
    return res.status(400).json({ error: 'model is required' });
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('[CHAT-UNIFIED] ❌ Message is not a valid non-empty string');
    return res.status(400).json({ error: 'message must be a non-empty string' });
  }

  if (message.length > 4000) {
    logger.warn(`[CHAT-UNIFIED] ❌ Message exceeds max length: ${message.length} > 4000`);
    return res.status(400).json({ error: 'message exceeds maximum length of 4000 characters' });
  }

  const validModels = ['openai', 'claude', 'gemini', 'deepseek', 'xai'];
  if (!validModels.includes(model)) {
    logger.warn(`[CHAT-UNIFIED] ❌ Invalid model: ${model}`);
    return res.status(400).json({
      error: 'Invalid model. Must be one of: ' + validModels.join(', '),
    });
  }

  logger.info('[CHAT-UNIFIED] ✓ Request validation passed');

  // Build messages array
  const messages = [{ role: 'user', content: message }];
  const systemPrompt = 'You are a helpful AI assistant.';

  let response;
  let tokens = { prompt: 0, completion: 0, total: 0 };
  let selectedModel = model;

  logger.info(`[CHAT-UNIFIED] Routing to provider: ${model}`);

  if (model === 'openai') {
    logger.info('[CHAT-UNIFIED] Calling OpenAI API with gpt-4o...');
    const result = await callOpenAI(messages, systemPrompt);
    response = result.content;
    tokens = {
      prompt: result.tokens.input,
      completion: result.tokens.output,
      total: result.tokens.input + result.tokens.output,
    };
    selectedModel = 'gpt-4o';
    logger.info(`[CHAT-UNIFIED] ✓ OpenAI response received: ${tokens.total} tokens`);
  } else if (model === 'claude') {
    logger.info('[CHAT-UNIFIED] Calling Anthropic API with claude-3-5-sonnet...');
    const result = await callAnthropic({
      message: message,
      model_id: 'claude-3-5-sonnet',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 2048,
      system_prompt: systemPrompt,
    });
    response = result.response;
    tokens = {
      prompt: result.input_tokens,
      completion: result.output_tokens,
      total: result.input_tokens + result.output_tokens,
    };
    selectedModel = 'claude-3-5-sonnet';
    logger.info(`[CHAT-UNIFIED] ✓ Anthropic response received: ${tokens.total} tokens`);
  } else if (model === 'gemini') {
    logger.info('[CHAT-UNIFIED] Calling Google Generative AI with gemini-2.5-flash...');
    const result = await callGemini({
      message: message,
      model_id: 'gemini-2.5-flash',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 2048,
      system_prompt: systemPrompt,
    });
    response = result.response;
    tokens = {
      prompt: result.input_tokens,
      completion: result.output_tokens,
      total: result.input_tokens + result.output_tokens,
    };
    selectedModel = 'gemini-2.5-flash';
    logger.info(`[CHAT-UNIFIED] ✓ Gemini response received: ${tokens.total} tokens`);
  } else if (model === 'deepseek') {
    logger.info('[CHAT-UNIFIED] Calling Deepseek API with deepseek-chat...');
    const result = await callDeepseek({
      message: message,
      model_id: 'deepseek-chat',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 2048,
      system_prompt: systemPrompt,
    });
    response = result.response;
    tokens = {
      prompt: result.input_tokens,
      completion: result.output_tokens,
      total: result.input_tokens + result.output_tokens,
    };
    selectedModel = 'deepseek-chat';
    logger.info(`[CHAT-UNIFIED] ✓ Deepseek response received: ${tokens.total} tokens`);
  } else if (model === 'xai') {
    logger.info('[CHAT-UNIFIED] Calling X.AI API with grok-4...');
    const result = await callXAI({
      message: message,
      model_id: 'grok-4',
      temperature: 0.7,
      top_p: 1.0,
      max_tokens: 2048,
      system_prompt: systemPrompt,
    });
    response = result.response;
    tokens = {
      prompt: result.tokens.input,
      completion: result.tokens.output,
      total: result.tokens.input + result.tokens.output,
    };
    selectedModel = 'grok-4';
    logger.info(`[CHAT-UNIFIED] ✓ X.AI response received: ${tokens.total} tokens`);
  }

  if (!response) {
    logger.error('[CHAT-UNIFIED] ❌ No response received from provider');
    throw new Error('No response received from AI provider');
  }

  logger.info(`[CHAT-UNIFIED] ✓ Success: Generated response using ${selectedModel}`);
  logger.info(`[CHAT-UNIFIED] Response length: ${response.length} characters`);
  logger.info('[CHAT-UNIFIED] ========== REQUEST COMPLETE =========');

  res.json({
    response: response,
    model: selectedModel,
    tokens: tokens,
    timestamp: requestTimestamp,
  });
});

/**
 * GET /chat/test
 * Test OpenAI API connection
 * 
 * Response:
 * {
 *   "success": true/false,
 *   "message": "Test message",
 *   "error": null or error message
 * }
 */
router.get('/test', async (req, res) => {
  logger.info('[CHAT-TEST] ========== GET /test REQUEST =========');
  logger.info(`[CHAT-TEST] Timestamp: ${new Date().toISOString()}`);
  logger.info('[CHAT-TEST] Testing OpenAI API connection...');

  const result = await callOpenAI(
    [{ role: 'user', content: 'Say hello in one word' }],
    'You are a helpful assistant.'
  );

  logger.info('[CHAT-TEST] ✓ Test call successful');
  logger.info(`[CHAT-TEST] Response: ${result.content}`);
  logger.info(`[CHAT-TEST] Tokens - Input: ${result.tokens.input}, Output: ${result.tokens.output}`);
  logger.info('[CHAT-TEST] ========== TEST COMPLETE =========');

  res.json({
    success: true,
    message: 'OpenAI API connection successful',
    response: result.content,
    tokens: result.tokens,
    error: null,
  });
});

export default router;