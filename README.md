# Creatorum Waitlist Frontend (Next.js App Router)

## Dev

1. Start the backend:
   - `cd ../waitlist && npm run dev`
2. Start the frontend (runs on port 3001 to avoid conflicts):
   - `npm install`
   - `npm run dev`

Set `NEXT_PUBLIC_WAITLIST_API_BASE_URL` (see `.env.local.example`) if your backend isn't on `http://localhost:3000`.

## Admin

Open `http://localhost:3001/admin/login`.

Default credentials are documented in `../waitlist/README.md`.
# creatorum-waitlist
