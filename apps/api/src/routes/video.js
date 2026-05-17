import 'dotenv/config';
import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { getVideoGenerationPromptWithLanguage } from '../constants/prompts.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { validateModelId, getModelConfigWithValidation, getProviderByModelIdWithValidation } from '../utils/models.validator.js';
import { isProviderConfigured } from '../utils/provider-config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.use(pocketbaseAuth);

// Image validation constants
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_IMAGE_DIMENSION = 256;
const MAX_IMAGE_DIMENSION = 4096;

// Quality multipliers
const QUALITY_MULTIPLIERS = {
  '480p': 1,
  '720p': 1.5,
  '1080p': 2,
};

// Duration multipliers
const DURATION_MULTIPLIERS = {
  5: 1,
  10: 1.2,
  20: 1.5,
  30: 2,
};

// Model multipliers
const MODEL_MULTIPLIERS = {
  'fal-ai/image-to-video': 1,
  'dall-e-video': 1.5,
};

/**
 * Validate image dimensions
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 * @throws {Error} If dimensions are invalid
 */
async function validateImageDimensions(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Could not determine image dimensions');
    }

    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions must be at least ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}`);
    }

    if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      throw new Error(`Image dimensions must not exceed ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}`);
    }

    return { width, height };
  } catch (error) {
    if (error.message.includes('dimensions')) {
      throw error;
    }
    throw new Error('Image dimensions must be 256x256 to 4096x4096');
  }
}

/**
 * Calculate duration multiplier
 * @param {number} duration - Duration in seconds
 * @returns {number} Duration multiplier
 */
function getDurationMultiplier(duration) {
  if (duration <= 5) return DURATION_MULTIPLIERS[5];
  if (duration <= 10) return DURATION_MULTIPLIERS[10];
  if (duration <= 20) return DURATION_MULTIPLIERS[20];
  return DURATION_MULTIPLIERS[30];
}

/**
 * Calculate credits needed for image-to-video generation
 * @param {string} modelId - Model ID
 * @param {string} quality - Quality level (480p, 720p, 1080p)
 * @param {number} duration - Duration in seconds
 * @returns {number} Credits needed
 */
function calculateImageToVideoCredits(modelId, quality, duration) {
  const baseCredits = 15;
  const qualityMultiplier = QUALITY_MULTIPLIERS[quality] || 1;
  const durationMultiplier = getDurationMultiplier(duration);
  const modelMultiplier = MODEL_MULTIPLIERS[modelId] || 1;

  const totalCredits = baseCredits * qualityMultiplier * durationMultiplier * modelMultiplier;
  return Math.ceil(totalCredits);
}

/**
 * Upload image to temporary storage and return URL
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} originalFilename - Original filename
 * @returns {string} Image URL or path
 */
function uploadImageToStorage(imageBuffer, originalFilename) {
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(originalFilename);
  const filename = `img2vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFileSync(filepath, imageBuffer);
  return filepath;
}

/**
 * Call Fal AI image-to-video API
 * @param {string} imageUrl - Image URL or path
 * @param {object} params - Generation parameters
 * @returns {Promise<string>} Video URL
 */
async function callFalAiImageToVideo(imageUrl, params) {
  const { animation_style, duration, fps, quality, motion_intensity } = params;

  const response = await fetch('https://api.fal.ai/v1/image-to-video', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      animation_style: animation_style || 'dynamic',
      duration: duration || 5,
      fps: fps || 24,
      quality: quality || '720p',
      motion_intensity: motion_intensity || 0.5,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    logger.error(`Fal AI image-to-video error: ${response.status} ${errorData}`);
    throw new Error('Model generation failed');
  }

  const data = await response.json();

  if (!data.video_url) {
    throw new Error('Model generation failed');
  }

  return data.video_url;
}

/**
 * Call OpenAI DALL-E video generation API (placeholder)
 * @param {string} imageUrl - Image URL
 * @param {object} params - Generation parameters
 * @returns {Promise<string>} Video URL
 */
async function callOpenAIVideoGeneration(imageUrl, params) {
  // OpenAI doesn't have a direct image-to-video API yet
  // This is a placeholder for future implementation
  throw new Error('OpenAI video generation is not yet available');
}

