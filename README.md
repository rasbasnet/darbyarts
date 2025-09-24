# Darby Mitchell Studio — React + TypeScript

Rebuilt portfolio site driven by structured data sourced from studio PDFs (Artist Deck, Work + Titles, Exhibition releases). Each page pulls copy and imagery from `src/data/` so updates only require editing JSON.

## Scripts

- `npm install` — install dependencies.
- `npm start` — run the development server at `http://localhost:3000`.
- `npm run build` — create a production build in `build/`.
- `npm run deploy` — push the compiled site to GitHub Pages (`gh-pages` branch).

## Data sources

- `public/files/` — original PDFs used for copy, downloadable from the site.
- `src/data/artworks.json` — artwork catalogue (title, medium, image path, palette, statements).
- `src/data/profile.json` — statement, bio, contact, education, and awards.
- `src/data/exhibitions.ts` — exhibitions and residencies.
- `src/data/posters.json` — poster editions available for Stripe checkout.
- `src/data/archiveWorks.ts` — legacy BFA works showcased on the About page.

All artwork imagery lives in `public/images/artworks/` and is referenced relatively, so deployments work cleanly from any origin.

## Styling notes

- Fonts: Fraunces (display) and Sora (body) via Google Fonts.
- Palette: punchy blush gradients with deep plum charcoal, animated slightly via scroll-reactive CSS variables (see `src/components/Layout/Layout.tsx`).
- Components use CSS modules for scoping; add new styles alongside each component.

## Deployment to GitHub Pages

Ensure the repository name matches the `homepage` value in `package.json`. Run `npm run deploy`; the script builds the app and publishes `build/` to the `gh-pages` branch. All routes use `process.env.PUBLIC_URL` to keep assets working from any base URL.

## Posters & commerce

### Environment variables (frontend)

Create a `.env.local` file and add:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_API_BASE_URL=http://localhost:4242
```

### Payment service (Node)

1. Create `server/.env` with your secrets:

```bash
STRIPE_SECRET_KEY=
# optional override
APP_URL=http://localhost:3000  # set to https://darbymitchell.art in production
```

2. Install dependencies and start both apps:

```bash
npm install
npm run server # in one terminal, starts http://localhost:4242
```

```bash
npm start     # in another terminal, frontend reads REACT_APP_API_BASE_URL for API calls
```

The build uses Stripe Checkout (cards, wallets) on `/posters`, supports poster detail pages (`/posters/:posterId`), surfaces a cart drawer + mobile cart prompt, and routes Stripe redirects to `/posters/checkout/result` for success/cancel summaries.

### Deployment notes

- The GitHub Pages build remains static. Deploy the payment server separately (Render, Railway, Fly.io, etc.) and set `APP_URL` to the public site origin.
- Update `REACT_APP_API_BASE_URL` (or override `apiBaseUrl` in `src/services/payments.ts`) if the payments API lives on a different host (e.g. `https://payments.example.com`).
