import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

const REFERRAL_BONUS_CREDITS = 50;

router.post('/track', async (req, res) => {
  const { referrer_id, referred_user_id } = req.body;

  if (!referrer_id || !referred_user_id) {
    return res.status(400).json({ error: 'referrer_id and referred_user_id are required' });
  }

  if (referrer_id === referred_user_id) {
    return res.status(400).json({ error: 'referrer_id and referred_user_id cannot be the same' });
  }

  const referrer = await pocketbaseClient.collection('users').getOne(referrer_id).catch(() => null);
  if (!referrer) {
    throw new Error('Referrer user not found');
  }

  const referredUser = await pocketbaseClient.collection('users').getOne(referred_user_id).catch(() => null);
  if (!referredUser) {
    throw new Error('Referred user not found');
  }

  const existingReferral = await pocketbaseClient
    .collection('referrals')
    .getFirstListItem(`referrer_id = "${referrer_id}" && referred_user_id = "${referred_user_id}"`)
    .catch(() => null);

  if (existingReferral) {
    return res.status(400).json({ error: 'Referral already exists for this pair' });
  }

  await pocketbaseClient.collection('referrals').create({
    referrer_id,
    referred_user_id,
    status: 'completed',
  });

  const currentBalance = referrer.credits_balance || 0;
  const newBalance = currentBalance + REFERRAL_BONUS_CREDITS;

  await pocketbaseClient.collection('users').update(referrer_id, {
    credits_balance: newBalance,
  });

  await pocketbaseClient.collection('credit_history').create({
    user_id: referrer_id,
    tool_type: 'referral',
    credits_used: -REFERRAL_BONUS_CREDITS,
    credits_remaining: newBalance,
    action_description: `Referral bonus for referring ${referred_user_id}`,
  });

  logger.info(`Referral tracked: ${referrer_id} referred ${referred_user_id}, awarded ${REFERRAL_BONUS_CREDITS} credits`);

  res.json({
    success: true,
    bonus_credits: REFERRAL_BONUS_CREDITS,
  });
});

export default router;