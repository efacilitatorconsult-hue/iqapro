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

The repository already includes `vercel.json` for static build deployment.

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
4. Add the same environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

This repo includes `netlify.toml` and a fallback redirect so routing works correctly.

## Notes

- Do not commit `.env` or Supabase secrets.
- For free-tier deployment, Vercel and Netlify are both good choices for a static Vite app.
- If you want subscription behavior later, the build output is already optimized for static hosting.
