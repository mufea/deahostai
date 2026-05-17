import express from 'express';
import Stripe from 'stripe';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const tierPricing = {
  pro: { amount: 999, name: 'AI SaaS Pro' },
  enterprise: { amount: 9999, name: 'AI SaaS Enterprise' },
};

router.post('/create-checkout', pocketbaseAuth, async (req, res) => {
  const { tier, successUrl, cancelUrl } = req.body;
  const userId = req.pocketbaseUserId;

  if (!tier || !successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'tier, successUrl, and cancelUrl are required' });
  }

  if (!tierPricing[tier]) {
    return res.status(400).json({ error: 'Invalid tier. Must be "pro" or "enterprise"' });
  }

  const pricing = tierPricing[tier];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: pricing.name,
          },
          unit_amount: pricing.amount,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tier,
      userId: userId || 'guest',
    },
  });

  logger.info(`Checkout session created: ${session.id} for tier ${tier}`);

  res.json({ url: session.url });
});

router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  res.json({
    id: session.id,
    status: session.payment_status,
    tier: session.metadata?.tier,
    customerEmail: session.customer_details?.email,
  });
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const existingSubscription = await pocketbaseClient
          .collection('subscriptions')
          .getFirstListItem(`stripe_subscription_id = "${subscription.id}"`)
          .catch(() => null);

        if (existingSubscription) {
          await pocketbaseClient.collection('subscriptions').update(existingSubscription.id, {
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        } else {
          await pocketbaseClient.collection('subscriptions').create({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            tier: subscription.metadata?.tier,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        }

        logger.info(`Subscription updated for user ${userId}: ${subscription.id}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const existingSubscription = await pocketbaseClient
          .collection('subscriptions')
          .getFirstListItem(`stripe_subscription_id = "${subscription.id}"`)
          .catch(() => null);

        if (existingSubscription) {
          await pocketbaseClient.collection('subscriptions').update(existingSubscription.id, {
            status: 'cancelled',
          });

          logger.info(`Subscription cancelled for user ${userId}: ${subscription.id}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook event:', error);
    throw error;
  }
});

export default router;