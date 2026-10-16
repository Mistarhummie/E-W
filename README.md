# EastWest Fashions Ke website

The new eastwest.ke: a fast, server-rendered shop for football jerseys and gym wear, with an admin for the EastWest team.

- **Shop:** home, jerseys (JD Sports-style layout with deal countdowns), gym wear (Gymshark-style), kids, search and filters, wishlist.
- **Jersey customisation:** name, number, font and badges on every eligible shirt, with a live preview on the back of the shirt. Prices come from the admin.
- **Checkout:** M-Pesa (Daraja STK push), cards (Paystack), pay at pickup; pickup at either store or delivery anywhere in Kenya by zone; free delivery over KSH 10,000.
- **Accounts:** phone + SMS code, email + password, or Google; guest checkout. Customers can download or delete their data (Data Protection Act).
- **Discount codes:** % off, KSH off, free delivery, free printing, buy X get Y, influencer codes with usage and revenue reports, gift vouchers, automatic offers.
- **Admin (`/admin`):** products, prices, stock, banners (images, GIFs, video, scheduling), blog, pages, orders, customers, discount codes, stores and delivery zones. Roles: Owner, Manager, Store staff (own store only), Writer (blog only). Includes a nightly **Print queue** with a printable job sheet.
- **Notifications:** SMS (Africa's Talking) and email at every order status change.

Built with Next.js 16, Payload CMS 3 and PostgreSQL. Designed to run on Vercel.

## Run it locally

You need Node 20+ and PostgreSQL 15+.

```bash
cp .env.example .env          # then set DATABASE_URL and PAYLOAD_SECRET
npm install
npm run seed                  # sample catalogue, stores, blog posts and an owner login
npm run dev                   # http://localhost:3000 and http://localhost:3000/admin
```

The seed creates the owner account from `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` (defaults to `owner@eastwest.ke` with a starter password printed by the seed). **Change the password on first login.** `npm run seed -- --fresh` wipes and re-creates the sample catalogue.

With `DEMO_MODE=true` and no payment keys, checkout shows a "Test mode: mark as paid" button and login codes appear on screen instead of by SMS. Turn it off in production.

## Import the current products

The importer reads a CSV or JSON export (from the current site's admin or developer):

```bash
npm run import:products -- ./products.csv            # live straight away
npm run import:products -- ./products.csv --hidden   # hidden until reviewed in the admin
```

Columns: `title, price, compare_at_price, section, category, club, season, gender, description, images, customisable, size_group, legacy_url`. Only `title`, `price` and `category` are required. `images` is a list of image URLs separated by `|`. Re-running updates matching products instead of duplicating them. Products without a photo stay off the site until one is added.

`legacy_url` is the product's old address (for example `/product/arsenal-home-jersey`). Visitors and Google following the old link are sent to the new page with a permanent redirect.

## Settings (environment variables)

All keys live in Vercel → Project → Settings → Environment Variables, never in the code. See `.env.example` for the full list.

| What | Variables | Notes |
| --- | --- | --- |
| Database | `DATABASE_URL` | Neon or Supabase Postgres |
| Security | `PAYLOAD_SECRET`, `MPESA_CALLBACK_SECRET` | long random strings |
| Site address | `NEXT_PUBLIC_SITE_URL` | `https://eastwest.ke` in production |
| M-Pesa | `MPESA_*` | sandbox until the Paybill/Till is approved; then `MPESA_ENV=production` and the live keys |
| Cards | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | set the Paystack webhook to `https://eastwest.ke/webhooks/paystack` |
| SMS | `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID` | Africa's Talking |
| Email | `SMTP_*` | any SMTP provider |
| Google login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | redirect URI `https://eastwest.ke/auth/google/callback` |
| Uploads | `BLOB_READ_WRITE_TOKEN` | created by adding Vercel Blob storage to the project |

## Deploy to Vercel

1. Create the Vercel, Neon (Postgres) and Daraja/Paystack/Africa's Talking accounts in EastWest's business email.
2. Import this repository in Vercel, add the environment variables above, and add **Vercel Blob** storage (it sets `BLOB_READ_WRITE_TOKEN`).
3. Deploy. On the first deploy Payload creates the database tables. Then open `/admin` and create the owner account (the first account created becomes the owner).
4. Add the stores, delivery zones, badges and settings in the admin, and import the products.
5. Point the `eastwest.ke` domain at Vercel (needs the registrar login).

## Useful commands

```bash
npm run dev              # local development
npm run build            # production build
npx tsc --noEmit         # type check
npm run lint             # lint
npm run test:int         # pricing, discount and phone-number tests
npm run test:e2e         # browser tests (needs the dev database seeded)
npm run generate:types   # after changing a collection
```

## Before launch

- Replace "EastWest Store 2" and the placeholder opening hours in Admin → Stores.
- Apply for an M-Pesa Paybill (or Till) and switch `MPESA_ENV` to production.
- Get the eastwest.ke registrar login and a customer/order export from the current developer.
