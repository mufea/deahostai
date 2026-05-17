import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

let anthropicClient = null;

/**
 * Initialize and return Anthropic client
 * @returns {Anthropic} Initialized Anthropic client
 * @throws {Error} If ANTHROPIC_API_KEY is not configured
 */
function getAnthropicClient() {
  if (anthropicClient) {
    logger.info('[ANTHROPIC] Using cached Anthropic client');
    return anthropicClient;
  }

  logger.info('[ANTHROPIC] Initializing Anthropic client...');
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    logger.error('[ANTHROPIC] ANTHROPIC_API_KEY is not configured in environment variables');
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  if (apiKey.trim().length === 0) {
    logger.error('[ANTHROPIC] ANTHROPIC_API_KEY is empty');
    throw new Error('ANTHROPIC_API_KEY is empty');
  }

  try {
    anthropicClient = new Anthropic({
      apiKey: apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
    logger.info('[ANTHROPIC] ✓ Anthropic client initialized successfully');
    return anthropicClient;
  } catch (error) {
    logger.error('[ANTHROPIC] Failed to initialize Anthropic client: ' + error.message);
    logger.error('[ANTHROPIC] Error stack: ' + error.stack);
    throw error;
  }
}

export async function callAnthropic({ message, model_id, temperature, top_p, max_tokens, system_prompt }) {
  logger.info('[ANTHROPIC] ========== CALLING ANTHROPIC API =========');
  logger.info(`[ANTHROPIC] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[ANTHROPIC] Model: ${model_id}`);
  logger.info(`[ANTHROPIC] Message length: ${message ? message.length : 0} characters`);
  logger.info(`[ANTHROPIC] Temperature: ${temperature}, Top P: ${top_p}, Max Tokens: ${max_tokens}`);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.error('[ANTHROPIC] ANTHROPIC_API_KEY is not configured');
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  let client;
  try {
    client = getAnthropicClient();
  } catch (error) {
    logger.error('[ANTHROPIC] Failed to get Anthropic client: ' + error.message);
    throw error;
  }

  logger.info('[ANTHROPIC] Building request payload...');
  logger.info(`[ANTHROPIC] System prompt length: ${system_prompt ? system_prompt.length : 0}`);
  logger.info('[ANTHROPIC] Creating message with Anthropic API...');
  
  const response = await client.messages.create({
    model: model_id,
    max_tokens: max_tokens,
    system: system_prompt || 'You are a helpful AI assistant.',
    messages: [
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: temperature,
    top_p: top_p,
  });

  logger.info('[ANTHROPIC] ✓ Response received from Anthropic API');
  logger.info(`[ANTHROPIC] Response timestamp: ${new Date().toISOString()}`);
  logger.info(`[ANTHROPIC] Stop reason: ${response.stop_reason}`);

  if (!response.content || response.content.length === 0) {
    logger.error('[ANTHROPIC] No content in response');
    throw new Error('No response from Anthropic API');
  }

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const input_tokens = response.usage.input_tokens;
  const output_tokens = response.usage.output_tokens;

  logger.info('[ANTHROPIC] ✓ Response parsed successfully');
  logger.info(`[ANTHROPIC] Input tokens: ${input_tokens}`);
  logger.info(`[ANTHROPIC] Output tokens: ${output_tokens}`);
  logger.info(`[ANTHROPIC] Content length: ${content.length} characters`);
  logger.info('[ANTHROPIC] ========== ANTHROPIC API CALL COMPLETE =========');

  return { response: content, input_tokens, output_tokens };
}