# Darby Mitchell Studio — React + TypeScript

A bespoke React + TypeScript site showcasing the artwork of Darby Mitchell. The experience focuses on quiet drama—graphite depths against blush pink washes—with dedicated views for artwork, exhibitions, biography, and inquiries.

## Scripts

- `npm install` — install dependencies (TypeScript + CRA).
- `npm start` — run the development server at `http://localhost:3000`.
- `npm test` — run the Jest test suite (includes a smoke test for the navigation shell).
- `npm run build` — create a production build in `build/`.

> **Note:** If `npm` is unavailable on your machine, install Node.js first or use an alternative package manager such as `pnpm`/`yarn`.

## Structure

```
src/
  App.tsx                // Router + page layout
  index.tsx              // React root bootstrap
  components/            // Layout, navigation, footer, gallery grid, etc.
  pages/                 // Home, Artwork, About, Exhibitions, Contact
  data/                  // Artwork + exhibition data models
  styles/                // Reserved for shared styles (currently unused)
public/
  images/                // Placeholder SVGs — replace with high-res artwork
```

### Artwork imagery

Six placeholder SVGs (`public/images/*.svg`) mirror the palette from Darby’s drawings. Replace each file with the real artwork (keep the filenames to avoid code changes) or update the `image` paths in `src/data/artworks.ts`.

## Customising Content

- Update the copy on each page by editing the respective file in `src/pages/`.
- Add or reorder artworks in `src/data/artworks.ts`.
- Maintain exhibition history in `src/data/exhibitions.ts` — the home and exhibitions pages pull from this data.

## Styling Notes

- Core palette and typography live in `src/index.css` (CSS variables).
- Each component/page uses a CSS module for scoped styling, keeping the fine-art aesthetic consistent.
- Buttons and cards intentionally echo graphite shadows with blush accents; tweak gradients or radii inside the relevant `*.module.css` files.

## Deployment

When you are ready to deploy, run `npm run build` and point your static hosting provider (Netlify, Vercel, Render, S3, etc.) at the generated `build/` directory.

For questions or handoff details, see the `Contact` page implementation in `src/pages/Contact/Contact.tsx`.
