import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.query.sessionId || req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = checkoutSession.metadata?.user_id;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user metadata on Stripe session' });
    }

    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      data: { subscription_expires_at: expiry }
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ subscription_expires_at: expiry });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
    return res.status(200).json({ subscription_expires_at: expiry });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
