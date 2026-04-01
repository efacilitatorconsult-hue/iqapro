import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const updateExpiryForUser = async (userId) => {
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    data: { subscription_expires_at: expiry }
  });

  if (error) {
    throw error;
  }

  return expiry;
};

const parseRawBody = (event) => {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || '', 'base64');
  }
  return event.body || '';
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing webhook signature or secret' })
    };
  }

  let eventData;
  try {
    const rawBody = parseRawBody(event);
    eventData = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook signature verification failed: ${error.message}` })
    };
  }

  try {
    if (eventData.type === 'checkout.session.completed') {
      const session = eventData.data.object;
      const userId = session.metadata?.user_id;
      if (userId) {
        await updateExpiryForUser(userId);
      }
    } else if (eventData.type === 'invoice.payment_succeeded') {
      const invoice = eventData.data.object;
      const userId = invoice.metadata?.user_id;
      if (userId) {
        await updateExpiryForUser(userId);
      } else if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const subscriptionUserId = subscription.metadata?.user_id;
        if (subscriptionUserId) {
          await updateExpiryForUser(subscriptionUserId);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
