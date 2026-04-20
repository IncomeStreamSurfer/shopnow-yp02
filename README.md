# ShopNow

Ecommerce site built on Astro + Supabase + Stripe + Resend. Deployed to Vercel.

## Pages (19)
Home, /shop, /collections, 5 collection pages, 3 product pages, /cart, /checkout/success, /checkout/cancel, /about, /contact, /faq, /shipping-returns, /blog, /blog/[slug].

## Stack
- Astro 5 + @astrojs/vercel adapter (server output)
- Tailwind v4 via @tailwindcss/vite plugin
- Supabase (products, variants, orders, subscribers, contact_messages, content)
- Stripe Checkout (dynamic price_data) + webhook → Resend order confirmation
- @astrojs/sitemap + robots.txt + per-page JSON-LD

## Dev
```bash
npm install --legacy-peer-deps
cp .env.example .env   # fill in
npm run dev
```

## Next steps
- Verify a real sending domain on Resend and swap `onboarding@resend.dev` in `src/lib/email.ts`
- Connect a custom domain in Vercel
- Publish posts via Supabase `content` table — Harbor's Writer tool will do this automatically
