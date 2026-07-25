# AI & Tooling Reflection

## Did you use any AI tools?

Yes — Cursor, mainly for React scaffolding, chart boilerplate, and a first draft of the SQL.

## What did you use them for?

- Vite + React + TypeScript project setup  
- Initial SQL join structure and Recharts examples  
- README layout and some component styling  

I did not treat the output as finished work. I validated numbers, fixed data issues, and reworked UX when it did not make sense for an editor using the tool day to day.

## Did they speed up or change how you worked?

Yes — on repetitive front-end code. That freed time for the parts I care about: wrangling messy CSVs, writing correct aggregations, and turning raw stats into something a commissioning team could actually use.

---

## What I built — from data wrangling to business solution

I worked bottom-up: fix the data first, answer the SQL questions, then layer the product on top.

### 1. Data wrangling (foundation)

Before any charts, I had to make the dataset usable.

- Opened the official CSVs and compared them to the exercise PDF — column names and types do not match exactly (`Shorts` vs "Short Form", `data_date` in DD/MM/YYYY, `watchtime` instead of the PDF labels).  
- Found view counts stored with commas and titles breaking across lines inside quoted fields — a simple import would silently mis-parse rows.  
- Normalised dates and numbers on load so every downstream query works on clean types.  
- Ran sanity checks on coverage: 2,326 posts, ~188k stat rows, 12 channels, date span Jul 2025 – Jan 2026, and whether any videos were missing stats.

This step is easy to skip, but every wrong total I saw later traced back to parsing or schema assumptions.

### 2. SQL & analytics (core questions)

With clean data, I worked through the three brief questions in order:

1. **Q1 — Performance by video:** join `posts` and `poststats` on `video_id`, sum views/likes/watch time per video. This is the backbone of the video table and rankings.  
2. **Q2 — Format over time:** daily views split Long Form vs Shorts. This powers the trend view and format comparisons.  
3. **Q3 — Recent momentum:** top 5 videos in the last 28 days from reference date 2026-01-25, including converting DD/MM/YYYY dates in SQL.

AI gave me a starting join; I adjusted for comma-stripped views and the date logic until results matched what I could spot-check in the CSVs.

I then mirrored that same logic in the React app so the dashboard and `queries.sql` stay aligned — not two different definitions of "total views".

On top of the three required queries I added aggregations the UI needs: channel breakdown, format split, engagement over time, and headline KPIs (total views, watch minutes, video count).

### 3. Business-facing dashboard (solution layer)

The brief is really for editors and commissioners — people who need to slice the network and decide what to publish next. I built the UI around that:

- **Filters** (channel, format, date range, sort) so you can move from "whole network" down to one channel or one format in a period.  
- **Three chart modes** tied to the SQL questions — lifetime per video, daily format trend, top recent performers.  
- **Search** on titles and channels, with KPIs and insights following search results, not just the table.  
- **Insight cards** that respect context — e.g. when you filter to Shorts only, they compare against network-wide format share instead of saying "Shorts winning 100%".  
- **Paginated video table** (25 per page) with YouTube preview links for quick review of 2,326 videos.  
- **Editor assistant** (extra): a short editorial brief, suggested actions, and simple Q&A ("which channel performed best?", "what should we publish next?") over the same filtered data. Rule-based, not a live LLM — useful in a demo without faking an API call.

The product story is: raw CSV → trusted metrics → filters and views an editor can act on.

### 4. Debugging & verification

- Cross-checked React totals against the SQL definitions, especially the 28-day window.  
- Fixed cases where search or filters made the UI contradict itself (table showing matches while KPIs showed the full dataset).  
- Ran the production build and clicked through main flows before submitting.

---

## How I think about AI in this kind of work

AI helped me move faster on structure and syntax. The work I would walk through in an interview is the pipeline: wrangle the data, define the metrics correctly, then shape a tool around how someone on the PSN team would actually use it. That progression — low-level cleaning → SQL/analytics → business solution — is what I owned end to end, even where individual lines of code started from a suggestion.