router.post('/image-to-video', uploadFiles({
  allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
  fieldName: 'image_file',
  maxCount: 1,
  maxSizeMB: 10,
}), async (req, res) => {
  const { animation_style, duration = 5, fps = 24, quality = '720p', model_id, motion_intensity = 0.5, user_id } = req.body;
  const userId = user_id || req.pocketbaseUserId;

  // Validate required fields
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'image_file is required' });
  }

  if (!model_id) {
    return res.status(400).json({ error: 'model_id is required' });
  }

  const imageFile = req.files[0];

  // Validate MIME type
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(imageFile.mimetype)) {
    throw new Error('Invalid image format');
  }

  // Validate file size
  if (imageFile.size > MAX_IMAGE_SIZE) {
    throw new Error('Image exceeds 10MB limit');
  }

  // Validate image dimensions
  const dimensions = await validateImageDimensions(imageFile.buffer);
  logger.info(`Image dimensions validated: ${dimensions.width}x${dimensions.height}`);

  // Validate model exists
  if (!validateModelId(model_id)) {
    return res.status(400).json({ error: `Model '${model_id}' not found` });
  }

  const modelConfig = getModelConfigWithValidation(model_id);

  // Validate model is image type
  if (modelConfig.type !== 'image') {
    return res.status(400).json({ error: `Model '${model_id}' is not an image model` });
  }

  // Get provider
  const provider = getProviderByModelIdWithValidation(model_id);

  // Check if provider is configured
  if (!isProviderConfigured(provider)) {
    throw new Error(`Provider '${provider}' is not configured with API key`);
  }

  // Validate quality
  if (!QUALITY_MULTIPLIERS[quality]) {
    return res.status(400).json({ error: `Invalid quality. Must be one of: ${Object.keys(QUALITY_MULTIPLIERS).join(', ')}` });
  }

  // Validate duration
  if (typeof duration !== 'number' || duration < 1 || duration > 60) {
    return res.status(400).json({ error: 'duration must be a number between 1 and 60 seconds' });
  }

  // Validate fps
  if (typeof fps !== 'number' || fps < 1 || fps > 60) {
    return res.status(400).json({ error: 'fps must be a number between 1 and 60' });
  }

  // Validate motion_intensity
  if (typeof motion_intensity !== 'number' || motion_intensity < 0 || motion_intensity > 1) {
    return res.status(400).json({ error: 'motion_intensity must be a number between 0 and 1' });
  }

  // Verify user exists
  const user = await pocketbaseClient.collection('users').getOne(userId).catch(() => null);
  if (!user) {
    throw new Error('User not found');
  }

  // Upload image to storage
  const imageUrl = uploadImageToStorage(imageFile.buffer, imageFile.originalname);
  logger.info(`Image uploaded to storage: ${imageUrl}`);

  // Call appropriate provider
  let videoUrl;

  if (provider === 'fal_ai') {
    videoUrl = await callFalAiImageToVideo(imageUrl, {
      animation_style,
      duration,
      fps,
      quality,
      motion_intensity,
    });
  } else if (provider === 'openai') {
    videoUrl = await callOpenAIVideoGeneration(imageUrl, {
      animation_style,
      duration,
      fps,
      quality,
      motion_intensity,
    });
  } else {
    throw new Error(`Provider '${provider}' image-to-video generation is not yet implemented`);
  }

  // Calculate credits needed
  const creditsUsed = calculateImageToVideoCredits(model_id, quality, duration);

  // Check if user has enough credits
  const currentBalance = user.credits_balance || 0;
  if (currentBalance < creditsUsed) {
    throw new Error('Insufficient credits');
  }

  // Deduct credits
  const newBalance = currentBalance - creditsUsed;
  await pocketbaseClient.collection('users').update(userId, {
    credits_balance: newBalance,
  });

  // Store in _integratedAiVideo collection
  const videoRecord = await pocketbaseClient.collection('_integratedAiVideo').create({
    user_id: userId,
    model_id,
    type: 'image_to_video',
    image_url: imageUrl,
    animation_style: animation_style || null,
    duration,
    fps,
    quality,
    motion_intensity,
    video_url: videoUrl,
    credits_used: creditsUsed,
    image_dimensions: `${dimensions.width}x${dimensions.height}`,
  });

  // Log credit history
  await pocketbaseClient.collection('credit_history').create({
    user_id: userId,
    tool_type: 'video',
    credits_used: creditsUsed,
    credits_remaining: newBalance,
    action_description: `Generated video from image using ${modelConfig.name} (${quality}, ${duration}s)`,
  });

  logger.info(`Image-to-video generated for user ${userId}: model=${model_id}, quality=${quality}, duration=${duration}s, credits=${creditsUsed}`);

  res.json({
    video_url: videoUrl,
    credits_used: creditsUsed,
    duration,
    quality,
    fps,
    motion_intensity,
    image_dimensions: `${dimensions.width}x${dimensions.height}`,
    model_info: {
      id: modelConfig.id,
      name: modelConfig.name,
      provider: modelConfig.provider,
    },
    record_id: videoRecord.id,
  });
});

