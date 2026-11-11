This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Featured images

Featured images are stored in Supabase Storage and are optional per post.

1. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose this to the client)
2. Apply `supabase/migrations/20260310142911_new-migration.sql` to create the
   public-read `post-images` bucket. Writes go through the server-side
   service-role client, so no client upload policies are needed.
3. Set both variables in Vercel for deployed environments.

Uploads are limited to JPEG, PNG, and WebP, and images are downscaled and
re-encoded in the browser before upload. Without the environment variables,
image uploads return a clear "not configured" error while posts without
images keep working.

## Reply notification emails (Resend)

When someone comments on a post, the post's author receives an email through
[Resend](https://resend.com). The email is sent after the comment response, so
a Resend failure never blocks publishing. If `RESEND_API_KEY` is not set, the
feature is silently disabled.

1. Create a free Resend account and add an API key under **API Keys**.
2. Add a domain under **Domains** and create the DNS records Resend shows.
   The free plan only lets you send to arbitrary recipients from a verified
   domain. With the default `onboarding@resend.dev` sender, Resend only
   delivers to the email address that owns the Resend account.
3. Set these variables locally in `.env.local` and in Vercel:
   - `RESEND_API_KEY` — server-only API key (`re_...`).
   - `EMAIL_FROM` — a sender on your verified domain, e.g.
     `The Pigeon Post <notifications@your-domain.com>`.
   - `NEXT_PUBLIC_APP_URL` — the public origin used in the email link, e.g.
     `https://your-domain.com`.

The free plan includes 3,000 emails per month with a limit of 100 per day and
2 requests per second. No database changes are required.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database migrations

Schema migrations live in `drizzle/`.

- Locally: `npm run db:migrate`
- Production: migrations run automatically before `next build` via the
  `vercel-build` script, but only when `VERCEL_ENV=production`. Preview
  deployments do not run migrations.

`drizzle.config.ts` prefers `DIRECT_URL` (session-mode pooler) for migrations
and falls back to `DATABASE_URL` when it is not set.


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
