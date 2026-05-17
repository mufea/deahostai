import 'dotenv/config';
import express from 'express';
import midtransClient from 'midtrans-client';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_ENVIRONMENT === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const tierCredits = {
  pro: 1000,
  enterprise: null, // unlimited
};

router.post('/create-transaction', pocketbaseAuth, async (req, res) => {
  const { user_id, subscription_tier, amount } = req.body;

  if (!user_id || !subscription_tier || !amount) {
    return res.status(400).json({ error: 'user_id, subscription_tier, and amount are required' });
  }

  if (!Object.hasOwn(tierCredits, subscription_tier)) {
    return res.status(400).json({ error: 'Invalid subscription_tier. Must be "pro" or "enterprise"' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const user = await pocketbaseClient.collection('users').getOne(user_id).catch(() => null);
  if (!user) {
    throw new Error('User not found');
  }

  const orderId = `ORDER-${user_id}-${Date.now()}`;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Math.round(amount * 100), // Convert to cents
    },
    customer_details: {
      email: user.email,
      first_name: user.name || 'Customer',
    },
    metadata: {
      user_id,
      subscription_tier,
    },
  };

  const snapToken = await snap.createTransaction(parameter);

  await pocketbaseClient.collection('transactions').create({
    user_id,
    order_id: orderId,
    subscription_tier,
    amount,
    status: 'pending',
    snap_token: snapToken.token,
  });

  logger.info(`Midtrans transaction created: ${orderId} for user ${user_id}`);

  res.json({
    snap_token: snapToken.token,
    order_id: orderId,
  });
});

router.post('/webhook', async (req, res) => {
  const payload = req.body;
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured');
  }

  const orderId = payload.order_id;
  const transactionStatus = payload.transaction_status;
  const signature = payload.signature_key;

  if (!orderId || !transactionStatus) {
    return res.status(400).json({ error: 'order_id and transaction_status are required' });
  }

  // Verify webhook signature
  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHash('sha512')
    .update(`${orderId}${payload.status_code}${payload.gross_amount}${serverKey}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn(`Invalid webhook signature for order ${orderId}`);
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Map Midtrans status to our status
  let status = 'pending';
  if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
    status = 'completed';
  } else if (transactionStatus === 'pending') {
    status = 'pending';
  } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
    status = 'failure';
  } else if (transactionStatus === 'expire') {
    status = 'expired';
  }

  // Find and update transaction
  const transaction = await pocketbaseClient
    .collection('transactions')
    .getFirstListItem(`order_id = "${orderId}"`)
    .catch(() => null);

  if (!transaction) {
    logger.warn(`Transaction not found for order ${orderId}`);
    return res.status(404).json({ error: 'Transaction not found' });
  }

  await pocketbaseClient.collection('transactions').update(transaction.id, {
    status,
  });

  // If payment is successful, update user subscription and credits
  if (status === 'completed') {
    const userId = transaction.user_id;
    const subscriptionTier = transaction.subscription_tier;

    const user = await pocketbaseClient.collection('users').getOne(userId);

    // Update subscription tier
    await pocketbaseClient.collection('users').update(userId, {
      subscription_tier: subscriptionTier,
    });

    // Award credits based on tier
    if (tierCredits[subscriptionTier] !== null) {
      const creditsToAward = tierCredits[subscriptionTier];
      const currentBalance = user.credits_balance || 0;
      const newBalance = currentBalance + creditsToAward;

      await pocketbaseClient.collection('users').update(userId, {
        credits_balance: newBalance,
      });

      await pocketbaseClient.collection('credit_history').create({
        user_id: userId,
        tool_type: 'subscription',
        credits_used: -creditsToAward,
        credits_remaining: newBalance,
        action_description: `Subscription bonus for ${subscriptionTier} tier`,
      });
    }

    logger.info(`Payment completed for order ${orderId}: user ${userId} upgraded to ${subscriptionTier}`);
  }

  res.json({ status: 'ok' });
});

router.get('/transaction-status/:order_id', async (req, res) => {
  const { order_id } = req.params;

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  const statusResponse = await snap.transaction.status(order_id);

  if (!statusResponse) {
    throw new Error(`Failed to retrieve transaction status for order ${order_id}`);
  }

  res.json({
    order_id: statusResponse.order_id,
    status: statusResponse.transaction_status,
    payment_method: statusResponse.payment_type,
    gross_amount: statusResponse.gross_amount,
  });
});

export default router;