# iqapro

AI-powered IQA sampling assistant built with Vite + React, Supabase Auth, and Stripe billing.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React + Tailwind CSS |
| Auth & Users | Supabase |
| Payments | Stripe Checkout |
| Hosting | Vercel |
| API | Vercel Serverless Functions (`/api`) |

---

## Local setup

```bash
cp .env.example .env   # fill in your keys (see below)
npm install
npm run dev
```

---

## Environment variables

Add these in Vercel (Settings → Environment Variables) and locally in `.env`:

| Variable | Scope | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend + Backend | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase → Project Settings → API |
| `VITE_STRIPE_PRICE_ID` | Frontend | Stripe → Products |
| `STRIPE_SECRET_KEY` | Backend only | Stripe → Developers → API Keys |
| `SUPABASE_URL` | Backend only | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only | Supabase → Project Settings → API |
| `STRIPE_WEBHOOK_SECRET` | Backend only | Stripe → Developers → Webhooks |

> **Never commit `.env`**. `VITE_` variables are bundled into public JS at build time — never put secrets in them.

---

## Vercel deployment

1. Push this repo to GitHub
2. Import the repo in the [Vercel dashboard](https://vercel.com/new)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add all environment variables from the table above
6. Deploy

Vercel auto-detects the `api/` folder and deploys each file as a serverless function. The `vercel.json` handles SPA routing fallback.

---

## Stripe webhook setup

The webhook keeps Supabase subscription status in sync when payments are processed.

1. In [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks → **Add endpoint**
2. Set endpoint URL to:
   ```
   https://<your-vercel-domain>/api/webhook
   ```
3. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
4. Copy the signing secret and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## How subscriptions work

- New sign-ups get a **30-day free trial** stored as `subscription_expires_at` in Supabase user metadata
- On expiry, the app blocks access and shows a renewal prompt
- On successful Stripe checkout, `/api/checkout-success` updates the expiry in Supabase immediately
- The webhook handles renewals and catches cases where the user closes the browser before the success redirect

---

## API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/create-checkout-session` | `POST` | Creates a Stripe Checkout session |
| `/api/checkout-success` | `GET` | Confirms payment and updates Supabase |
| `/api/webhook` | `POST` | Handles Stripe events for renewals |

---

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview production build locally
```
