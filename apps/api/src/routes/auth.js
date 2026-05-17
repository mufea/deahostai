// TEMPORARY: reCAPTCHA verification disabled for development/testing - re-enable in production
import 'dotenv/config';
import express from 'express';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback';

const generateUniqueReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// TEMPORARY: reCAPTCHA verification disabled for development/testing - re-enable in production
router.post('/verify-captcha', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  // --- RECAPTCHA DISABLED FOR DEVELOPMENT ---
  /*
  const captchaSecretKey = process.env.CAPTCHA_SECRET_KEY;

  if (!captchaSecretKey) {
    throw new Error('CAPTCHA_SECRET_KEY is not configured');
  }

  const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
  const requestBody = new URLSearchParams({
    secret: captchaSecretKey,
    response: token,
  });

  const response = await fetch(verificationUrl, {
    method: 'POST',
    body: requestBody,
  });

  if (!response.ok) {
    logger.error(`Google reCAPTCHA API error: ${response.status} ${response.statusText}`);
    throw new Error(`Google reCAPTCHA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    logger.warn(`reCAPTCHA verification failed for token: ${token.substring(0, 20)}...`);
    return res.json({ success: false, error: 'CAPTCHA verification failed' });
  }

  const score = data.score || 0;
  logger.info(`reCAPTCHA verification successful with score: ${score}`);
  */
  
  // Mock successful response for development
  logger.info(`[DEV] Bypassed reCAPTCHA verification for token: ${token.substring(0, 10)}...`);
  res.json({ success: true, score: 0.9 });
});

router.post('/google', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials are not configured');
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    logger.error(`Google token exchange failed: ${tokenResponse.status} ${JSON.stringify(errorData)}`);
    throw new Error('Invalid authorization code');
  }

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    logger.error('No access token in Google response');
    throw new Error('Google authentication failed');
  }

  const accessToken = tokenData.access_token;

  // Fetch user info from Google
  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    logger.error(`Google userinfo fetch failed: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
    throw new Error('Google authentication failed');
  }

  const googleUser = await userInfoResponse.json();

  if (!googleUser.email) {
    logger.error('No email in Google user info');
    throw new Error('Google authentication failed');
  }

  const { email, name, picture } = googleUser;

  // Check if user exists in PocketBase
  let user = await pocketbaseClient
    .collection('users')
    .getFirstListItem(`email = "${email}"`)
    .catch(() => null);

  if (user) {
    // User exists - authenticate and return user data
    logger.info(`Google OAuth login for existing user: ${email}`);

    // Generate auth token
    const authData = await pocketbaseClient.collection('users').authWithPassword(email, user.password).catch(() => null);

    if (!authData) {
      // If password auth fails, create a session token directly
      const token = pocketbaseClient.authStore.token;
      return res.json({
        user_id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        token: token || '',
      });
    }

    return res.json({
      user_id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      token: authData.token,
    });
  }

  // User does not exist - create new user
  logger.info(`Creating new user from Google OAuth: ${email}`);

  // Generate unique referral code
  let referral_code = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const generatedCode = generateUniqueReferralCode();
    try {
      await pocketbaseClient.collection('users').getFirstListItem(`referral_code = "${generatedCode}"`);
      // If found, it's not unique, increment attempts and retry
      attempts++;
      logger.warn(`Referral code collision during Google OAuth signup, retrying... (${attempts}/${maxAttempts})`);
    } catch (err) {
      // getFirstListItem throws 404 if not found, which means the code IS unique
      if (err.status === 404) {
        referral_code = generatedCode;
        break;
      }
      // Other DB error
      logger.error('Database error checking referral code uniqueness:', err);
      attempts++;
    }
  }

  if (!referral_code) {
    logger.error('Failed to generate unique referral code after max attempts');
    throw new Error('Unable to generate unique referral code. Please try again.');
  }

  const newUser = await pocketbaseClient.collection('users').create({
    email,
    name: name || email.split('@')[0],
    avatar: picture || '',
    auth_provider: 'google',
    credits_balance: 100,
    subscription_tier: 'free',
    email_verified: true,
    referral_code,
    password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    passwordConfirm: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
  });

  // Authenticate the new user
  const authData = await pocketbaseClient
    .collection('users')
    .authWithPassword(email, newUser.password)
    .catch(() => null);

  logger.info(`New user created from Google OAuth: ${email} (ID: ${newUser.id}) with referral code: ${referral_code}`);

  res.json({
    user_id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    avatar: newUser.avatar,
    token: authData?.token || '',
  });
});

export default router;