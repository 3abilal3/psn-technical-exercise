# AI & Tooling Reflection

## Did you use any AI tools?

Yes — Cursor, mostly for the React app and a first draft of the SQL.

## What did you use them for?

- Scaffolding the Vite + React project  
- SQL joins and groupings (I reworked these myself)  
- Some component layout and Recharts syntax  

## Did they speed up or change how you worked?

They saved time on boilerplate so I could focus on the data joins, date parsing, and whether the filters behaved correctly. I still checked totals and edge cases manually rather than trusting generated output.

## What I checked manually

- Join between `posts` and `poststats`  
- Q3 28-day window and reference date  
- `data_date` parsing (DD/MM/YYYY in the official files)  
- Filters, search, pagination, YouTube preview  
- CSV import quirks (multiline fields, comma-formatted numbers) — see `csvLoader.ts` and `scripts/validate-data.mjs`  

The editor assistant at the bottom uses simple rules over the filtered dataset (summary + keyword Q&A), not an external API. I noted that in the README under Extras.
