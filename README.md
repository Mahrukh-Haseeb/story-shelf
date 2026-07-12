# ☕ StoryShelf Café

A living café where your life becomes a story. Log the books, films, music, and journal entries that shape you, and let AI find the quiet threads connecting them.

Built for United Hacks V7.

## Live Demo

- **App**: https://story-shelf-nine.vercel.app

## What it does

- Log books, films, music, and journal entries with mood, rating, and reflections
- **Memory Threads**: uses the Gemini API to read across your entries and surface a genuine thematic pattern in what you keep returning to
- **The Shelf That Doesn't Exist**: anything rated 1-2 stars quietly waits on a "ghost shelf" until you're ready to revisit it
- **Your Year**: a seasonal breakdown of everything you've logged, month by month
- **The Blog**: a searchable, chronological view of every reflection you've written

## Tech stack

- **Frontend**: HTML / CSS / vanilla JavaScript, deployed on Vercel
- **Backend**: Node.js + Express
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **AI**: Google Gemini API

## Project structure

```
story-shelf/
├── frontend/
│   └── index.html          # Single-file frontend (HTML/CSS/JS)
├── backend/
│   ├── api/
│   │   └── index.js        # Vercel serverless entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── server.js           # Express app (routes + Prisma client)
│   ├── package.json
│   └── vercel.json
└── vercel.json              # Root deployment config
```

## Running locally

**Backend:**
```bash
cd backend
npm install
# Create a .env file with DATABASE_URL and GEMINI_API_KEY
npx prisma generate
npm run dev
```

**Frontend:**
Just open `frontend/index.html` in a browser, or serve it with any static server. Update `API_URL` in the `<script>` tag if your backend isn't running on the deployed URL.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `GEMINI_API_KEY` | API key for Google's Gemini API |

## Known limitations

- Entries are currently shared across all logged-in accounts. The login/signup system exists, but entries aren't yet scoped to individual users. This is the top priority for a post-hackathon iteration.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/entries` | Get all entries |
| GET | `/api/entries/:id` | Get single entry |
| POST | `/api/entries` | Create entry |
| PUT | `/api/entries/:id` | Update entry |
| DELETE | `/api/entries/:id` | Delete entry |
| GET | `/api/stats` | Aggregate stats |
| POST | `/api/threads` | Generate a Memory Thread (Gemini AI) |
