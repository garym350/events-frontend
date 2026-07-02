# FilmHub Online - Frontend

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

Create a `.env.local` file in the frontend root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:10000
```

The frontend only needs `NEXT_PUBLIC_API_BASE_URL`. Admin passcodes, password hashes, Firebase credentials, TMDb keys, and session secrets must stay on the backend.

## Key Features

- View a list of upcoming film events
- View detailed information for each event
- Create, edit, and delete events through an admin login flow
- Responsive and accessible design using Tailwind CSS
- Movie poster lookups through TMDb API

## Development

Install dependencies and start the frontend:

```bash
npm install
npm run dev
```

Then visit http://localhost:3000. In a second terminal, start the backend API from the backend package root.

For production:

```bash
npm run build
npm start
```

## Admin Access

Admin users log in at `/admin/login`. The frontend sends the passcode once to the backend login endpoint and stores the returned admin session token in the browser for subsequent admin create, edit, and delete requests.

The frontend does not know or store the backend passcode hash or session secret. Configure these only on the backend with `ADMIN_PASSCODE_HASH` and `ADMIN_SESSION_SECRET`.

## Notes for Assessors

- Frontend repository: https://github.com/garymorris350/events-frontend  
- Backend repository: https://github.com/garymorris350/events-backend  
- Invoice ID: INV-20251009-001  
- PO Number: 1842  
- Submission date: 9 October 2025

## Accessibility

- Uses semantic HTML5 structure
- Tested with Lighthouse for color contrast
- Fully keyboard accessible

© 2025 Gary Morris – Project submitted to Northcoders Launchpad
