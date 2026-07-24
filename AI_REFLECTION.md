# AI & Tooling Reflection

## Did you use any AI tools?

Yes — Cursor, mainly while building the frontend and tidying the SQL.

## What did you use them for?

- Initial Vite + React setup and component structure
- First pass at the SQL joins and groupings
- README layout and some TypeScript/Recharts syntax checks

## Did they speed up or change how you worked?

They helped with boilerplate so I could spend more time on the data model, filter behaviour, and whether the UI made sense for a content editor. I still stepped through the SQL and CSV parsing myself rather than trusting the output blindly.

## What I checked manually

- Join between `posts` and `poststats`
- Totals and the 28-day top-five logic
- Date parsing (`data_date` is DD/MM/YYYY in the official files)
- Filters, search, pagination, and the preview player with real YouTube URLs
