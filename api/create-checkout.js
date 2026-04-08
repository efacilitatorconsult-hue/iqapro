import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

// IMPORTANT: Do NOT set bodyParser to false here! 
// Next.js needs it to read priceId and userId.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, userId, customerEmail } = req.body;
    
    if (!priceId || !userId) {
      console.error("Missing fields:", { priceId, userId });
      return res.status(400).json({ error: 'Missing priceId or userId' });
    }

    // Default to your production URL if headers are missing
    const origin = req.headers.origin || 'http://localhost:5173'; 

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      // Metadata at the SESSION level
      metadata: {
        user_id: userId
      },
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      subscription_data: {
        // Metadata at the SUBSCRIPTION level (Crucial for your webhook!)
        metadata: {
          user_id: userId,
          created_by: 'iqapro-app'
        }
      }
    });

    // Return the URL for the frontend to redirect the user
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Session Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}    return res.status(500).json({ error: error.message });
  }
}
