import { Router } from 'express';
import { ContentBlockType, stream, uploadImagesToPocketBase } from '../api/integrated-ai.js';
import { getSystemPromptWithLanguage } from '../constants/prompts.js';
import { uploadFiles } from '../middleware/file-upload.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.use(pocketbaseAuth);

router.post('/stream', integratedAiRateLimit, uploadFiles({
	allowedMimeTypes: [
		'image/jpeg',
		'image/png',
		'image/webp',
		'application/pdf'
	],
	fieldName: 'images',
}), async (req, res) => {
	logger.info('[INTEGRATED-AI-ROUTE] ========== POST /stream REQUEST =========');
	logger.info(`[INTEGRATED-AI-ROUTE] Timestamp: ${new Date().toISOString()}`);
	logger.info(`[INTEGRATED-AI-ROUTE] User ID: ${req.pocketbaseUserId}`);
	logger.info(`[INTEGRATED-AI-ROUTE] Files received: ${req.files?.length || 0}`);

	const { message, language = 'en' } = req.body;

	logger.info(`[INTEGRATED-AI-ROUTE] Message length: ${message?.length || 0}`);
	logger.info(`[INTEGRATED-AI-ROUTE] Language: ${language}`);

	if (!message) {
		logger.warn('[INTEGRATED-AI-ROUTE] ❌ Missing message in request body');
		return res.status(400).json({ error: 'message is required' });
	}

	if (message.length > 2000) {
		logger.warn(`[INTEGRATED-AI-ROUTE] ❌ Message exceeds max length: ${message.length} > 2000`);
		return res.status(400).json({ error: 'message exceeds maximum length of 2000 characters' });
	}

	try {
		logger.info('[INTEGRATED-AI-ROUTE] Parsing message JSON...');
		const parsedMessage = JSON.parse(message);
		logger.info(`[INTEGRATED-AI-ROUTE] ✓ Message parsed: ${Array.isArray(parsedMessage) ? 'array' : 'object'}`);

		if (req.files?.length > 0) {
			logger.info(`[INTEGRATED-AI-ROUTE] Processing ${req.files.length} uploaded files...`);
			
			for (const file of req.files) {
				if (file.mimetype === 'application/pdf' && file.size > 15 * 1024 * 1024) {
					logger.warn(`[INTEGRATED-AI-ROUTE] ❌ PDF file exceeds 15MB limit: ${file.size} bytes`);
					return res.status(400).json({ error: 'PDF file size exceeds 15 MB limit' });
				}
				if (file.mimetype.startsWith('image/') && file.size > 5 * 1024 * 1024) {
					logger.warn(`[INTEGRATED-AI-ROUTE] ❌ Image file exceeds 5MB limit: ${file.size} bytes`);
					return res.status(400).json({ error: 'Image file size exceeds 5 MB limit' });
				}
			}

			logger.info('[INTEGRATED-AI-ROUTE] Uploading images to PocketBase...');
			const imageUrls = await uploadImagesToPocketBase({ images: req.files });
			logger.info(`[INTEGRATED-AI-ROUTE] ✓ Images uploaded: ${imageUrls.length} URLs`);
			
			imageUrls.forEach((url) => {
				logger.info(`[INTEGRATED-AI-ROUTE] Adding image to message: ${url.substring(0, 50)}...`);
				parsedMessage.push({ type: ContentBlockType.Image, image: url });
			});
		}

		logger.info('[INTEGRATED-AI-ROUTE] Getting system prompt...');
		const systemPrompt = getSystemPromptWithLanguage(language);
		logger.info(`[INTEGRATED-AI-ROUTE] ✓ System prompt length: ${systemPrompt.length}`);

		logger.info('[INTEGRATED-AI-ROUTE] Calling stream() function...');
		const sseStream = await stream({
			userId: req.pocketbaseUserId,
			systemPrompt,
			userMessage: parsedMessage,
		});

		logger.info('[INTEGRATED-AI-ROUTE] ✓ Stream obtained, setting SSE headers...');
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');

		logger.info('[INTEGRATED-AI-ROUTE] Piping stream to response...');
		sseStream.pipe(res, { end: false });

		res.on('close', () => {
			logger.info('[INTEGRATED-AI-ROUTE] ✓ Client closed connection');
			sseStream.destroy();
		});

		res.on('error', (error) => {
			logger.error(`[INTEGRATED-AI-ROUTE] ❌ Response error: ${error.message}`);
			logger.error(`[INTEGRATED-AI-ROUTE] Error stack: ${error.stack}`);
			sseStream.destroy();
		});

		logger.info('[INTEGRATED-AI-ROUTE] ========== STREAM PIPED SUCCESSFULLY =========');
	} catch (error) {
		logger.error('[INTEGRATED-AI-ROUTE] ❌ Request error occurred');
		logger.error(`[INTEGRATED-AI-ROUTE] Error message: ${error.message}`);
		logger.error(`[INTEGRATED-AI-ROUTE] Error type: ${error.constructor.name}`);
		logger.error(`[INTEGRATED-AI-ROUTE] Error stack: ${error.stack}`);
		throw error;
	}
});

export default router;