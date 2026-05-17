import 'dotenv/config';
import express from 'express';
import logger from '../utils/logger.js';
import { callOpenAI, generateImageOpenAI } from '../providers/openai.js';

const router = express.Router();

/**
 * GET /test-openai
 * Test OpenAI API connection with both chat and image generation
 * No authentication required - for testing purposes only
 * 
 * Response:
 * {
 *   "success": true/false,
 *   "chat": { "message": string, "model": string } or null,
 *   "image": { "imageUrl": string, "revisedPrompt": string } or null,
 *   "error": null or error message
 * }
 */
router.get('/', async (req, res) => {
  logger.info('[TEST-OPENAI] ========== OPENAI API TEST =========');
  logger.info(`[TEST-OPENAI] Timestamp: ${new Date().toISOString()}`);
  logger.info('[TEST-OPENAI] Testing OpenAI API connection...');

  let chatResult = null;
  let imageResult = null;
  let errorMessage = null;
  let overallSuccess = true;

  // Test 1: Chat Completion
  logger.info('[TEST-OPENAI] ========== TEST 1: CHAT COMPLETION =========');
  try {
    logger.info('[TEST-OPENAI] Calling OpenAI chat API...');
    const result = await callOpenAI(
      [{ role: 'user', content: 'Say hello in one word' }],
      'You are a helpful assistant.'
    );

    logger.info('[TEST-OPENAI] ✓ Chat completion successful');
    logger.info(`[TEST-OPENAI] Response: ${result.content}`);
    logger.info(`[TEST-OPENAI] Tokens: input=${result.tokens.input}, output=${result.tokens.output}`);

    chatResult = {
      message: result.content,
      model: 'gpt-4o',
      tokens: result.tokens,
    };
  } catch (error) {
    logger.error('[TEST-OPENAI] ❌ Chat completion failed');
    logger.error(`[TEST-OPENAI] Error: ${error.message}`);
    errorMessage = error.message;
    overallSuccess = false;
  }

  // Test 2: Image Generation
  logger.info('[TEST-OPENAI] ========== TEST 2: IMAGE GENERATION =========');
  try {
    logger.info('[TEST-OPENAI] Calling generateImageOpenAI...');
    const result = await generateImageOpenAI(
      'A beautiful sunset over mountains',
      '1024x1024',
      'standard'
    );

    logger.info('[TEST-OPENAI] ✓ Image generation successful');
    logger.info(`[TEST-OPENAI] Image URL: ${result.imageUrl.substring(0, 50)}...`);
    logger.info(`[TEST-OPENAI] Revised prompt: ${result.revisedPrompt.substring(0, 50)}...`);

    imageResult = {
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
      model: 'dall-e-3',
    };
  } catch (error) {
    logger.error('[TEST-OPENAI] ❌ Image generation failed');
    logger.error(`[TEST-OPENAI] Error: ${error.message}`);
    if (!errorMessage) {
      errorMessage = error.message;
    }
    overallSuccess = false;
  }

  logger.info('[TEST-OPENAI] ========== TEST COMPLETE =========');
  logger.info(`[TEST-OPENAI] Overall success: ${overallSuccess}`);

  res.json({
    success: overallSuccess,
    chat: chatResult,
    image: imageResult,
    error: errorMessage,
  });
});

export default router;