# FilmHub Online – Frontend

FilmHub Online is a web application for browsing and creating film-related events. 
It connects to a companion backend API hosted on Render.

## Live Links

Frontend (Netlify): https://filmhubonline.netlify.app  
Backend (Render): https://events-backend-0oer.onrender.com

## Tech Stack

- Next.js 14 (React)
- Tailwind CSS
- TypeScript
- Firebase Firestore (via backend API)
- Express backend
- TMDb API for movie poster data

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_BASE_URL=https://events-backend-0oer.onrender.com
```

## Key Features

- View a list of upcoming film events
- View detailed information for each event
- Create new events through a passcode-protected admin form
- Responsive and accessible design using Tailwind CSS
- Movie poster lookups through TMDb API

## Development

```bash
npm install
npm run dev
```
Then visit http://localhost:3000

For production:

```bash
npm run build
npm start
```

## Admin Access

To create new events:

1. Go to https://filmhubonline.netlify.app/admin  
2. Enter the passcode below  
3. Fill in and submit the event form

Admin passcode: launchpad2025!

## Notes for Assessors

- Frontend repository: https://github.com/garymorris350/events-frontend  
- Backend repository: https://github.com/garymorris350/events-backend  
- Admin passcode: launchpad2025!  
- Invoice ID: INV-20251009-001  
- PO Number: 1842  
- Submission date: 9 October 2025

## Accessibility

- Uses semantic HTML5 structure
- Tested with Lighthouse for color contrast
- Fully keyboard accessible

© 2025 Gary Morris – Project submitted to Northcoders Launchpad
