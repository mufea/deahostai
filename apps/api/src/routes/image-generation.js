import 'dotenv/config';
import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// NOTE: Removed pocketbaseAuth middleware to allow image generation without authentication
// API key validation for each provider is still enforced

/**
 * POST /dalle3
 * Generate image using DALL-E 3
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "1024x1024",
 *   "quality": "hd"
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "model": "dall-e-3",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/dalle3', async (req, res) => {
  const { prompt, size = '1024x1024', quality = 'hd' } = req.body;

  logger.info('[IMAGE-DALLE3] ========== POST /dalle3 REQUEST =========');
  logger.info(`[IMAGE-DALLE3] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-DALLE3] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-DALLE3] Size: ${size}, Quality: ${quality}`);

  // Validate required fields
  if (!prompt) {
    logger.warn('[IMAGE-DALLE3] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-DALLE3] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-DALLE3] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  // Validate size
  const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
  if (!validSizes.includes(size)) {
    logger.warn(`[IMAGE-DALLE3] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
    });
  }

  // Validate quality
  const validQualities = ['standard', 'hd'];
  if (!validQualities.includes(quality)) {
    logger.warn(`[IMAGE-DALLE3] ❌ Invalid quality: ${quality}`);
    return res.status(400).json({
      error: `Invalid quality. Must be one of: ${validQualities.join(', ')}`,
    });
  }

  logger.info('[IMAGE-DALLE3] ✓ Request validation passed');

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error('[IMAGE-DALLE3] ❌ OPENAI_API_KEY is not configured');
    throw new Error('OPENAI_API_KEY is not configured');
  }

  logger.info('[IMAGE-DALLE3] Calling OpenAI DALL-E 3 API...');
  logger.info(`[IMAGE-DALLE3] Endpoint: https://api.openai.com/v1/images/generations`);
  logger.info(`[IMAGE-DALLE3] Model: dall-e-3, Size: ${size}, Quality: ${quality}`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      size: size,
      quality: quality,
      n: 1,
    }),
  });

  logger.info(`[IMAGE-DALLE3] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[IMAGE-DALLE3] ❌ API call failed`);
    logger.error(`[IMAGE-DALLE3] Error status: ${response.status}`);
    logger.error(`[IMAGE-DALLE3] Error response: ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    logger.error(`[IMAGE-DALLE3] Failed to parse response JSON: ${error.message}`);
    throw new Error('Invalid response from OpenAI API');
  }

  logger.info('[IMAGE-DALLE3] ✓ Response received from OpenAI');

  if (!data.data || data.data.length === 0) {
    logger.error('[IMAGE-DALLE3] No image data in response');
    throw new Error('No image data in response');
  }

  const imageUrl = data.data[0].url;
  const revisedPrompt = data.data[0].revised_prompt || prompt;

  logger.info(`[IMAGE-DALLE3] ✓ Image generated successfully`);
  logger.info(`[IMAGE-DALLE3] Image URL: ${imageUrl.substring(0, 50)}...`);
  logger.info('[IMAGE-DALLE3] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    model: 'dall-e-3',
    prompt: revisedPrompt,
  });
});

/**
 * POST /dalle2
 * Generate image using DALL-E 2
 * 
 * CRITICAL NOTES FOR DALL-E 2:
 * - Endpoint: https://api.openai.com/v1/images/generations
 * - Model: "dall-e-2" (REQUIRED - exact string)
 * - Prompt: max 1000 characters (will be truncated if longer)
 * - Size: "256x256", "512x512", or "1024x1024" (DALL-E 2 only supports these)
 * - Quality: "standard" ONLY (DALL-E 2 does NOT support "hd")
 * - n: 1 (number of images)
 * - response_format: "url" (optional, default)
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "1024x1024",
 *   "quality": "standard"
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "model": "dalle2",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/dalle2', async (req, res) => {
  const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

  logger.info('[IMAGE-DALLE2] ========== POST /dalle2 REQUEST =========');
  logger.info(`[IMAGE-DALLE2] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-DALLE2] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-DALLE2] Incoming size parameter: ${size}`);
  logger.info(`[IMAGE-DALLE2] Quality: ${quality}`);

  // Validate required fields
  if (!prompt) {
    logger.warn('[IMAGE-DALLE2] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-DALLE2] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  // DALL-E 2 has max 1000 characters for prompt
  let finalPrompt = prompt;
  if (prompt.length > 1000) {
    logger.warn(`[IMAGE-DALLE2] ⚠️  Prompt exceeds 1000 chars (${prompt.length}), truncating`);
    finalPrompt = prompt.substring(0, 1000);
    logger.info(`[IMAGE-DALLE2] Truncated prompt to: "${finalPrompt}"`);
  }

  // Validate size - DALL-E 2 ONLY supports these sizes
  const validSizes = ['256x256', '512x512', '1024x1024'];
  if (!validSizes.includes(size)) {
    logger.warn(`[IMAGE-DALLE2] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. DALL-E 2 only supports: ${validSizes.join(', ')}`,
    });
  }
  
  logger.info(`[IMAGE-DALLE2] Validated size: ${size}`);

  // CRITICAL: DALL-E 2 ONLY supports "standard" quality, NOT "hd"
  if (quality !== 'standard') {
    logger.warn(`[IMAGE-DALLE2] ❌ Invalid quality: ${quality}`);
    logger.warn('[IMAGE-DALLE2] DALL-E 2 ONLY supports quality: "standard"');
    return res.status(400).json({
      error: 'DALL-E 2 only supports quality: "standard" (not "hd")',
    });
  }

  logger.info('[IMAGE-DALLE2] ✓ Request validation passed');

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error('[IMAGE-DALLE2] ❌ OPENAI_API_KEY is not configured');
    throw new Error('OPENAI_API_KEY is not configured');
  }
  logger.info('[IMAGE-DALLE2] ✓ OPENAI_API_KEY is configured');

  logger.info('[IMAGE-DALLE2] Building request payload...');
  const requestPayload = {
    model: 'dall-e-2',
    prompt: finalPrompt,
    size: size,
    quality: quality,
    n: 1,
    response_format: 'url',
  };
  logger.info(`[IMAGE-DALLE2] Full request payload being sent to OpenAI: ${JSON.stringify(requestPayload)}`);

  logger.info('[IMAGE-DALLE2] Calling OpenAI DALL-E 2 API...');
  logger.info(`[IMAGE-DALLE2] Endpoint: https://api.openai.com/v1/images/generations`);
  logger.info(`[IMAGE-DALLE2] Method: POST`);
  logger.info(`[IMAGE-DALLE2] Headers: Authorization: Bearer ${apiKey.substring(0, 10)}..., Content-Type: application/json`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  logger.info(`[IMAGE-DALLE2] Response status: ${response.status}`);
  logger.info(`[IMAGE-DALLE2] Response status text: ${response.statusText}`);

  // Read response body
  const responseText = await response.text();
  logger.info(`[IMAGE-DALLE2] Response from OpenAI: ${responseText.substring(0, 500)}`);

  if (!response.ok) {
    logger.error('[IMAGE-DALLE2] ❌ API call failed');
    logger.error(`[IMAGE-DALLE2] Error status: ${response.status}`);
    logger.error(`[IMAGE-DALLE2] Error status text: ${response.statusText}`);
    logger.error(`[IMAGE-DALLE2] Error response body: ${responseText}`);
    
    // Provide specific error messages based on status code
    if (response.status === 400) {
      logger.error('[IMAGE-DALLE2] 400 Bad Request - Check request payload format');
      throw new Error('OpenAI API error: Invalid request format (400 Bad Request) - Check prompt, size, and quality parameters');
    } else if (response.status === 401) {
      throw new Error('OpenAI API error: Invalid API key (401 Unauthorized)');
    } else if (response.status === 403) {
      throw new Error('OpenAI API error: Access forbidden (403 Forbidden)');
    } else if (response.status === 429) {
      throw new Error('OpenAI API error: Rate limit exceeded (429 Too Many Requests)');
    } else if (response.status === 500) {
      throw new Error('OpenAI API error: Server error (500 Internal Server Error)');
    } else {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
  }

  let data;
  try {
    data = JSON.parse(responseText);
    logger.info('[IMAGE-DALLE2] ✓ Response parsed as JSON');
  } catch (error) {
    logger.error(`[IMAGE-DALLE2] ❌ Failed to parse response JSON: ${error.message}`);
    throw new Error('Invalid response from OpenAI API');
  }

  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    logger.error('[IMAGE-DALLE2] ❌ No image data in response');
    throw new Error('No image data in response from OpenAI API');
  }

  const imageData = data.data[0];

  if (!imageData.url) {
    logger.error('[IMAGE-DALLE2] ❌ No URL in image data');
    throw new Error('No image URL in response from OpenAI API');
  }

  const imageUrl = imageData.url;
  logger.info(`[IMAGE-DALLE2] ✓ Image URL extracted: ${imageUrl.substring(0, 50)}...`);
  logger.info(`[IMAGE-DALLE2] ✓ Image generated successfully`);
  logger.info('[IMAGE-DALLE2] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    model: 'dalle2',
    prompt: finalPrompt,
  });
});

/**
 * POST /gpt-image
 * Generate image using GPT Image 1.5
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "1024x1024",
 *   "quality": "standard"
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "model": "gpt-image-1.5",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/gpt-image', async (req, res) => {
  const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

  logger.info('[IMAGE-GPT] ========== POST /gpt-image REQUEST =========');
  logger.info(`[IMAGE-GPT] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-GPT] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-GPT] Size: ${size}, Quality: ${quality}`);

  // Validate required fields
  if (!prompt) {
    logger.warn('[IMAGE-GPT] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-GPT] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-GPT] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  // Validate size
  const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
  if (!validSizes.includes(size)) {
    logger.warn(`[IMAGE-GPT] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
    });
  }

  // Validate quality
  const validQualities = ['standard', 'hd'];
  if (!validQualities.includes(quality)) {
    logger.warn(`[IMAGE-GPT] ❌ Invalid quality: ${quality}`);
    return res.status(400).json({
      error: `Invalid quality. Must be one of: ${validQualities.join(', ')}`,
    });
  }

  logger.info('[IMAGE-GPT] ✓ Request validation passed');

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.error('[IMAGE-GPT] ❌ OPENAI_API_KEY is not configured');
    throw new Error('OPENAI_API_KEY is not configured');
  }

  logger.info('[IMAGE-GPT] Calling OpenAI GPT Image 1.5 API...');
  logger.info(`[IMAGE-GPT] Endpoint: https://api.openai.com/v1/images/generations`);
  logger.info(`[IMAGE-GPT] Model: gpt-image-1.5, Size: ${size}, Quality: ${quality}`);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1.5',
      prompt: prompt,
      size: size,
      quality: quality,
      n: 1,
    }),
  });

  logger.info(`[IMAGE-GPT] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[IMAGE-GPT] ❌ API call failed`);
    logger.error(`[IMAGE-GPT] Error status: ${response.status}`);
    logger.error(`[IMAGE-GPT] Error response: ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    logger.error(`[IMAGE-GPT] Failed to parse response JSON: ${error.message}`);
    throw new Error('Invalid response from OpenAI API');
  }

  logger.info('[IMAGE-GPT] ✓ Response received from OpenAI');

  if (!data.data || data.data.length === 0) {
    logger.error('[IMAGE-GPT] No image data in response');
    throw new Error('No image data in response');
  }

  const imageUrl = data.data[0].url;
  const revisedPrompt = data.data[0].revised_prompt || prompt;

  logger.info(`[IMAGE-GPT] ✓ Image generated successfully`);
  logger.info(`[IMAGE-GPT] Image URL: ${imageUrl.substring(0, 50)}...`);
  logger.info('[IMAGE-GPT] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    model: 'gpt-image-1.5',
    prompt: revisedPrompt,
  });
});

/**
 * POST /sd3
 * Generate image using Stability AI Stable Diffusion 3
 * Uses multipart/form-data format (NOT JSON)
 * 
 * Request body (multipart/form-data):
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "aspect_ratio": "1:1",
 *   "style": "photorealistic",
 *   "negative_prompt": "blurry, low quality"
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "data:image/jpeg;base64,...",
 *   "model": "sd3",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/sd3', async (req, res) => {
  const { prompt, aspect_ratio = '1:1', style, negative_prompt } = req.body;

  logger.info('[IMAGE-SD3] ========== POST /sd3 REQUEST =========');
  logger.info(`[IMAGE-SD3] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-SD3] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-SD3] Aspect ratio: ${aspect_ratio}`);
  logger.info(`[IMAGE-SD3] Style: ${style || 'default'}`);
  logger.info(`[IMAGE-SD3] Negative prompt: ${negative_prompt ? 'provided' : 'none'}`);

  // Validate required fields
  if (!prompt) {
    logger.warn('[IMAGE-SD3] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-SD3] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-SD3] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  // Validate aspect ratio
  const validAspectRatios = ['16:9', '1:1', '21:9', '2:3', '3:2', '4:5', '5:4', '9:16', '9:21'];
  if (!validAspectRatios.includes(aspect_ratio)) {
    logger.warn(`[IMAGE-SD3] ❌ Invalid aspect_ratio: ${aspect_ratio}`);
    return res.status(400).json({
      error: `Invalid aspect_ratio. Must be one of: ${validAspectRatios.join(', ')}`,
    });
  }

  // Validate style if provided
  if (style) {
    const validStyles = ['photorealistic', 'cinematic', 'anime', 'illustration', 'sketch'];
    if (!validStyles.includes(style)) {
      logger.warn(`[IMAGE-SD3] ❌ Invalid style: ${style}`);
      return res.status(400).json({
        error: `Invalid style. Must be one of: ${validStyles.join(', ')}`,
      });
    }
  }

  logger.info('[IMAGE-SD3] ✓ Request validation passed');

  // Check API key
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    logger.error('[IMAGE-SD3] ❌ STABILITY_API_KEY is not configured');
    throw new Error('STABILITY_API_KEY not configured');
  }
  logger.info('[IMAGE-SD3] ✓ STABILITY_API_KEY is configured');

  // Build FormData request (multipart/form-data)
  logger.info('[IMAGE-SD3] Building FormData request...');
  const formData = new FormData();
  
  // Add required field
  formData.append('prompt', prompt);
  logger.info(`[IMAGE-SD3] Added field: prompt = "${prompt.substring(0, 50)}..."`);
  
  // Add optional fields
  formData.append('aspect_ratio', aspect_ratio);
  logger.info(`[IMAGE-SD3] Added field: aspect_ratio = "${aspect_ratio}"`);
  
  formData.append('output_format', 'jpeg');
  logger.info(`[IMAGE-SD3] Added field: output_format = "jpeg"`);
  
  if (style) {
    formData.append('style', style);
    logger.info(`[IMAGE-SD3] Added field: style = "${style}"`);
  }
  
  if (negative_prompt) {
    formData.append('negative_prompt', negative_prompt);
    logger.info(`[IMAGE-SD3] Added field: negative_prompt = "${negative_prompt.substring(0, 50)}..."`);
  }

  logger.info('[IMAGE-SD3] FormData request constructed');

  // Prepare headers (DO NOT set Content-Type - let fetch set it with boundary)
  const headers = {
    'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
    'Accept': 'application/json',
  };
  logger.info('[IMAGE-SD3] Request headers:');
  logger.info(`[IMAGE-SD3]   Authorization: Bearer ${apiKey.substring(0, 10)}...`);
  logger.info(`[IMAGE-SD3]   Accept: application/json`);
  logger.info('[IMAGE-SD3] Content-Type: will be set automatically by fetch with boundary');

  logger.info('[IMAGE-SD3] Calling Stability AI Stable Diffusion 3 API...');
  logger.info(`[IMAGE-SD3] Endpoint: https://api.stability.ai/v2beta/stable-image/generate/sd3`);
  logger.info(`[IMAGE-SD3] Method: POST`);
  logger.info(`[IMAGE-SD3] Request format: multipart/form-data`);

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  logger.info(`[IMAGE-SD3] Response status: ${response.status}`);
  logger.info(`[IMAGE-SD3] Response status text: ${response.statusText}`);
  logger.info('[IMAGE-SD3] Response headers:');
  for (const [key, value] of response.headers.entries()) {
    logger.info(`[IMAGE-SD3]   ${key}: ${value}`);
  }

  // Read response body
  const responseText = await response.text();
  logger.info(`[IMAGE-SD3] Response body length: ${responseText.length} bytes`);
  logger.info(`[IMAGE-SD3] Response body (first 500 chars): ${responseText.substring(0, 500)}`);

  if (!response.ok) {
    logger.error('[IMAGE-SD3] ❌ API call failed');
    logger.error(`[IMAGE-SD3] Error status: ${response.status}`);
    logger.error(`[IMAGE-SD3] Error status text: ${response.statusText}`);
    logger.error(`[IMAGE-SD3] Error response body: ${responseText}`);
    throw new Error(`Stability AI API error: ${response.status} ${response.statusText} - ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
    logger.info('[IMAGE-SD3] ✓ Response parsed as JSON');
  } catch (error) {
    logger.error(`[IMAGE-SD3] Failed to parse response JSON: ${error.message}`);
    logger.error(`[IMAGE-SD3] Response text: ${responseText}`);
    throw new Error('Invalid response from Stability AI API');
  }

  logger.info('[IMAGE-SD3] ✓ Response received from Stability AI');
  logger.info(`[IMAGE-SD3] Response object keys: ${Object.keys(data).join(', ')}`);

  // Handle different response formats from Stability AI
  let imageUrl;

  if (data.image) {
    // Response format: { image: "base64_string" }
    logger.info('[IMAGE-SD3] Image format: base64 string in "image" field');
    imageUrl = `data:image/jpeg;base64,${data.image}`;
    logger.info(`[IMAGE-SD3] Image URL created: data:image/jpeg;base64,${data.image.substring(0, 50)}...`);
  } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    // Response format: { images: [{ url: "..." }] } or { images: ["base64_string"] }
    logger.info('[IMAGE-SD3] Image format: array of images');
    const firstImage = data.images[0];
    if (typeof firstImage === 'string') {
      // Array of base64 strings
      imageUrl = `data:image/jpeg;base64,${firstImage}`;
      logger.info(`[IMAGE-SD3] Image URL created from base64 string: data:image/jpeg;base64,${firstImage.substring(0, 50)}...`);
    } else if (firstImage.url) {
      // Array of objects with url property
      imageUrl = firstImage.url;
      logger.info(`[IMAGE-SD3] Image URL extracted from object: ${imageUrl.substring(0, 50)}...`);
    } else if (firstImage.image) {
      // Array of objects with image property (base64)
      imageUrl = `data:image/jpeg;base64,${firstImage.image}`;
      logger.info(`[IMAGE-SD3] Image URL created from object base64: data:image/jpeg;base64,${firstImage.image.substring(0, 50)}...`);
    } else {
      logger.error('[IMAGE-SD3] ❌ Unknown image object format in array');
      logger.error(`[IMAGE-SD3] First image object: ${JSON.stringify(firstImage).substring(0, 200)}`);
      throw new Error('Unknown image format in response');
    }
  } else if (typeof data === 'string') {
    // Response is base64 string directly
    logger.info('[IMAGE-SD3] Image format: direct base64 string');
    imageUrl = `data:image/jpeg;base64,${data}`;
    logger.info(`[IMAGE-SD3] Image URL created: data:image/jpeg;base64,${data.substring(0, 50)}...`);
  } else {
    logger.error('[IMAGE-SD3] ❌ No image data found in response');
    logger.error(`[IMAGE-SD3] Response structure: ${JSON.stringify(data).substring(0, 500)}`);
    throw new Error('No image data in response from Stability AI');
  }

  if (!imageUrl) {
    logger.error('[IMAGE-SD3] ❌ Failed to extract image URL from response');
    throw new Error('Failed to extract image URL from Stability AI response');
  }

  logger.info(`[IMAGE-SD3] ✓ Image generated successfully`);
  logger.info(`[IMAGE-SD3] Image URL length: ${imageUrl.length} characters`);
  logger.info('[IMAGE-SD3] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    model: 'sd3',
    prompt,
  });
});

/**
 * POST /flux
 * Generate image using Flux Pro
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "1024x1024",
 *   "style": "cinematic"
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "model": "flux-pro",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/flux', async (req, res) => {
  const { prompt, size = '1024x1024', style } = req.body;

  logger.info('[IMAGE-FLUX] ========== POST /flux REQUEST =========');
  logger.info(`[IMAGE-FLUX] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-FLUX] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-FLUX] Size: ${size}, Style: ${style || 'default'}`);

  // Validate required fields
  if (!prompt) {
    logger.warn('[IMAGE-FLUX] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-FLUX] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-FLUX] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  // Validate size
  const validSizes = ['1024x1024', '1024x1536', '1536x1024'];
  if (!validSizes.includes(size)) {
    logger.warn(`[IMAGE-FLUX] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
    });
  }

  logger.info('[IMAGE-FLUX] ✓ Request validation passed');

  // Check API key
  const apiKey = process.env.FLUX_API_KEY;
  if (!apiKey) {
    logger.error('[IMAGE-FLUX] ❌ FLUX_API_KEY is not configured');
    throw new Error('FLUX_API_KEY is not configured');
  }

  logger.info('[IMAGE-FLUX] Calling Flux Pro API...');
  logger.info(`[IMAGE-FLUX] Endpoint: https://api.flux.ai/v1/images/generate`);
  logger.info(`[IMAGE-FLUX] Model: flux-pro, Size: ${size}`);

  const response = await fetch('https://api.flux.ai/v1/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'flux-pro',
      size: size,
      style: style || 'default',
      num_images: 1,
    }),
  });

  logger.info(`[IMAGE-FLUX] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[IMAGE-FLUX] ❌ API call failed`);
    logger.error(`[IMAGE-FLUX] Error status: ${response.status}`);
    logger.error(`[IMAGE-FLUX] Error response: ${errorText}`);
    throw new Error(`Flux API error: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    logger.error(`[IMAGE-FLUX] Failed to parse response JSON: ${error.message}`);
    throw new Error('Invalid response from Flux API');
  }

  logger.info('[IMAGE-FLUX] ✓ Response received from Flux');

  if (!data.images || data.images.length === 0) {
    logger.error('[IMAGE-FLUX] No image data in response');
    throw new Error('No image data in response');
  }

  const imageUrl = data.images[0].url;

  logger.info(`[IMAGE-FLUX] ✓ Image generated successfully`);
  logger.info(`[IMAGE-FLUX] Image URL: ${imageUrl.substring(0, 50)}...`);
  logger.info('[IMAGE-FLUX] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    model: 'flux-pro',
    prompt,
  });
});

/**
 * POST /nano
 * Generate image using Banana Nano 2
 * 
 * Request body:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "size": "512x512",
 *   "steps": 20
 * }
 * 
 * Response:
 * {
 *   "imageUrl": "https://...",
 *   "model": "banana-nano-2",
 *   "prompt": "A beautiful sunset over mountains"
 * }
 */
