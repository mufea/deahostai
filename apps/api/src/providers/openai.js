import 'dotenv/config';
import OpenAI from 'openai';
import logger from '../utils/logger.js';

let openaiClient = null;

/**
 * Initialize and return OpenAI client
 * @returns {OpenAI} Initialized OpenAI client
 * @throws {Error} If OPENAI_API_KEY is not configured
 */
export function getOpenAIClient() {
  if (openaiClient) {
    logger.info('[OPENAI] Using cached OpenAI client');
    return openaiClient;
  }

  logger.info('[OPENAI] Initializing OpenAI client...');
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error('[OPENAI] OPENAI_API_KEY is not configured in environment variables');
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (apiKey.trim().length === 0) {
    logger.error('[OPENAI] OPENAI_API_KEY is empty');
    throw new Error('OPENAI_API_KEY is empty');
  }

  try {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
    logger.info('[OPENAI] ✓ OpenAI client initialized successfully');
    return openaiClient;
  } catch (error) {
    logger.error('[OPENAI] Failed to initialize OpenAI client: ' + error.message);
    logger.error('[OPENAI] Error stack: ' + error.stack);
    throw error;
  }
}

/**
 * Call OpenAI Chat API
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<{content: string, tokens: {input: number, output: number}}>}
 * @throws {Error} If API call fails
 */
export async function callOpenAI(messages, systemPrompt = null) {
  logger.info('[OPENAI] ========== CALLING OPENAI API =========');
  logger.info('[OPENAI] Timestamp: ' + new Date().toISOString());
  logger.info('[OPENAI] Messages count: ' + messages.length);
  logger.info('[OPENAI] System prompt provided: ' + (systemPrompt ? 'yes' : 'no'));

  let client;
  try {
    client = getOpenAIClient();
  } catch (error) {
    logger.error('[OPENAI] Failed to get OpenAI client: ' + error.message);
    throw error;
  }

  try {
    // Build messages array with system prompt if provided
    const messagesArray = [];
    if (systemPrompt) {
      messagesArray.push({
        role: 'system',
        content: systemPrompt,
      });
      logger.info('[OPENAI] Added system message to array');
    }
    messagesArray.push(...messages);
    logger.info('[OPENAI] Final messages array length: ' + messagesArray.length);

    // Validate message structure
    for (let i = 0; i < messagesArray.length; i++) {
      const msg = messagesArray[i];
      if (!msg.role || !msg.content) {
        logger.error('[OPENAI] Invalid message structure at index ' + i);
        throw new Error('Invalid message structure: missing role or content');
      }
    }

    logger.info('[OPENAI] Calling client.chat.completions.create()...');
    logger.info('[OPENAI] Model: gpt-4o, Temperature: 0.7, Max Tokens: 2000');

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messagesArray,
      temperature: 0.7,
      max_tokens: 2000,
    });

    logger.info('[OPENAI] ✓ Response received from OpenAI');
    logger.info('[OPENAI] Response timestamp: ' + new Date().toISOString());

    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      logger.error('[OPENAI] No choices in response');
      throw new Error('No response from OpenAI API');
    }

    const choice = response.choices[0];
    if (!choice.message || !choice.message.content) {
      logger.error('[OPENAI] No message content in response');
      throw new Error('No message content in response');
    }

    const content = choice.message.content;
    const inputTokens = response.usage.prompt_tokens;
    const outputTokens = response.usage.completion_tokens;

    logger.info('[OPENAI] ✓ Response parsed successfully');
    logger.info('[OPENAI] Input tokens: ' + inputTokens);
    logger.info('[OPENAI] Output tokens: ' + outputTokens);
    logger.info('[OPENAI] Content length: ' + content.length + ' characters');
    logger.info('[OPENAI] ========== OPENAI API CALL COMPLETE =========');

    return {
      content: content,
      tokens: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  } catch (error) {
    logger.error('[OPENAI] ❌ API call failed');
    logger.error('[OPENAI] Error message: ' + error.message);
    logger.error('[OPENAI] Error type: ' + error.constructor.name);
    logger.error('[OPENAI] Error status: ' + (error.status || 'unknown'));
    logger.error('[OPENAI] Error stack: ' + error.stack);

    // Provide specific error messages
    if (error.status === 401) {
      logger.error('[OPENAI] Authentication failed - Invalid API key');
      throw new Error('OpenAI API error: Invalid API key (401 Unauthorized)');
    } else if (error.status === 429) {
      logger.error('[OPENAI] Rate limit exceeded');
      throw new Error('OpenAI API error: Rate limit exceeded (429)');
    } else if (error.status === 500) {
      logger.error('[OPENAI] OpenAI server error');
      throw new Error('OpenAI API error: Server error (500)');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('[OPENAI] Connection refused - Cannot reach OpenAI API');
      throw new Error('OpenAI API error: Connection refused');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('[OPENAI] Request timeout');
      throw new Error('OpenAI API error: Request timeout');
    } else {
      throw new Error('OpenAI API error: ' + error.message);
    }
  }
}

