# Roamer's Ledger

A mobile-first travel planning web app built to feel like a real product, not a toy demo.

Roamer's Ledger combines itinerary planning, map-based trip exploration, transport and stay management, collaborative editing, expense tracking, checklist workflows, guest trial mode, and PDF export in a single Next.js application.

This repository is written as a portfolio-quality full-stack project: it shows product thinking, App Router architecture, server-first data loading, real third-party integrations, and non-trivial UI state across map, list, modal, and pricing flows.

## Highlights

- Plan trips in both list and map views
- Add stops with optional date/time or keep them unscheduled for later
- Manage flights/custom transport and stays
- Calculate travel times between route segments
- Share trips with collaborators and handle join approvals
- Track trip expenses and checklist items
- Support a guest `/try` mode with restrictions
- Export itinerary snapshots to PDF with Playwright
- Use a public marketing site plus authenticated workspace flows in one codebase

## Tech Stack

### Core

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- MongoDB + Mongoose

### UI / Interaction

- shadcn-style components built on Base UI
- Vaul drawer
- DnD Kit for stop reordering
- React Day Picker for calendar UX
- Embla carousel

### Auth / Billing / Infra

- Auth.js with Auth0
- Stripe Checkout + Stripe webhooks
- Vercel-friendly server actions and route handlers

### External APIs

- Google Maps JavaScript API
- Google Places
- Google Routes
- AirLabs flight lookup
- Geoapify place suggestions

### Tooling

- ESLint
- TypeScript type-checking
- Playwright for PDF rendering

## Product Surface

### Public experience

- Marketing landing page
- Feature landing pages for SEO
- Public guest trial entry at `/try`

### Authenticated workspace

- Home dashboard
- Trip list / plan list / expense list
- Trip detail page
- Planner list view and planner map view
- Expense page
- Checklist page
- Notifications
- Profile / upgrade / donate

## Interesting Engineering Decisions

- Server Components are used for data-heavy route rendering, with client components only where local interactivity is necessary
- Planner detail is implemented with intercepted modal routes rather than loading everything in one page component
- The app mixes direct server actions with a very small remaining route-handler surface for the cases that still need it, such as Stripe and flight lookup
- Guest mode is not a separate app; it reuses the same planner/detail surfaces with capability gating
- Planner data is normalized server-side, then rendered into timeline items for stops, stays, transport boundaries, and travel-time segments
- PDF export is generated server-side with Playwright rather than relying on browser print

## APIs and Services Connected

### Google Maps Platform

Used for:

- interactive map rendering
- place search / autocomplete
- place details such as photos, opening hours, phone, website, and rating
- route calculation

Environment variables:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_MAPS_SERVER_API_KEY` (recommended for server-side route calls)

### Auth0

Used for:

- sign-in / sign-out
- authenticated user identity
- protected workspace routes

Environment variables:

- `AUTH_SECRET`
- `AUTH_AUTH0_ID`
- `AUTH_AUTH0_SECRET`
- `AUTH_AUTH0_ISSUER`
- `NEXTAUTH_URL`

### MongoDB Atlas

Used for:

- trips
- stops
- stays
- transport
- expenses
- checklist items
- archived records
- usage tracking
- app settings / limits

Environment variables:

- `MONGODB_URI`
- `MONGO_DB_NAME` (optional, defaults to `waypoint`)

### Stripe

Used for:

- donation checkout
- Pro membership checkout
- webhook-driven membership updates

Environment variables:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`

### AirLabs

Used for:

- flight number route lookup
- airport metadata for transport autofill

Environment variable:

- `AIRLABS_API_KEY`

### Geoapify

Used for:

- nearby suggestion search in planner map view

Environment variable:

- `GEOAPIFY_API_KEY`

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

```env
AUTH_SECRET=your-random-secret
AUTH_AUTH0_ID=your-auth0-client-id
AUTH_AUTH0_SECRET=your-auth0-client-secret
AUTH_AUTH0_ISSUER=https://your-tenant.us.auth0.com
NEXTAUTH_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waypoint?retryWrites=true&w=majority
MONGO_DB_NAME=waypoint

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-browser-google-maps-key
GOOGLE_MAPS_SERVER_API_KEY=your-server-google-maps-key

AIRLABS_API_KEY=your-airlabs-key
GEOAPIFY_API_KEY=your-geoapify-key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

### 3. Configure providers

#### Google Maps

Enable the APIs your app uses:

- Maps JavaScript API
- Places API
- Routes API

Using a separate server key for route calculation is recommended.

#### Auth0

Create a Regular Web Application and add:

- callback URL: `http://localhost:3000/api/auth/callback/auth0`
- logout URL: `http://localhost:3000`
- web origin: `http://localhost:3000`

#### MongoDB

Create a database and point `MONGODB_URI` at it.

#### Stripe

If you want to test billing locally, run a webhook forwarder:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then copy the generated signing secret into `STRIPE_WEBHOOK_SECRET`.

### 4. Optional: seed app settings

The app has hardcoded fallback limits, so this is optional.

If you want a settings document in MongoDB, create one in `appSettings`:

```json
{
  "key": "default",
  "limits": {
    "basicActiveTrips": 2,
    "basicArchivedTrips": 3,
    "basicEditorTrips": 5,
    "basicEditorsPerTrip": 5,
    "basicRouteCallsPerMonth": 30,
    "proRouteCallsPerMonth": 100,
    "guestActiveTrips": 1,
    "guestStops": 5,
    "globalRouteCallsPerMonth": 10000
  }
}
```

### 5. Start the dev server

```bash
npm run dev
```

Open:

- `http://localhost:3000` for the main app
- `http://localhost:3000/try` for guest trial mode

## Validation

Useful checks during development:

```bash
npm run lint
npx tsc --noEmit
```

## What This Project Demonstrates

This project is useful in a hiring context because it is not just CRUD.

It demonstrates:

- App Router architecture with real route conventions
- server/client boundary decisions
- server actions and mutation workflows
- third-party API integration across auth, billing, maps, flights, and suggestions
- state-heavy UI with map, drag-and-drop, drawers, dialogs, and filters
- domain modeling for trips, stops, stays, transport, expenses, archived data, and guest mode
- product thinking around onboarding, free trial restrictions, upgrade flow, SEO, and PDF export

## Repository Notes

- The app is optimized for browser use, especially mobile-sized layouts
- Some features are intentionally capability-gated between guest, basic, and pro flows
- PDF export uses Playwright and requires a working browser runtime in the execution environment

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
```

---

If you are reviewing this repo for hiring or collaboration, the strongest areas to inspect are:

- `src/app` for route architecture
- `src/features/planner` for the main planning experience
- `src/features/trips`, `src/features/trip-logistics`, and `src/features/stops` for domain logic
- `src/app/api/stripe` for billing/webhook handling
