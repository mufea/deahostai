import 'dotenv/config';
import express from 'express';
import sharp from 'sharp';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { getImageGenerationPromptWithLanguage } from '../constants/prompts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.use(pocketbaseAuth);

router.post('/export', async (req, res) => {
  const { image_id, edits, language = 'en' } = req.body;
  const userId = req.pocketbaseUserId;

  if (!image_id || !edits) {
    return res.status(400).json({ error: 'image_id and edits are required' });
  }

  const {
    crop,
    brightness = 0,
    contrast = 0,
    saturation = 0,
    hue = 0,
    rotation = 0,
    flip,
    resize,
    textOverlay,
    filter,
  } = edits;

  // Validate edits parameters
  if (rotation && (typeof rotation !== 'number' || ![0, 90, 180, 270].includes(rotation))) {
    return res.status(400).json({ error: 'rotation must be 0, 90, 180, or 270' });
  }

  if (flip && !['horizontal', 'vertical'].includes(flip)) {
    return res.status(400).json({ error: 'flip must be "horizontal" or "vertical"' });
  }

  if (filter && !['grayscale', 'sepia', 'blur', 'sharpen'].includes(filter)) {
    return res.status(400).json({ error: 'filter must be one of: grayscale, sepia, blur, sharpen' });
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const outputFileName = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
  const outputPath = path.join(uploadsDir, outputFileName);

  // Build sharp transformation pipeline
  let sharpPipeline = sharp();

  // Apply crop
  if (crop) {
    const { x = 0, y = 0, width, height } = crop;
    if (width && height) {
      sharpPipeline = sharpPipeline.extract({ left: x, top: y, width, height });
    }
  }

  // Apply resize
  if (resize) {
    const { width, height } = resize;
    if (width || height) {
      sharpPipeline = sharpPipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
    }
  }

  // Apply rotation
  if (rotation && rotation !== 0) {
    sharpPipeline = sharpPipeline.rotate(rotation);
  }

  // Apply flip
  if (flip === 'horizontal') {
    sharpPipeline = sharpPipeline.flop();
  } else if (flip === 'vertical') {
    sharpPipeline = sharpPipeline.flip();
  }

  // Apply brightness, contrast, saturation, hue
  if (brightness !== 0 || contrast !== 0 || saturation !== 0 || hue !== 0) {
    sharpPipeline = sharpPipeline.modulate({
      brightness: 1 + brightness / 100,
      saturation: 1 + saturation / 100,
      hue: hue,
    });
  }

  // Apply filter
  if (filter === 'grayscale') {
    sharpPipeline = sharpPipeline.grayscale();
  } else if (filter === 'sepia') {
    sharpPipeline = sharpPipeline.tint({ r: 112, g: 66, b: 20 });
  } else if (filter === 'blur') {
    sharpPipeline = sharpPipeline.blur(5);
  } else if (filter === 'sharpen') {
    sharpPipeline = sharpPipeline.sharpen();
  }

  // For this implementation, we'll create a placeholder image URL
  // In production, you would:
  // 1. Fetch the original image from storage
  // 2. Apply sharp transformations
  // 3. Save processed image to storage
  // 4. Return the URL

  const mockImageUrl = `https://example.com/images/${outputFileName}`;

  // Store record in _integratedAiImages collection
  const imageRecord = await pocketbaseClient.collection('_integratedAiImages').create({
    user_id: userId,
    original_image_id: image_id,
    image_url: mockImageUrl,
    edits: JSON.stringify(edits),
    crop: crop ? JSON.stringify(crop) : null,
    brightness,
    contrast,
    saturation,
    hue,
    rotation,
    flip: flip || null,
    resize: resize ? JSON.stringify(resize) : null,
    has_text_overlay: !!textOverlay,
    filter: filter || null,
    language_code: language,
  });

  logger.info(`Image exported for user ${userId}: ${image_id}, language: ${language}`);

  res.json({
    imageUrl: mockImageUrl,
    recordId: imageRecord.id,
    language,
    editsApplied: {
      crop: crop || null,
      brightness,
      contrast,
      saturation,
      hue,
      rotation,
      flip: flip || null,
      resize: resize || null,
      textOverlay: !!textOverlay,
      filter: filter || null,
    },
  });
});

export default router;