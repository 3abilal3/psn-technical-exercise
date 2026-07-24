# PSN Content Performance

**Candidate:** Ahmed Bilal  
**Exercise:** Play Sports Network — Junior Full Stack Developer Technical Exercise

A React dashboard for exploring YouTube performance across PSN channels. It loads the official `posts.csv` and `poststats.csv` dataset (2,326 videos, 12 channels, Jul 2025 – Jan 2026).

---

## How to run

```bash
cd frontend
npm install
npm run dev
```

Open the URL from the terminal (usually `http://localhost:5173`).

To check the CSV files:

```bash
node scripts/validate-data.mjs
```

### SQL (optional)

```bash
sqlite3 content.db
.mode csv
.import data/posts.csv posts
.import data/poststats.csv poststats
.read queries.sql
```

Note: `poststats.csv` uses `data_date` (DD/MM/YYYY) and `watchtime`. The SQL handles comma-formatted numbers with `REPLACE`.

**Layout**

```
queries.sql
data/                 posts.csv, poststats.csv, SCHEMA.csv
frontend/             React app (CSVs copied to frontend/public/)
scripts/              validate-data.mjs
AI_REFLECTION.md
```

---

## What I built

### SQL

Three queries joining `posts` and `poststats` on `video_id`:

1. Total views (and likes / watch time) per video  
2. Daily views split by Long Form vs Shorts  
3. Top 5 videos by views in the last 28 days (reference date: 2026-01-25)

### Frontend

React, TypeScript, Vite, and Recharts. The JS in `frontend/src/data/processData.ts` mirrors the SQL logic.

- **Reports panel** — switch the main chart between Q1, Q2, and Q3  
- **Filters** — channel, format, date range, sort  
- **Search** — filter the video table by title  
- **KPI row** — videos, views, likes, channels, average views  
- **Charts** — bar/area charts, channel breakdown, engagement trend  
- **Video table** — 25 rows per page with pagination (full dataset stays in memory; only one page is rendered)  
- **Preview player** — YouTube embed from URLs in `posts.csv`

The CSV loader normalises `data_date` to ISO dates and strips commas from numeric fields before the app uses the data.

### AI reflection

See `AI_REFLECTION.md`.

---

## One improvement with more time

Hook the dashboard up to a live source (BigQuery or an internal API) instead of static CSVs, so editors always see current numbers without copying files into `frontend/public/`.
