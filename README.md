# Events Platform

A simple events website for creating and sharing community events. Admins can create events; visitors can browse and view details. Optional TMDb integration provides poster artwork for film-themed events.

## Live URLs
- Frontend: https://<your-netlify-site>.netlify.app  
- Backend API: https://<your-render-backend>.onrender.com

## Features
- Events list and detail pages  
- Admin event creation (passcode protected)  
- Add-to-calendar link generation  
- Responsive UI with Tailwind CSS  
- Optional TMDb poster images  

## Tech
- Next.js + TypeScript + Tailwind  
- Express + Firestore (API)  
- Netlify (frontend), Render (backend)  
- Playwright for E2E tests  

## Quick Start (local)

```bash
# 1) install
npm install

# 2) set env
echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:10000' > .env.local

# 3) run dev
npm run dev
```

## Environment
- `NEXT_PUBLIC_API_BASE_URL` → your backend base URL (no trailing slash)  
- *(Optional)* `NEXT_PUBLIC_TMDB_API_KEY` → enables poster images  

## Scripts
- `npm run dev` → start Next.js dev server  
- `npm run build` → build for production  
- `npm run start` → run production server  
- `npm run lint` → run ESLint  
- `npm run test:e2e` → run Playwright tests (local)  

## Testing (Playwright)

```bash
npx playwright install --with-deps
npm run test:e2e
```

## Deployment
- **Netlify** → set `NEXT_PUBLIC_API_BASE_URL` in Site Settings → Build & Deploy → Environment.  
- Build command: `npm run build` (Netlify detects Next.js automatically).  

## License
MIT