router.post('/nano', async (req, res) => {
  const { prompt, size = '512x512', steps = 20 } = req.body;

  logger.info('[IMAGE-NANO] ========== POST /nano REQUEST =========');
  logger.info(`[IMAGE-NANO] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[IMAGE-NANO] Prompt length: ${prompt?.length || 0}`);
  logger.info(`[IMAGE-NANO] Size: ${size}, Steps: ${steps}`);

  // Validate required fields
  if (!prompt) {
    logger.warn('[IMAGE-NANO] ❌ Missing prompt in request body');
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    logger.warn('[IMAGE-NANO] ❌ Prompt is not a valid non-empty string');
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (prompt.length > 4000) {
    logger.warn(`[IMAGE-NANO] ❌ Prompt exceeds max length: ${prompt.length} > 4000`);
    return res.status(400).json({ error: 'prompt exceeds maximum length of 4000 characters' });
  }

  // Validate size
  const validSizes = ['256x256', '512x512', '768x768'];
  if (!validSizes.includes(size)) {
    logger.warn(`[IMAGE-NANO] ❌ Invalid size: ${size}`);
    return res.status(400).json({
      error: `Invalid size. Must be one of: ${validSizes.join(', ')}`,
    });
  }

  // Validate steps
  if (typeof steps !== 'number' || steps < 1 || steps > 50) {
    logger.warn(`[IMAGE-NANO] ❌ Invalid steps: ${steps}`);
    return res.status(400).json({ error: 'steps must be a number between 1 and 50' });
  }

  logger.info('[IMAGE-NANO] ✓ Request validation passed');

  // Check API key
  const apiKey = process.env.BANANA_API_KEY;
  if (!apiKey) {
    logger.error('[IMAGE-NANO] ❌ BANANA_API_KEY is not configured');
    throw new Error('BANANA_API_KEY is not configured');
  }

  logger.info('[IMAGE-NANO] Calling Banana Nano 2 API...');
  logger.info(`[IMAGE-NANO] Endpoint: https://api.banana.dev/v1/inference`);
  logger.info(`[IMAGE-NANO] Model: banana-nano-2, Size: ${size}, Steps: ${steps}`);

  const [width, height] = size.split('x').map(Number);

  const response = await fetch('https://api.banana.dev/v1/inference', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_key: 'banana-nano-2',
      start_request: {
        prompt: prompt,
        width: width,
        height: height,
        num_inference_steps: steps,
        guidance_scale: 7.5,
      },
    }),
  });

  logger.info(`[IMAGE-NANO] Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`[IMAGE-NANO] ❌ API call failed`);
    logger.error(`[IMAGE-NANO] Error status: ${response.status}`);
    logger.error(`[IMAGE-NANO] Error response: ${errorText}`);
    throw new Error(`Banana API error: ${response.status} ${response.statusText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    logger.error(`[IMAGE-NANO] Failed to parse response JSON: ${error.message}`);
    throw new Error('Invalid response from Banana API');
  }

  logger.info('[IMAGE-NANO] ✓ Response received from Banana');

  if (!data.modelOutputs || !data.modelOutputs[0] || !data.modelOutputs[0].image_url) {
    logger.error('[IMAGE-NANO] No image data in response');
    throw new Error('No image data in response');
  }

  const imageUrl = data.modelOutputs[0].image_url;

  logger.info(`[IMAGE-NANO] ✓ Image generated successfully`);
  logger.info(`[IMAGE-NANO] Image URL: ${imageUrl.substring(0, 50)}...`);
  logger.info('[IMAGE-NANO] ========== REQUEST COMPLETE =========');

  res.json({
    imageUrl,
    model: 'banana-nano-2',
    prompt,
  });
});

export default router;