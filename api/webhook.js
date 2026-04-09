  // Handle the event
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    const sessionOrInvoice = event.data.object;
    
    // Look for user_id in several possible places where Stripe stores metadata
    const userId = sessionOrInvoice.metadata?.user_id || 
                   sessionOrInvoice.subscription_details?.metadata?.user_id;
    
    if (userId) {
      // Set expiry to 30 days from now
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          subscription_expires_at: expiry,
          status: 'active' 
        }
      });

      if (error) console.error("Supabase Admin Error:", error.message);
    }
  }
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
