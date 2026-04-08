import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CRITICAL: Webhooks NEED the raw body for signature verification
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody, 
      signature, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    // This is where that metadata we added in the checkout file comes in!
    const userId = invoice.subscription_details?.metadata?.user_id || invoice.metadata?.user_id;
    
    if (userId) {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { subscription_expires_at: expiry }
      });
    }
  }

  res.status(200).json({ received: true });
}
