# TRONIX — Complete Setup Guide

A bilingual (English/Arabic) e-commerce store for laptop parts, built with React, Vite, Tailwind CSS, and Supabase.

---

## Table of Contents

1. [Why You Get a Blank Page](#1-why-you-get-a-blank-page)
2. [What This Project Uses](#2-what-this-project-uses)
3. [Prerequisites](#3-prerequisites)
4. [Step 1 — Create a Supabase Project](#step-1--create-a-supabase-project)
5. [Step 2 — Run the Database Migrations](#step-2--run-the-database-migrations)
6. [Step 3 — Set Up Storage](#step-3--set-up-storage)
7. [Step 4 — Deploy the Edge Function](#step-4--deploy-the-edge-function)
8. [Step 5 — Configure Environment Variables](#step-5--configure-environment-variables)
9. [Step 6 — Install Dependencies and Run](#step-6--install-dependencies-and-run)
10. [Step 7 — Create Your Admin Account](#step-7--create-your-admin-account)
11. [Step 8 — Configure Your Store](#step-8--configure-your-store)
12. [Deploying to Production](#deploying-to-production)
13. [Project Structure](#project-structure)
14. [Troubleshooting](#troubleshooting)

---

## 1. Why You Get a Blank Page

The app connects to a Supabase database on startup. If the connection environment variables are missing, the app throws an error before anything renders, and you see a blank white page.

**The fix:** Create a free Supabase project, run the included database migrations, and add three environment variables to a `.env` file. This guide walks you through every step.

> **Important:** This project uses **Supabase**, not Neon. Supabase is a free hosted PostgreSQL database with built-in authentication, file storage, and serverless functions. You cannot swap in Neon because the app relies on Supabase-specific features (Auth, Storage, Edge Functions, Row Level Security policies).

---

## 2. What This Project Uses

| Technology | Purpose |
|---|---|
| **React + Vite + TypeScript** | Frontend web app |
| **Tailwind CSS** | Styling |
| **Supabase (PostgreSQL)** | Database, authentication, file storage |
| **Supabase Edge Functions** | Server-side admin account management |
| **Supabase Storage** | Product images, banners, logo/favicon |
| **Supabase Auth** | Admin sign-in (email + password) |

---

## 3. Prerequisites

Install these on your computer before starting:

- **Node.js 18 or newer** — download from https://nodejs.org
- **A Supabase account** — sign up free at https://supabase.com
- **A code editor** — VS Code is recommended (free)

To check if Node.js is installed, open a terminal and run:

```
node --version
```

You should see something like `v20.x.x` or higher.

---

## Step 1 — Create a Supabase Project

1. Go to https://supabase.com and sign in (or create a free account).
2. Click **New Project**.
3. Fill in:
   - **Name:** TRONIX (or any name you like)
   - **Database Password:** Choose a strong password and save it somewhere safe. You will need it later.
   - **Region:** Choose the region closest to your customers.
   - **Pricing Plan:** Free tier is fine for development.
4. Click **Create new project**.
5. Wait 1–2 minutes for the project to provision. You will see a dashboard when it is ready.

---

## Step 2 — Run the Database Migrations

The project includes 6 SQL migration files that create all the database tables, security rules, and starter data. You need to run them in order.

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the migration files from your project folder, in this exact order:

   | Order | File |
   |---|---|
   | 1 | `supabase/migrations/20261104163532_tronix_01_core_schema.sql` |
   | 2 | `supabase/migrations/20261104163554_tronix_02_security_policies.sql` |
   | 3 | `supabase/migrations/20261104163629_tronix_03_order_stock_functions.sql` |
   | 4 | `supabase/migrations/20261104163645_tronix_04_storage_and_seed.sql` |
   | 5 | `supabase/migrations/20261104163800_tronix_05_admin_setup_check.sql` |
   | 6 | `supabase/migrations/20261104180150_tronix_06_governorate_shipping_and_announcement_speed.sql` |

4. For each file:
   - Copy the entire SQL content from the file.
   - Paste it into the SQL Editor.
   - Click **Run**.
   - Wait for the "Success" message before moving to the next file.

   **Run them one at a time, in order.** Each file depends on the previous one.

### What these migrations create:

- **13 product categories** (batteries, chargers, screens, keyboards, etc.) in English and Arabic
- **8 laptop brands** (Dell, HP, Lenovo, ASUS, etc.)
- **27 Egyptian governorates** with shipping fee support
- **Default store settings** (store name, currency, delivery fee, announcement bar)
- **Security rules** (row-level security on every table)
- **Database functions** for placing orders, adjusting stock, and changing order status
- **A storage bucket** called `store-media` for product images

---

## Step 3 — Set Up Storage

The 4th migration already creates the storage bucket and its security policies. You just need to verify it exists:

1. In your Supabase dashboard, click **Storage** in the left sidebar.
2. You should see a bucket called `store-media`.
3. If it is not there, run this in the SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-media', 'store-media', true)
ON CONFLICT (id) DO NOTHING;
```

The bucket is **public** (anyone can view images) but only admins can upload — the security policies from migration 4 handle this automatically.

---

## Step 4 — Deploy the Edge Function

The project has one Edge Function (`admin-users`) that handles creating and updating admin accounts securely on the server. You need to deploy it.

1. In your Supabase dashboard, click **Edge Functions** in the left sidebar.
2. Click **Deploy a new function**.
3. Name it: `admin-users`
4. Paste the entire contents of `supabase/functions/admin-users/index.ts` from your project.
5. Click **Deploy**.

### Verify the function secrets

The edge function needs two environment variables to connect to Supabase:

- `SUPABASE_URL` — your project URL
- `SUPABASE_SERVICE_ROLE_KEY` — your service role key

These are usually available automatically in edge functions. To verify:

1. In the Supabase dashboard, go to **Edge Functions** → select `admin-users`.
2. Click **Secrets**.
3. If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not listed, add them:
   - `SUPABASE_URL` = your project URL (from Step 5 below)
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key (from Step 5 below)

---

## Step 5 — Configure Environment Variables

1. In your Supabase dashboard, go to **Settings** (gear icon, bottom left) → **API**.
2. You will find three values you need:

   | Setting | Where to find it |
   |---|---|
   | **Project URL** | Settings → API → Project URL |
   | **anon public key** | Settings → API → Project API keys → `anon` `public` |
   | **service_role key** | Settings → API → Project API keys → `service_role` (click "Reveal" — keep this secret!) |

3. In your project folder, create a file named `.env` (if it does not exist). You can copy `.env.example` as a starting point:

   ```
   cp .env.example .env
   ```

4. Open `.env` and fill in your values:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...sQ
   VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key...sQ
   ```

   Replace the placeholder values with your actual Supabase keys.

5. **Never commit `.env` to git.** It is already in `.gitignore`.

### What each variable does:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | The address of your Supabase project. The app uses this to connect to the database. |
| `VITE_SUPABASE_ANON_KEY` | The public key that lets website visitors browse products and place orders safely. |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | The private key used only by the edge function to create admin accounts. **Never expose this in the browser.** It is only used server-side. |

---

## Step 6 — Install Dependencies and Run

1. Open a terminal in your project folder.
2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. Open the URL shown in the terminal (usually `http://localhost:5173`).

You should now see the TRONIX storefront instead of a blank page.

---

## Step 7 — Create Your Admin Account

The first time you set up the store, there are no admin accounts. You need to create the **super admin** account — this is a one-time step.

1. Open your browser and go to:

   ```
   http://localhost:5173/admin/setup
   ```

2. Fill in the form:
   - **Full Name** — your name
   - **Email** — this will be your login email
   - **Password** — at least 8 characters, choose a strong one
   - **Confirm Password** — re-enter the same password

3. Click **Create Account**.

4. You will be redirected to the sign-in page. Sign in with your new email and password.

After this, the setup page is locked. Nobody can create another super admin through it. You can create additional admins from inside the dashboard.

> **Note:** The admin setup uses the edge function you deployed in Step 4. If it fails, verify the edge function is deployed and its secrets are set.

---

## Step 8 — Configure Your Store

After signing in to the admin dashboard, you should configure your store settings:

1. Go to **Settings** in the sidebar.
2. **General tab:**
   - Set your store name, phone, WhatsApp number, email, and address.
   - Upload a logo and favicon (optional).
   - Set your currency code (default: USD).
   - Set the default delivery fee and free delivery threshold.
   - Configure the announcement bar text and speed.
3. **Homepage tab:** Toggle which sections appear on the homepage.
4. **Banners tab:** Add promotional slides for the homepage hero.
5. **Categories tab:** Add or edit product categories.
6. **Brands tab:** Add or edit product brands.
7. **Shipping tab:** Set delivery fees for each governorate.

Then start adding products:

1. Go to **Products** → click the **+** button.
2. Fill in product details (name, description, price, images, specs, etc.).
3. Go to **Inventory** to set stock levels.

---

## Deploying to Production

### Build the project

```
npm run build
```

This creates a `dist/` folder with the production files.

### Deploy to Netlify, Vercel, or similar

1. Push your project to a GitHub repository.
2. Connect the repository to your hosting provider (Netlify, Vercel, Cloudflare Pages, etc.).
3. Set the build command to `npm run build`.
4. Set the publish/output directory to `dist`.
5. Add these environment variables in your hosting provider's dashboard:

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |
   | `VITE_SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

6. Deploy. Your site will be live at the provider's URL or your custom domain.

### After deployment

1. Visit `https://yourwebsite.com/admin/setup` to create your super admin account (first time only).
2. Sign in at `https://yourwebsite.com/admin/signin`.
3. Add products and configure your store.

---

## Project Structure

```
project/
├── src/
│   ├── api/              # Database query functions (catalog, orders, admin, storage)
│   ├── components/
│   │   ├── admin/        # Admin dashboard layout and sidebar
│   │   ├── store/        # Storefront components (header, footer, product cards, etc.)
│   │   └── ui/           # Reusable UI elements (modals, forms, toasts, page states)
│   ├── context/          # React contexts (auth, cart, settings)
│   ├── i18n/             # Internationalization (English + Arabic translations)
│   ├── lib/              # Utilities (supabase client, router, formatting, types)
│   ├── pages/
│   │   ├── admin/        # Admin dashboard pages (overview, products, orders, etc.)
│   │   └── store/        # Storefront pages (home, shop, product, cart, checkout, etc.)
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles and Tailwind theme
├── supabase/
│   ├── migrations/       # SQL migration files (run in order)
│   ├── functions/        # Edge function source code
│   └── config.toml       # Supabase configuration
├── .env.example          # Template for environment variables
├── package.json          # Project dependencies and scripts
├── tailwind.config.js    # Tailwind CSS theme configuration
├── vite.config.ts        # Vite build configuration
└── ADMIN_GUIDE.md        # Guide for using the admin dashboard
```

---

## Troubleshooting

### Blank page after running `npm run dev`

**Cause:** Missing or incorrect `.env` file.

**Fix:**
1. Make sure `.env` exists in the project root (not in `src/`).
2. Make sure all three variables are set with correct values from your Supabase dashboard.
3. Restart the dev server (Ctrl+C, then `npm run dev` again).

### "The store database connection is not configured" error

This is the same issue — the `.env` file is missing or the variables are empty. Follow Step 5 above.

### Admin setup page fails ("server_error" or "fetch failed")

**Cause:** The edge function is not deployed or its secrets are missing.

**Fix:**
1. Go to your Supabase dashboard → Edge Functions.
2. Verify `admin-users` is deployed.
3. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets are set.

### Images not uploading

**Cause:** The storage bucket is missing or misconfigured.

**Fix:**
1. Go to Supabase dashboard → Storage.
2. Verify the `store-media` bucket exists and is public.
3. If missing, run the SQL from Step 3.

### Products or categories not showing

**Cause:** Migrations were not run, or were run out of order.

**Fix:**
1. Go to Supabase dashboard → SQL Editor.
2. Re-run all 6 migration files in order (Steps 2 above).
3. The migrations are safe to re-run — they use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`.

### "Email already registered" during admin setup

**Cause:** An admin account already exists.

**Fix:** Go to `/admin/signin` and sign in with your existing credentials instead. If you forgot the password, you can reset it from the Supabase dashboard → Authentication → Users.

### CORS errors in the browser console

**Cause:** The edge function is not returning CORS headers, or you are calling it from a different domain.

**Fix:** The edge function already includes CORS headers. If you are still seeing errors, make sure your Supabase project URL is correct in `.env`.

### Changes not appearing on the store

The store caches settings for performance. Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R). If the issue persists, verify you saved the changes in the admin dashboard.

---

## Quick Reference: Environment Variables

| Variable | Where to get it | Used by |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL | The website (browser) |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → Project API keys → `anon public` | The website (browser) |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API → Project API keys → `service_role` | The edge function only |

---

## Quick Reference: Common Commands

| Command | What it does |
|---|---|
| `npm install` | Install all project dependencies |
| `npm run dev` | Start the development server (http://localhost:5173) |
| `npm run build` | Create a production build in the `dist/` folder |
| `npm run typecheck` | Check for TypeScript errors |
| `npm run lint` | Run the linter to check code quality |

---

For the admin dashboard usage guide (managing products, orders, inventory, etc.), see [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).