router.post('/export', async (req, res) => {
  const { video_id, edits, language = 'en' } = req.body;
  const userId = req.pocketbaseUserId;

  if (!video_id || !edits) {
    return res.status(400).json({ error: 'video_id and edits are required' });
  }

  const {
    trim,
    speed = 1.0,
    textOverlay,
    brightness = 0,
    contrast = 0,
    saturation = 0,
    rotation = 0,
    backgroundMusic,
    aspectRatio,
  } = edits;

  // Validate edits parameters
  if (speed && (typeof speed !== 'number' || speed < 0.5 || speed > 2.0)) {
    return res.status(400).json({ error: 'speed must be a number between 0.5 and 2.0' });
  }

  if (rotation && (typeof rotation !== 'number' || ![0, 90, 180, 270].includes(rotation))) {
    return res.status(400).json({ error: 'rotation must be 0, 90, 180, or 270' });
  }

  // For this implementation, we'll create a placeholder video URL
  // In production, you would:
  // 1. Fetch the original video from storage
  // 2. Apply ffmpeg transformations
  // 3. Upload processed video to storage
  // 4. Return the URL

  const outputFileName = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`;
  const outputPath = path.join(__dirname, '../../uploads', outputFileName);

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Build ffmpeg command with edits
  let filterComplex = [];

  if (brightness !== 0 || contrast !== 0 || saturation !== 0) {
    const eq = `eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}`;
    filterComplex.push(eq);
  }

  if (rotation !== 0) {
    const rotationMap = { 90: 1, 180: 2, 270: 3 };
    filterComplex.push(`transpose=${rotationMap[rotation] || 0}`);
  }

  if (textOverlay) {
    const { text, fontSize = 24, color = 'white', position = 'center' } = textOverlay;
    const positionMap = {
      'top-left': '10:10',
      'top-center': '(w-text_w)/2:10',
      'top-right': 'w-text_w-10:10',
      'center': '(w-text_w)/2:(h-text_h)/2',
      'bottom-left': '10:h-text_h-10',
      'bottom-center': '(w-text_w)/2:h-text_h-10',
      'bottom-right': 'w-text_w-10:h-text_h-10',
    };
    const xy = positionMap[position] || positionMap['center'];
    filterComplex.push(`drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${color}:x=${xy}`);
  }

  if (aspectRatio) {
    const [w, h] = aspectRatio.split(':').map(Number);
    filterComplex.push(`scale=w=min(iw,ih*${w}/${h}):h=min(ih,iw*${h}/${w}),pad=w=max(iw,ih*${w}/${h}):h=max(ih,iw*${h}/${w}):(ow-iw)/2:(oh-ih)/2`);
  }

  // Create a mock video file for demonstration
  // In production, this would process an actual video file
  const mockVideoUrl = `https://example.com/videos/${outputFileName}`;

  // Store record in _integratedAiVideos collection
  const videoRecord = await pocketbaseClient.collection('_integratedAiVideos').create({
    user_id: userId,
    original_video_id: video_id,
    video_url: mockVideoUrl,
    edits: JSON.stringify(edits),
    trim: trim ? JSON.stringify(trim) : null,
    speed,
    brightness,
    contrast,
    saturation,
    rotation,
    aspect_ratio: aspectRatio || null,
    has_text_overlay: !!textOverlay,
    has_background_music: !!backgroundMusic,
    language_code: language,
  });

  logger.info(`Video exported for user ${userId}: ${video_id}, language: ${language}`);

  res.json({
    videoUrl: mockVideoUrl,
    recordId: videoRecord.id,
    language,
    editsApplied: {
      trim: trim || null,
      speed,
      brightness,
      contrast,
      saturation,
      rotation,
      textOverlay: !!textOverlay,
      backgroundMusic: !!backgroundMusic,
      aspectRatio: aspectRatio || null,
    },
  });
});

export default router;