# GlowFest — Angular + YouTube
Standalone static Angular catalogue. No backend, admin/login, database, proxy, upload endpoints, or API keys.

## Run
Use Node.js 22.12+ (Node 24 recommended).
```sh
npm ci
npm start
```
Open http://localhost:4200. Build with `npm run build`.

## Edit products
Edit `src/app/data/products.ts`. Each product has a unique numeric `id`, `name`, `category` matching a collection ID, and `youtubeUrl`.
The four demo entries all use YouTube's official API demonstration video. Replace them with your own actual product names and YouTube URLs before publishing.
Supported values: watch URLs, youtu.be links, Shorts, live and embed URLs, or an 11-character video ID. Invalid/missing values show a message instead of an iframe.
Example: `{id:5,name:'Golden Rain',category:'adult',youtubeUrl:'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'}` (replace YOUR_VIDEO_ID).
No browser-only storage is used: edit the source, commit and redeploy to publish changes for all visitors.

## Collection images
Included SVG covers make the site work immediately. Put your own cover at `public/collections/adult/cover.webp` and change that collection's `image` to `collections/adult/cover.webp`; likewise for kid. No `public/` prefix in browser URLs. Add collections in the same metadata file.

## Playback
Click a product name to open a viewport-sized YouTube player. It requests autoplay with sound; browsers may require pressing YouTube's play button. Native YouTube controls remain available. Closing removes the iframe and stops playback; Escape closes the dialog when the parent document handles it. The page is scroll-locked while the dialog is open, including on mobile. Video quality is controlled by YouTube and the viewer, not forced by the catalogue. Private, restricted, deleted, or embedding-disabled videos may not play. Use public or unlisted videos with embedding enabled. Internet access is required. No YouTube connection is made until a product is opened.

## Vercel
Deploy this folder (the one containing package.json and angular.json). If placed inside your existing frontend folder, keep Vercel Root Directory set to frontend. If this folder is the repository root, leave Root Directory empty.
- Framework: Angular
- Build: npm run build
- Output: dist/firework-catalogue/browser
- Install: npm ci
The included vercel.json handles direct Angular routes. Replace old frontend files with this complete folder to avoid retaining admin routes or proxy settings. No backend deployment or environment variables are needed.

## Included behavior
Name-only product cards; search and A–Z/Z–A sorting; fixed 10 products per page; responsive desktop/mobile layouts; mobile hero hidden; collection image brightness and zoom on hover; accessible dialog with close button.

Existing SQLite records are not migrated because no database file or product YouTube links were supplied. Copy your product metadata into products.ts.
