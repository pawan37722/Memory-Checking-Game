# 🧠 Memory Card (React + Vite + Vercel)

Click every picture **once**. Click one twice and the game is over. Pictures reshuffle after every click.

Frontend (React) and backend (serverless API) live in **one folder**.

```
api/            Vercel serverless functions (auth, score, leaderboard, profile, cron)
server/         Local dev server that runs the same ./api handlers (for testing)
src/            React app (components, api helpers, styles)
public/picture/ Your photos: <folder>/img1.png ... img10.png
```

## 1. Setup

```bash
npm install
cp .env.example .env     # then fill in the values
```

| Variable       | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| `DATABASE_URL` | Neon Postgres connection string (tables are auto-created) |
| `JWT_SECRET`   | Any long random string                                    |
| `CRON_SECRET`  | Optional, protects the daily-reset endpoint               |

## 2. Run locally (frontend + backend together)

```bash
npm run dev
```

- React app: http://localhost:5173
- API: http://localhost:3001 (Vite proxies `/api/*` to it)

## 3. Photos

Put 10 images in each folder under `public/picture/` named `img1.png` … `img10.png`.
Missing photos show a coloured numbered placeholder, so the game is playable while testing.

## 4. Deploy to Vercel

1. Push this folder to GitHub (or run `npx vercel`).
2. Import the project in Vercel. Framework preset: **Vite** (auto-detected from `vercel.json`).
3. Add the environment variables `DATABASE_URL`, `JWT_SECRET` (and optionally `CRON_SECRET`).
4. Deploy. `api/` becomes serverless functions automatically.

### Daily leaderboard reset
`vercel.json` runs `/api/cron/reset-daily` at `30 6 * * *` (UTC) = **12:00 PM IST**.
Vercel cron uses UTC, change the schedule if you want a different time zone.

### Notes
- Vercel limits request bodies to ~4.5MB. Profile photos are resized in the browser before upload, so this is fine.
- `npm run build` creates `dist/`; `npm start` serves `dist/` + API from one Node process (non-Vercel hosting).