/**
 * Generate image using DALL-E 3
 * @param {string} prompt - Image description
 * @param {string} size - Image size (1024x1024, 1792x1024, 1024x1792)
 * @param {string} quality - Image quality (standard, hd)
 * @returns {Promise<{imageUrl: string, revisedPrompt: string}>}
 * @throws {Error} If validation fails or API call fails
 */
export async function generateImageOpenAI(prompt, size = '1024x1024', quality = 'standard') {
  logger.info('[OPENAI] ========== GENERATING IMAGE WITH DALL-E 3 =========');
  logger.info('[OPENAI] Timestamp: ' + new Date().toISOString());
  logger.info('[OPENAI] Prompt length: ' + (prompt ? prompt.length : 0));
  logger.info('[OPENAI] Size: ' + size + ', Quality: ' + quality);

  // Validate prompt
  if (!prompt) {
    logger.error('[OPENAI] ❌ Prompt is required');
    throw new Error('Prompt is required');
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.error('[OPENAI] ❌ Prompt must be a non-empty string');
    throw new Error('Prompt must be a non-empty string');
  }

  if (prompt.length > 4000) {
    logger.error('[OPENAI] ❌ Prompt exceeds maximum length: ' + prompt.length + ' > 4000');
    throw new Error('Prompt exceeds maximum length of 4000 characters');
  }

  // Validate size
  const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
  if (!validSizes.includes(size)) {
    logger.error('[OPENAI] ❌ Invalid size: ' + size);
    throw new Error('Invalid size. Must be one of: ' + validSizes.join(', '));
  }

  // Validate quality
  const validQualities = ['standard', 'hd'];
  if (!validQualities.includes(quality)) {
    logger.error('[OPENAI] ❌ Invalid quality: ' + quality);
    throw new Error('Invalid quality. Must be one of: ' + validQualities.join(', '));
  }

  logger.info('[OPENAI] ✓ Validation passed');

  let client;
  try {
    client = getOpenAIClient();
  } catch (error) {
    logger.error('[OPENAI] Failed to get OpenAI client: ' + error.message);
    throw error;
  }

  try {
    logger.info('[OPENAI] Calling client.images.generate()...');
    logger.info('[OPENAI] Model: dall-e-3, Size: ' + size + ', Quality: ' + quality);

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: size,
      quality: quality,
      n: 1,
    });

    logger.info('[OPENAI] ✓ Response received from DALL-E 3');
    logger.info('[OPENAI] Response timestamp: ' + new Date().toISOString());

    // Validate response structure
    if (!response.data || response.data.length === 0) {
      logger.error('[OPENAI] No image data in response');
      throw new Error('No image data in response');
    }

    const imageData = response.data[0];
    if (!imageData.url) {
      logger.error('[OPENAI] No image URL in response');
      throw new Error('No image URL in response');
    }

    const imageUrl = imageData.url;
    const revisedPrompt = imageData.revised_prompt || prompt;

    logger.info('[OPENAI] ✓ Image generated successfully');
    logger.info('[OPENAI] Image URL: ' + imageUrl.substring(0, 50) + '...');
    logger.info('[OPENAI] Revised prompt length: ' + revisedPrompt.length);
    logger.info('[OPENAI] ========== IMAGE GENERATION COMPLETE =========');

    return {
      imageUrl: imageUrl,
      revisedPrompt: revisedPrompt,
    };
  } catch (error) {
    logger.error('[OPENAI] ❌ Image generation failed');
    logger.error('[OPENAI] Error message: ' + error.message);
    logger.error('[OPENAI] Error type: ' + error.constructor.name);
    logger.error('[OPENAI] Error status: ' + (error.status || 'unknown'));
    logger.error('[OPENAI] Error stack: ' + error.stack);

    // Provide specific error messages
    if (error.status === 401) {
      logger.error('[OPENAI] Authentication failed - Invalid API key');
      throw new Error('OpenAI API error: Invalid API key (401 Unauthorized)');
    } else if (error.status === 429) {
      logger.error('[OPENAI] Rate limit exceeded');
      throw new Error('OpenAI API error: Rate limit exceeded (429)');
    } else if (error.status === 500) {
      logger.error('[OPENAI] OpenAI server error');
      throw new Error('OpenAI API error: Server error (500)');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('[OPENAI] Connection refused - Cannot reach OpenAI API');
      throw new Error('OpenAI API error: Connection refused');
    } else if (error.code === 'ETIMEDOUT') {
      logger.error('[OPENAI] Request timeout');
      throw new Error('OpenAI API error: Request timeout');
    } else {
      throw new Error('OpenAI API error: ' + error.message);
    }
  }
}