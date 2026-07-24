# Cycling Content Explorer

**Candidate:** Ahmed Bilal  
**Exercise:** Play Sports Network — Junior Full Stack Developer Technical Exercise

A small dashboard for exploring cycling video performance across GCN, GCN Tech, and EMBN.

---

## How to run the project

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### SQL (optional)

The queries in `queries.sql` can be run against the CSV data using SQLite:

```bash
sqlite3 content.db
.mode csv
.import data/posts.csv posts
.import data/poststats.csv poststats
.read queries.sql
```

**Project layout**

```
queries.sql          # 3 SQL queries
data/                # posts.csv, poststats.csv
frontend/            # React app (reads CSV from frontend/public/)
AI_REFLECTION.md     # AI tooling reflection
```

---

## What I built

### 1. SQL (`queries.sql`)

Three queries joining `posts` and `poststats` on `video_id`:

1. **Total views per video** — aggregated views, likes, and watch time per video
2. **Views by video type over time** — daily Long Form vs Short Form totals
3. **Top 5 videos in the last 28 days** — ranked by views in a rolling 28-day window

**Assumption:** I added a `stat_date` column to `poststats.csv` so queries 2 and 3 can group and filter by day. Sample metrics are synthetic; YouTube URLs in `posts.csv` link to real public videos.

### 2. Frontend (React + TypeScript + Vite)

An interactive dashboard that loads the CSV data and lets a content editor explore it without writing SQL:

- **Query switcher (Q1 / Q2 / Q3)** — main chart updates to match each SQL question
- **Filters** — channel, video type, date range, and sort (KPIs and charts update together)
- **KPI summary** — total views, likes, watch time, video count, average views
- **Charts** — views per video, format trend over time, top 5, channel breakdown, engagement over time
- **Table** — full video list with a Preview button
- **YouTube preview** — thumbnail and inline player for real GCN / EMBN videos

The aggregation logic in `frontend/src/data/processData.ts` mirrors the SQL queries in JavaScript.

### 3. AI reflection

See `AI_REFLECTION.md` for how AI tools were used and what was checked manually.

---

## One thing I would improve if I had more time

**Connect the dashboard to a live data source** (for example BigQuery or an internal API) instead of static CSV files. That would give editors up-to-date numbers, remove the need to sync `data/` and `frontend/public/`, and better reflect how the Data & Insight team would work in production.
