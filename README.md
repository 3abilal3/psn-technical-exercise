# PSN Content Performance

**Candidate:** Ahmed Bilal  
**Exercise:** Play Sports Network — Junior Full Stack Developer Technical Exercise

Dashboard for the official PSN YouTube dataset (`posts.csv` + `poststats.csv`, 2,326 videos, Jul 2025 – Jan 2026).

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open the URL from the terminal (usually `http://localhost:5173`).

Optional — sanity-check the CSVs:

```bash
node scripts/validate-data.mjs
```

## What's in the repo

```
queries.sql           three SQL questions (join posts + poststats)
data/                 posts.csv, poststats.csv
frontend/             React app (CSVs in frontend/public/)
scripts/              validate-data.mjs
AI_REFLECTION.md      AI tooling notes (required by the brief)
```

### SQL

Three queries in `queries.sql`, joined on `video_id`:

1. Total views per video (plus likes and watch time)  
2. Daily views by Long Form vs Shorts  
3. Top 5 videos in the last 28 days (reference date 2026-01-25)

The CSV uses `data_date` (DD/MM/YYYY) and `watchtime`; the SQL strips commas from view counts where needed.

To run in SQLite:

```bash
sqlite3 content.db
.mode csv
.import data/posts.csv posts
.import data/poststats.csv poststats
.read queries.sql
```

### Frontend

React + TypeScript + Vite + Recharts. Filter logic and aggregations live in `frontend/src/data/processData.ts` and follow the same ideas as the SQL.

- Filters: channel, video type, date range, sort  
- Search on the video table (title / channel)  
- Main chart switches between the three query views  
- Secondary charts: format split, channels, engagement  
- Paginated video table (25 per page)  
- YouTube preview from URLs in the CSV  

Dates and comma-separated numbers are cleaned on load in `csvLoader.ts`.

### AI reflection

See `AI_REFLECTION.md`.

---

## Extras (not required by the brief)

I added a few things while polishing the UI:

- **Insight cards** — short takeaways that respect active filters (e.g. won't say "Shorts winning" when you've already filtered to Shorts only)  
- **Editor assistant** at the bottom — summary, suggested actions, and simple Q&A over the filtered data. It's rule-based text, not a live LLM call; honest detail in `AI_REFLECTION.md`.

If I had more time, I'd wire this to a live data source instead of static CSVs in `public/`.
