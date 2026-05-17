import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { callOpenAI } from '../providers/openai.js';

const router = express.Router();

router.use(pocketbaseAuth);

/**
 * POST /code
 * Generate code using OpenAI GPT-4o
 * 
 * Request body:
 * {
 *   "prompt": "Create a function that calculates fibonacci",
 *   "language": "javascript",
 *   "framework": "node"
 * }
 * 
 * Response:
 * {
 *   "code": "function fibonacci(n) { ... }",
 *   "explanation": "This function calculates...",
 *   "language": "javascript"
 * }
 */
router.post('/', async (req, res) => {
  const requestId = `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { prompt, language = 'javascript', framework } = req.body;
  const userId = req.pocketbaseUserId;

  logger.info('[CODE] ========== POST / REQUEST =========');
  logger.info(`[CODE] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CODE] Request ID: ${requestId}`);
  logger.info(`[CODE] User ID: ${userId}`);
  logger.info(`[CODE] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[CODE] Language: ${language}, Framework: ${framework || 'none'}`);
  logger.info(`[CODE] Request body: ${JSON.stringify({ prompt: prompt?.substring(0, 50) + '...', language, framework })}`);

  // Validate required fields
  logger.info('[CODE] Validating request body...');
  if (!prompt) {
    logger.warn('[CODE] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[CODE] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 2000) {
    logger.warn(`[CODE] ❌ Prompt exceeds max length: ${prompt.length} > 2000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 2000 characters' });
  }

  if (typeof language !== 'string' || language.trim().length === 0) {
    logger.warn('[CODE] ❌ Language is not a valid non-empty string');
    return res.status(400).json({ error: 'language must be a non-empty string' });
  }

  logger.info('[CODE] ✓ Request validation passed');

  logger.info(`[CODE] Validating user: ${userId}`);
  const user = await pocketbaseClient.collection('users').getOne(userId).catch((error) => {
    logger.error(`[CODE] Failed to fetch user: ${error.message}`);
    return null;
  });

  if (!user) {
    logger.error(`[CODE] ❌ User not found: ${userId}`);
    throw new Error('User not found');
  }

  logger.info(`[CODE] ✓ User verified: ${user.email}`);

  // Build code generation prompt
  const systemPrompt = `You are an expert code generator. Generate clean, production-ready code based on the user request. Use ${language} as the programming language${framework ? ` with ${framework} framework` : ''}. Include helpful comments. Return ONLY the code without any markdown formatting, backticks, or explanatory text.`;

  const userMessage = `Generate code for: ${prompt}`;

  logger.info(`[CODE] Calling OpenAI GPT-4o for code generation: language=${language}${framework ? `, framework=${framework}` : ''}`);
  logger.info('[CODE] Request parameters: model=gpt-4o, temperature=0.5, top_p=1.0, max_tokens=2048');

  // Call OpenAI for code generation
  const result = await callOpenAI({
    message: userMessage,
    model_id: 'gpt-4o',
    temperature: 0.5,
    top_p: 1.0,
    max_tokens: 2048,
    system_prompt: systemPrompt,
  });

  const code = result.response;
  const tokensUsed = result.input_tokens + result.output_tokens;

  logger.info(`[CODE] ✓ Code generated successfully: ${tokensUsed} tokens, ${code.length} characters`);

  // Generate explanation
  logger.info('[CODE] Generating explanation for code');
  const explanationResult = await callOpenAI({
    message: `Briefly explain this code in 2-3 sentences: ${code.substring(0, 500)}`,
    model_id: 'gpt-4o',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 256,
    system_prompt: 'You are a code explanation assistant. Provide clear, concise explanations.',
  });

  const explanation = explanationResult.response;

  logger.info(`[CODE] ✓ Explanation generated: ${explanation.length} characters`);

  // Store code record in PocketBase if collection exists
  try {
    await pocketbaseClient.collection('_integratedAiCode').create({
      user_id: userId,
      model_id: 'gpt-4o',
      prompt,
      generated_code: code,
      explanation,
      language,
      framework: framework || null,
    });
    logger.info('[CODE] ✓ Code record stored in PocketBase');
  } catch (error) {
    logger.warn(`[CODE] Failed to store code record: ${error.message}`);
    // Don't throw - this is not critical
  }

  logger.info(`[CODE] ✓ Success: Code generated for user ${userId}`);
  logger.info('[CODE] ========== REQUEST COMPLETE =========');

  res.json({
    code,
    explanation,
    language,
    framework: framework || null,
  });
});

export default router;