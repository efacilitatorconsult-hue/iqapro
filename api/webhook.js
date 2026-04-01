import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false
  }
};

const readRawBody = async (readable) => {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
};

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${error.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      if (userId) {
        await updateExpiryForUser(userId);
      }
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
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

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
