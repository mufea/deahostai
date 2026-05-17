import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

let genAI = null;

/**
 * Initialize and return Google Generative AI client
 * @returns {GoogleGenerativeAI} Initialized client
 * @throws {Error} If GOOGLE_GEMINI_API_KEY is not configured
 */
function getGeminiClient() {
  if (genAI) {
    logger.info('[GEMINI] Using cached Gemini client');
    return genAI;
  }

  logger.info('[GEMINI] Initializing Gemini client...');
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    logger.error('[GEMINI] GOOGLE_GEMINI_API_KEY is not configured in environment variables');
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
  }

  if (apiKey.trim().length === 0) {
    logger.error('[GEMINI] GOOGLE_GEMINI_API_KEY is empty');
    throw new Error('GOOGLE_GEMINI_API_KEY is empty');
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    logger.info('[GEMINI] ✓ Gemini client initialized successfully');
    return genAI;
  } catch (error) {
    logger.error('[GEMINI] Failed to initialize Gemini client: ' + error.message);
    logger.error('[GEMINI] Error stack: ' + error.stack);
    throw error;
  }
}

/**
 * Call Google Gemini API
 * @param {object} params - Request parameters
 * @param {string} params.message - User message
 * @param {string} params.model_id - Model ID (e.g., 'gemini-2.5-flash')
 * @param {number} params.temperature - Temperature (0-2)
 * @param {number} params.top_p - Top P (0-1)
 * @param {number} params.max_tokens - Max output tokens
 * @param {string} params.system_prompt - Optional system prompt
 * @returns {Promise<{response: string, input_tokens: number, output_tokens: number}>}
 * @throws {Error} If API call fails
 */
export async function callGemini({ message, model_id, temperature, top_p, max_tokens, system_prompt }) {
  logger.info('[GEMINI] ========== CALLING GEMINI API =========');
  logger.info(`[GEMINI] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[GEMINI] Model: ${model_id}`);
  logger.info(`[GEMINI] Message length: ${message ? message.length : 0} characters`);
  logger.info(`[GEMINI] Temperature: ${temperature}, Top P: ${top_p}, Max Tokens: ${max_tokens}`);
  
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    logger.error('[GEMINI] GOOGLE_GEMINI_API_KEY is not configured');
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
  }

  let client;
  try {
    client = getGeminiClient();
  } catch (error) {
    logger.error('[GEMINI] Failed to get Gemini client: ' + error.message);
    throw error;
  }

  try {
    logger.info(`[GEMINI] Creating generative model: model=${model_id}`);
    const model = client.getGenerativeModel({
      model: model_id,
      systemInstruction: system_prompt || 'You are a helpful AI assistant.',
    });
    
    logger.info(`[GEMINI] Generating content: temp=${temperature}, topP=${top_p}, maxTokens=${max_tokens}`);
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: {
        temperature,
        topP: top_p,
        maxOutputTokens: max_tokens,
      },
    });

    logger.info('[GEMINI] ✓ Response received from Gemini API');
    logger.info(`[GEMINI] Response timestamp: ${new Date().toISOString()}`);

    if (!response.response || !response.response.candidates || response.response.candidates.length === 0) {
      logger.error('[GEMINI] No candidates in response');
      throw new Error('No response from Gemini API');
    }

    const content = response.response.candidates[0].content.parts[0].text;
    const usageMetadata = response.response.usageMetadata;
    const input_tokens = usageMetadata.promptTokenCount || 0;
    const output_tokens = usageMetadata.candidatesTokenCount || 0;

    logger.info('[GEMINI] ✓ Response parsed successfully');
    logger.info(`[GEMINI] Input tokens: ${input_tokens}`);
    logger.info(`[GEMINI] Output tokens: ${output_tokens}`);
    logger.info(`[GEMINI] Content length: ${content.length} characters`);
    logger.info('[GEMINI] ========== GEMINI API CALL COMPLETE =========');

    return { response: content, input_tokens, output_tokens };
  } catch (error) {
    logger.error('[GEMINI] ❌ API call failed');
    logger.error('[GEMINI] Error message: ' + error.message);
    logger.error('[GEMINI] Error type: ' + error.constructor.name);
    logger.error('[GEMINI] Error status: ' + (error.status || 'unknown'));
    logger.error('[GEMINI] Error stack: ' + error.stack);

    // Provide specific error messages
    if (error.message && error.message.includes('401')) {
      logger.error('[GEMINI] Authentication failed - Invalid API key');
      throw new Error('Gemini API error: Invalid API key (401 Unauthorized)');
    } else if (error.message && error.message.includes('429')) {
      logger.error('[GEMINI] Rate limit exceeded');
      throw new Error('Gemini API error: Rate limit exceeded (429)');
    } else if (error.message && error.message.includes('500')) {
      logger.error('[GEMINI] Gemini server error');
      throw new Error('Gemini API error: Server error (500)');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('[GEMINI] Connection refused - Cannot reach Gemini API');
      throw new Error('Gemini API error: Connection refused');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('[GEMINI] Request timeout');
      throw new Error('Gemini API error: Request timeout');
    } else {
      throw new Error('Gemini API error: ' + error.message);
    }
  }
}