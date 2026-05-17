import 'dotenv/config';
import logger from '../utils/logger.js';

/**
 * Call X.AI Grok API
 * @param {object} params - Request parameters
 * @param {string} params.message - User message
 * @param {string} params.model_id - Model ID (e.g., 'grok-4')
 * @param {number} params.temperature - Temperature (0-2)
 * @param {number} params.top_p - Top P (0-1)
 * @param {number} params.max_tokens - Max output tokens
 * @param {string} params.system_prompt - Optional system prompt
 * @returns {Promise<{response: string, tokens: {input: number, output: number}}>}
 * @throws {Error} If API call fails
 */
export async function callXAI({ message, model_id, temperature, top_p, max_tokens, system_prompt }) {
  logger.info('[XAI] ========== CALLING X.AI API =========');
  logger.info(`[XAI] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[XAI] Model: ${model_id}`);
  logger.info(`[XAI] Message length: ${message ? message.length : 0} characters`);
  logger.info(`[XAI] Temperature: ${temperature}, Top P: ${top_p}, Max Tokens: ${max_tokens}`);

  if (!process.env.XAI_API_KEY) {
    logger.error('[XAI] XAI_API_KEY is not configured');
    throw new Error('XAI_API_KEY is not configured');
  }

  const apiKey = process.env.XAI_API_KEY;
  if (apiKey.trim().length === 0) {
    logger.error('[XAI] XAI_API_KEY is empty');
    throw new Error('XAI_API_KEY is empty');
  }

  logger.info('[XAI] Building request payload...');
  const messages = [];
  
  if (system_prompt) {
    messages.push({
      role: 'system',
      content: system_prompt,
    });
    logger.info(`[XAI] Added system message, length: ${system_prompt.length}`);
  }
  
  messages.push({
    role: 'user',
    content: message,
  });
  logger.info(`[XAI] Messages array built: ${messages.length} messages`);

  logger.info('[XAI] Calling X.AI API endpoint...');
  logger.info(`[XAI] Endpoint: https://api.x.ai/v1/chat/completions`);
  logger.info(`[XAI] Request: model=${model_id}, temp=${temperature}, top_p=${top_p}, max_tokens=${max_tokens}`);

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model_id,
      messages: messages,
      temperature: temperature,
      top_p: top_p,
      max_tokens: max_tokens,
    }),
    timeout: 30000,
  });

  logger.info(`[XAI] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[XAI] ❌ API call failed`);
    logger.error(`[XAI] Error status: ${response.status}`);
    logger.error(`[XAI] Error response: ${errorText}`);

    // Provide specific error messages
    if (response.status === 401) {
      logger.error('[XAI] Authentication failed - Invalid API key');
      throw new Error('X.AI API error: Invalid API key (401 Unauthorized)');
    } else if (response.status === 429) {
      logger.error('[XAI] Rate limit exceeded');
      throw new Error('X.AI API error: Rate limit exceeded (429)');
    } else if (response.status === 500) {
      logger.error('[XAI] X.AI server error');
      throw new Error('X.AI API error: Server error (500)');
    } else {
      throw new Error(`X.AI API error: ${response.status} ${response.statusText}`);
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    logger.error(`[XAI] Failed to parse response JSON: ${error.message}`);
    throw new Error('X.AI API error: Invalid response format');
  }

  logger.info('[XAI] ✓ Response received from X.AI API');
  logger.info(`[XAI] Response timestamp: ${new Date().toISOString()}`);

  // Validate response structure
  if (!data.choices || data.choices.length === 0) {
    logger.error('[XAI] No choices in response');
    throw new Error('X.AI API error: No response content');
  }

  const choice = data.choices[0];
  if (!choice.message || !choice.message.content) {
    logger.error('[XAI] No message content in response');
    throw new Error('X.AI API error: No message content in response');
  }

  const content = choice.message.content;
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  logger.info('[XAI] ✓ Response parsed successfully');
  logger.info(`[XAI] Input tokens: ${inputTokens}`);
  logger.info(`[XAI] Output tokens: ${outputTokens}`);
  logger.info(`[XAI] Content length: ${content.length} characters`);
  logger.info('[XAI] ========== X.AI API CALL COMPLETE =========');

  return {
    response: content,
    tokens: {
      input: inputTokens,
      output: outputTokens,
    },
  };
}