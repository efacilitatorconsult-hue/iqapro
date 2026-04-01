# iqapro App

A Vite + React scaffold for the iqapro IQA sampling assistant.

## Setup

1. Open `c:\Users\jimol\Desktop\iqapro`
2. Copy `.env.example` to `.env` and add your Supabase values.
3. Run:
   ```bash
   npm install
   npm run dev
   ```

## Preview

Run:

```bash
npm run preview
```

## Deployment

### Vercel

1. Connect the `iqapro` folder in the Vercel dashboard.
2. Set the build command to:
   ```bash
   npm run build
   ```
3. Set the output directory to:
   ```text
   dist
   ```
4. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PRICE_ID`
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

The repository already includes `vercel.json` for static build deployment and `/api` billing endpoints.

### Netlify

1. Connect the `iqapro` folder in the Netlify dashboard.
2. Use the build command:
   ```bash
   npm run build
   ```
3. Set the publish directory to:
   ```text
   dist
   ```
4. Add environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PRICE_ID`
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`

This repo includes `netlify.toml` and a fallback redirect so routing works correctly. The Netlify config also rewrites `/api/*` to the built functions in `netlify/functions`.

## Stripe webhook setup

To keep Supabase subscription status synced even if users close the browser after checkout, set up a Stripe webhook for the app.

1. In Stripe Dashboard, create a webhook endpoint for the `checkout.session.completed` event.
2. Use one of these webhook URLs depending on your deployment target:
   - Vercel: `https://<your-domain>/api/webhook`
   - Netlify: `https://<your-domain>/.netlify/functions/webhook`
3. Add the returned webhook signing secret to your host as `STRIPE_WEBHOOK_SECRET`.
4. Optional events to add for improved renewal tracking:
   - `invoice.payment_succeeded`

## Notes

- New sign-ups receive a 30-day trial period stored in Supabase user metadata as `subscription_expires_at`.
- When a trial or subscription expires, iqapro limits access and shows a renewal prompt.
- Do not commit `.env` or Supabase secrets.
- For free-tier deployment, Vercel and Netlify are both good choices for a static Vite app.
- If you want subscription behavior later, the build output is already optimized for static hosting.
- “trigger deploy”

  
