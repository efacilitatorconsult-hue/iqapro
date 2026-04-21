import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CRITICAL: Disable bodyParser so Stripe can verify the raw request signature
export const config = {
  api: {
    bodyParser: false
  }
};

const updateExpiryForUser = async (userId) => {
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    data: {
      subscription_expires_at: expiry,
      status: 'active'
    }
  });

  if (error) throw error;
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

  let eventData;
  try {
    const rawBody = await buffer(req);
    eventData = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  try {
    if (eventData.type === 'checkout.session.completed') {
      const session = eventData.data.object;
      const userId = session.metadata?.user_id;
      if (userId) {
        await updateExpiryForUser(userId);
        console.log(`✅ Subscription activated for user ${userId}`);
      } else {
        console.warn('checkout.session.completed: no user_id in metadata');
      }
    } else if (eventData.type === 'invoice.payment_succeeded') {
      const invoice = eventData.data.object;
      // Try invoice metadata first, then fall back to fetching the subscription
      const userId = invoice.metadata?.user_id;
      if (userId) {
        await updateExpiryForUser(userId);
        console.log(`✅ Subscription renewed for user ${userId}`);
      } else if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const subscriptionUserId = subscription.metadata?.user_id;
        if (subscriptionUserId) {
          await updateExpiryForUser(subscriptionUserId);
          console.log(`✅ Subscription renewed (via sub lookup) for user ${subscriptionUserId}`);
        } else {
          console.warn('invoice.payment_succeeded: no user_id found in metadata or subscription');
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
    if (userId) {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { subscription_expires_at: expiry }
      });
    }
  }

  res.status(200).json({ received: true });
}
