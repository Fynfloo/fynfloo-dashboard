# fynfloo-dashboard

URL: app.fynfloo.com
Hosting: Vercel (fynfloo-dashboard project)
Stack: Next.js App Router, Tailwind v4, custom component library

Auth:
  Custom JWT — access token in memory (15 min TTL)
  Refresh token httpOnly cookie (sameSite:strict)
  Proactive silent refresh with race condition guard
  Absolute session limit 7 days

Conventions:
  No HTML <form> tags — use onClick handlers
  Currency: always pence on API, display as GBP in UI
  All API calls go through lib/api.ts
  BFF pattern: all customer auth proxied via Next.js API routes

Pages:
  /dashboard/[storeId]                    → analytics overview
  /dashboard/[storeId]/products           → product management
  /dashboard/[storeId]/orders             → order management
  /dashboard/[storeId]/discounts          → discount codes
  /dashboard/[storeId]/customers          → customer list
  /dashboard/[storeId]/settings           → general settings
  /dashboard/[storeId]/settings/theme     → theme editor
  /dashboard/[storeId]/settings/payments  → Stripe Connect
  /dashboard/[storeId]/settings/shipping  → Step 16c (not started)
  /dashboard/[storeId]/settings/delivery  → Step 16g (not started)
  /dashboard/[storeId]/settings/domain    → custom domain
  /dashboard/[storeId]/settings/security  → security settings
  /dashboard/[storeId]/settings/pages     → page editor

Current step: 16c — Shipping settings UI
Output: diffs only — no explanation unless asked
