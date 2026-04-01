import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { Allow: 'GET' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sessionId = event.queryStringParameters?.sessionId || event.queryStringParameters?.session_id;
  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing sessionId' })
    };
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const userId = checkoutSession.metadata?.user_id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user metadata on Stripe session' })
      };
    }

    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      data: { subscription_expires_at: expiry }
    });

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ subscription_expires_at: expiry })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
