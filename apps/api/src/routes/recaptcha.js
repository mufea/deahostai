// TEMPORARY: reCAPTCHA verification disabled for development/testing - re-enable in production
import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting: max 30 requests per minute per IP
const recaptchaRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 30,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many reCAPTCHA verification requests, please try again later' },
	validate: { trustProxy: false },
});

// TEMPORARY: reCAPTCHA verification disabled for development/testing - re-enable in production
router.post('/verify', recaptchaRateLimit, async (req, res) => {
	const { token } = req.body;

	if (!token) {
		return res.status(400).json({ success: false, error: 'MISSING_TOKEN', details: 'token is required' });
	}

  // --- RECAPTCHA DISABLED FOR DEVELOPMENT ---
  /*
	const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

	if (!recaptchaSecretKey) {
		logger.error('RECAPTCHA_SECRET_KEY is not configured in environment variables');
		throw new Error('RECAPTCHA_SECRET_KEY is not configured');
	}

	const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';

	let response;
	try {
		response = await fetch(verificationUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				secret: recaptchaSecretKey,
				response: token,
			}),
		});
	} catch (error) {
		logger.error(`Network error reaching Google reCAPTCHA service: ${error.message}`);
		return res.status(503).json({
			success: false,
			error: 'RECAPTCHA_SERVICE_UNAVAILABLE',
			details: 'Unable to reach Google reCAPTCHA service',
		});
	}

	if (!response.ok) {
		const errorText = await response.text();
		logger.error(`Google reCAPTCHA API HTTP error: ${response.status} ${response.statusText} - ${errorText}`);
		return res.status(503).json({
			success: false,
			error: 'RECAPTCHA_SERVICE_UNAVAILABLE',
			details: `Google reCAPTCHA service returned HTTP ${response.status}`,
		});
	}

	let data;
	try {
		data = await response.json();
	} catch (error) {
		logger.error(`Failed to parse Google reCAPTCHA response: ${error.message}`);
		return res.status(503).json({
			success: false,
			error: 'RECAPTCHA_SERVICE_UNAVAILABLE',
			details: 'Invalid response from Google reCAPTCHA service',
		});
	}

	// Check for error codes from Google reCAPTCHA API
	if (data.error_codes && data.error_codes.length > 0) {
		const errorCode = data.error_codes[0];
		const errorMessages = {
			'missing-input-secret': 'The secret parameter is missing',
			'invalid-input-secret': 'The secret parameter is invalid or malformed',
			'missing-input-response': 'The response parameter is missing',
			'invalid-input-response': 'The response parameter is invalid or malformed',
			'bad-request': 'The request is invalid or malformed',
			'timeout-or-duplicate': 'The response is no longer valid (timeout or duplicate)',
			'hostname-mismatch': 'The hostname does not match the domain registered for this site key',
			'invalid-keys': 'Keys are invalid or do not match',
			'invalid-input-size': 'The request body is too large',
			'invalid-padding': 'Invalid padding in request',
		};
		const errorMessage = errorMessages[errorCode] || `reCAPTCHA error: ${errorCode}`;
		logger.warn(`reCAPTCHA verification failed with error code '${errorCode}': ${errorMessage}`);
		return res.status(400).json({
			success: false,
			error: 'RECAPTCHA_VERIFICATION_FAILED',
			details: errorMessage,
		});
	}

	// Check if verification was successful
	if (!data.success) {
		logger.warn(`reCAPTCHA verification failed for token: ${token.substring(0, 20)}...`);
		return res.status(400).json({
			success: false,
			error: 'RECAPTCHA_VERIFICATION_FAILED',
			details: 'reCAPTCHA verification failed - token may be invalid or expired',
		});
	}

	const score = data.score || 0;
	const action = data.action || 'unknown';
	const challengeTimestamp = data.challenge_ts || null;
	const hostname = data.hostname || null;

	logger.info(`reCAPTCHA verification successful: score=${score}, action=${action}, hostname=${hostname}`);
  */

  // Mock successful response for development
  logger.info(`[DEV] Bypassed reCAPTCHA verification endpoint for token: ${token.substring(0, 10)}...`);
	res.json({
		success: true,
		score: 0.9,
		action: 'bypassed_for_dev',
		challenge_ts: new Date().toISOString(),
		hostname: 'localhost',
	});
});

export default router;