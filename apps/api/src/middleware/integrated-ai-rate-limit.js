import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

export const integratedAiRateLimit = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10, // 10 requests per minute per IP
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many AI requests, please try again later' },
	validate: { trustProxy: false },
	handler: (req, res) => {
		logger.warn(`[RATE-LIMIT] Rate limit exceeded for IP: ${req.ip}`);
		res.status(429).json({ error: 'Too many AI requests, please try again later' });
	},
	skip: (req) => {
		// Log rate limit check
		logger.debug(`[RATE-LIMIT] Checking rate limit for IP: ${req.ip}`);
		return false;
	},
});