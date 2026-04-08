// ... (imports and config stay the same)

const updateExpiryForUser = async (userId, periodEndTimestamp) => {
  // Convert Stripe's Unix timestamp (seconds) to ISO string
  const expiry = new Date(periodEndTimestamp * 1000).toISOString();
  
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { subscription_expires_at: expiry }
  });

  if (error) throw error;
  return expiry;
};

export default async function handler(req, res) {
  // ... (Method check and Signature verification stay the same)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Accessing the subscription to get the actual period end
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const userId = session.metadata?.user_id;

        if (userId) {
          await updateExpiryForUser(userId, subscription.current_period_end);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // Stripe invoices for subscriptions usually carry the sub ID
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata?.user_id;

          if (userId) {
            await updateExpiryForUser(userId, subscription.current_period_end);
          }
        }
        break;
      }
      
      // Consider handling 'customer.subscription.deleted' to revoke access immediately
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
