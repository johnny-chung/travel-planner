# Roamer's Ledger — Travel Planner

A mobile-first travel planning web app built with Next.js 16, Auth0, MongoDB, and Google Maps.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Maps API Setup](#google-maps-api-setup)
3. [Auth0 Setup](#auth0-setup)
4. [MongoDB Setup](#mongodb-setup)
5. [Stripe Setup](#stripe-setup)
6. [Environment Variables](#environment-variables)
7. [Running the App](#running-the-app)

---

## Prerequisites

- **Node.js** v18 or higher
- A **Google account** (for Google Cloud / Maps)
- An **Auth0 account** (free at auth0.com)
- A **MongoDB** database (free at mongodb.com/atlas)

---

## Google Maps API Setup

This is the most important step. The app needs three Google APIs enabled.

### Step 1 — Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Give it a name (e.g. `waypoint-travel`) and click **Create**
4. Make sure your new project is selected in the dropdown

### Step 2 — Enable Billing

Google Maps APIs require a billing account (you get $200/month free credit, enough for personal use).

1. In the left sidebar go to **Billing**
2. Link or create a billing account

### Step 3 — Enable the Required APIs

Go to **APIs & Services → Library** and search for and enable each of these:

| API | What it does |
|-----|-------------|
| **Maps JavaScript API** | Renders the interactive map |
| **Places API** | Powers the search box and location details (hours, phone, photos) |
| **Geocoding API** | Converts a map tap (lat/lng) into an address |

For each one: search → click the result → click **Enable**.

### Step 4 — Create an API Key

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → API key**
3. Copy the key — this is your `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Step 5 — Restrict the API Key (Recommended)

To prevent unauthorised use of your key:

1. Click the pencil icon next to your API key
2. Under **Application restrictions** → select **Websites**
3. Add your allowed referrers:
   ```
   http://localhost:3000/*
   https://yourdomain.com/*
   ```
4. Under **API restrictions** → select **Restrict key**
5. Select these three APIs: Maps JavaScript API, Places API, Geocoding API
6. Click **Save**

---

## Auth0 Setup

### Step 1 — Create an Auth0 Account and Application

1. Sign up at [https://auth0.com](https://auth0.com) (free tier is fine)
2. Go to **Applications → Applications → Create Application**
3. Name it (e.g. `Waypoint`) and choose **Regular Web Application**
4. Click **Create**

### Step 2 — Configure Callback URLs

In your application settings, fill in:

| Field | Value |
|-------|-------|
| Allowed Callback URLs | `http://localhost:3000/api/auth/callback/auth0` |
| Allowed Logout URLs | `http://localhost:3000` |
| Allowed Web Origins | `http://localhost:3000` |

For production, add your production URLs alongside the localhost ones (comma-separated).

### Step 3 — Copy Your Credentials

From the **Basic Information** section of your application, copy:

- **Domain** → `AUTH_AUTH0_ISSUER` (prefix with `https://`, e.g. `https://dev-xxxx.us.auth0.com`)
- **Client ID** → `AUTH_AUTH0_ID`
- **Client Secret** → `AUTH_AUTH0_SECRET`

---

## MongoDB Setup

### Option A — MongoDB Atlas (Free Cloud, Recommended)

1. Sign up at [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free **M0 cluster** (choose any region)
3. Under **Database Access** → Add a database user with a username and password
4. Under **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) for development
5. Go to **Clusters → Connect → Drivers**
6. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your database user password and add the database name:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/waypoint?retryWrites=true&w=majority
   ```

### Option B — Local MongoDB

```bash
# Install and run MongoDB locally
brew install mongodb-community   # macOS
# or download from mongodb.com/try/download/community

mongod --dbpath ~/data/db

# Connection string:
MONGODB_URI=mongodb://localhost:27017/waypoint
```

---

## Stripe Setup

The app uses Stripe for two purposes:

- **Donations** — one-time payment on the Donate page (no membership change)
- **Pro Membership** — recurring subscription that upgrades the user's `membershipStatus` to `"pro"` in MongoDB

### How payment confirmation works

Stripe uses **webhooks** — after a successful payment, Stripe sends a `POST` request to your app's webhook endpoint (`/api/webhooks/stripe`). Your handler verifies the event signature, then updates the user's record in MongoDB. This is the only reliable method: a redirect URL alone is not safe because users can close the browser before it fires.

```
User pays → Stripe processes → Stripe POST /api/webhooks/stripe
                                       ↓
                              verify signature
                                       ↓
                    User.findOneAndUpdate({ membershipStatus: "pro" })
```

---

### Step 1 — Create a Stripe Account

1. Sign up at [https://stripe.com](https://stripe.com)
2. You start in **Test Mode** — all test card numbers work without real charges

---

### Step 2 — Get Your API Keys

1. In the Stripe Dashboard, go to **Developers → API keys**
2. Copy:
   - **Publishable key** → starts with `pk_test_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → starts with `sk_test_...` → `STRIPE_SECRET_KEY`

> For production, switch to **Live mode** (toggle top-left) and copy the live keys.

---

### Step 3 — Create Products and Prices

#### 3a — Pro Membership (Recurring Subscription)

1. Go to **Product catalogue → + Add product**
2. **Name**: `Pro Membership`
3. Under **Pricing**, set:
   - **Pricing model**: Standard pricing
   - **Price**: e.g. $9.99
   - **Billing period**: Monthly (or yearly — your choice)
   - **Currency**: USD (or your preference)
4. Click **Save product**
5. On the product page, click the price row → copy the **Price ID** (starts with `price_...`) → `STRIPE_PRO_PRICE_ID`

#### 3b — Donation (One-time)

The donation page lets users enter any amount dynamically. No fixed product is needed — the app creates a Stripe Checkout session with a custom amount at the time of payment. No Price ID is required for donations.

---

### Step 4 — Set Up the Webhook

Stripe needs to be able to call your app when a payment succeeds. In development you use the Stripe CLI to forward events locally; in production you register your live URL.

#### Development (Stripe CLI)

1. Install the Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Log in:
   ```bash
   stripe login
   ```
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The CLI prints a **webhook signing secret** like `whsec_...` — copy it → `STRIPE_WEBHOOK_SECRET`

> Keep this terminal running while you test payments locally.

#### Production

1. In the Stripe Dashboard go to **Developers → Webhooks → + Add endpoint**
2. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
3. Under **Events to listen to**, add:
   - `checkout.session.completed` — fires when any payment succeeds
   - `customer.subscription.deleted` — fires when a Pro subscription is cancelled/expires
   - `invoice.payment_failed` — fires when a subscription renewal fails
4. Click **Add endpoint**
5. On the endpoint detail page, reveal the **Signing secret** → copy it → `STRIPE_WEBHOOK_SECRET`

---

### Step 5 — Add Environment Variables

Add these to your `.env.local`:

```env
# ─── Stripe ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...        # Only needed for Pro subscription
```

---

### Step 6 — Test a Payment

Use Stripe's test card numbers (Test Mode only):

| Card number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Use any future expiry date, any 3-digit CVC, and any postal code.

---

### Webhook Event Reference

| Event | What it means | App action |
|-------|--------------|------------|
| `checkout.session.completed` | Payment succeeded (donation or sub) | If Pro sub → set `membershipStatus = "pro"` |
| `customer.subscription.deleted` | Sub cancelled or expired | Set `membershipStatus = "basic"` |
| `invoice.payment_failed` | Sub renewal failed | Set `membershipStatus = "basic"` |

The user ID is passed as `metadata.userId` when creating the Checkout session, so the webhook can look up the correct MongoDB document.

---

Create a `.env.local` file in the project root (it is already gitignored):

```env
# ─── AuthJS ────────────────────────────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Or on Mac/Linux: openssl rand -base64 32
AUTH_SECRET=your-random-secret-here

# ─── Auth0 ─────────────────────────────────────────────────────────────────────
AUTH_AUTH0_ID=your-auth0-client-id
AUTH_AUTH0_SECRET=your-auth0-client-secret
AUTH_AUTH0_ISSUER=https://your-domain.us.auth0.com

# ─── MongoDB ───────────────────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/waypoint?retryWrites=true&w=majority

# ─── Google Maps ───────────────────────────────────────────────────────────────
# Must be prefixed with NEXT_PUBLIC_ so the browser can access it
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# ─── Stripe ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...        # Price ID for Pro membership subscription

# ─── App URL ───────────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
```

### Generating AUTH_SECRET

**Windows (PowerShell):**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Mac / Linux:**
```bash
openssl rand -base64 32
```

---

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to the login page.

### Build for Production

```bash
npm run build
npm start
```

---

## Troubleshooting

### Map is blank or shows "This page can't load Google Maps correctly"
- Make sure **Maps JavaScript API**, **Places API**, and **Geocoding API** are all enabled in Google Cloud
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Check that billing is enabled on your Google Cloud project
- If you restricted the key, make sure `http://localhost:3000/*` is in the allowed referrers

### Auth0 login redirects to an error page
- Double-check `AUTH_AUTH0_ISSUER` includes `https://` and has no trailing slash
- Verify the Callback URL in Auth0 matches exactly: `http://localhost:3000/api/auth/callback/auth0`
- Make sure `AUTH_SECRET` is set (any long random string)

### MongoDB connection error
- Check the `MONGODB_URI` includes your actual password (not `<password>`)
- In Atlas, verify your current IP is allowed under **Network Access**
- Try adding `0.0.0.0/0` to Network Access for development

### Search box not finding places
- The **Places API** must be enabled (separate from Maps JavaScript API)
- The API key must have Places API access (check API restrictions)

### Stripe webhook returns 400 "No signatures found"
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret shown in the Stripe Dashboard for that endpoint
- In development, ensure `stripe listen --forward-to localhost:3000/api/webhooks/stripe` is running
- The webhook route must read the raw request body as a `Buffer` — do **not** parse it as JSON before calling `stripe.webhooks.constructEvent`

### Pro membership not upgrading after payment
- Check your webhook endpoint is registered for `checkout.session.completed` in the Stripe Dashboard
- Verify you are passing `metadata: { userId: session.user.id }` when creating the Checkout session
- In development, check the Stripe CLI terminal — it shows each event and whether your endpoint returned 200

