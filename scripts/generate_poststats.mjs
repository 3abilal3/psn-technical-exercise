import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const POSTS = [
  ['vid001', '2026-06-01', 'Long Form', 1262],
  ['vid002', '2026-06-05', 'Short Form', 264],
  ['vid003', '2026-06-10', 'Long Form', 848],
  ['vid004', '2026-06-12', 'Long Form', 1120],
  ['vid005', '2026-06-15', 'Short Form', 142],
  ['vid006', '2026-06-18', 'Long Form', 936],
  ['vid007', '2026-06-22', 'Long Form', 480],
  ['vid008', '2026-06-25', 'Long Form', 854],
  ['vid009', '2026-06-28', 'Long Form', 639],
  ['vid010', '2026-07-01', 'Long Form', 1038],
];

const END = new Date('2026-07-02T00:00:00Z');
const rows = [];

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

for (const [vid, pub, vtype, lengthSec] of POSTS) {
  const seed = [...vid].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  let dayIdx = 0;
  let d = new Date(`${pub}T00:00:00Z`);

  while (d <= END) {
    const growth = 1 + Math.min(dayIdx, 14) * 0.012;
    let views;
    let likes;
    let comments;
    let shares;
    let emw;

    if (vtype === 'Long Form') {
      const base = 8200 + (seed % 900);
      views = Math.round((base + dayIdx * 210 + (seed % 97)) * growth);
      likes = Math.max(180, Math.floor(views / 28));
      comments = Math.max(18, Math.floor(views / 320));
      shares = Math.max(8, Math.floor(views / 520));
      emw = Math.round(views * (lengthSec / 60) * 0.18 * 10) / 10;
    } else {
      const base = 26000 + (seed % 1200);
      views = Math.round((base + dayIdx * 480 + (seed % 113)) * growth);
      likes = Math.max(520, Math.floor(views / 48));
      comments = Math.max(6, Math.floor(views / 2800));
      shares = Math.max(55, Math.floor(views / 420));
      emw = Math.round(views * (lengthSec / 60) * 0.22 * 10) / 10;
    }

    rows.push([vid, formatDate(d), likes, comments, shares, views, emw]);
    d = addDays(d, 1);
    dayIdx += 1;
  }
}

rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));

const header = 'video_id,stat_date,likes,comments,shares,views,estimated_minutes_watched\n';
const body = rows.map((row) => row.join(',')).join('\n');
const csv = `${header}${body}\n`;

const root = path.resolve(__dirname, '..');
for (const rel of ['frontend/public/poststats.csv']) {
  fs.writeFileSync(path.join(root, rel), csv, 'utf8');
}

console.log(`Wrote ${rows.length} rows`);
console.log('Date range:', rows[0][1], 'to', rows[rows.length - 1][1]);
