import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

function loadCsv(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line, i) => ({
    line: i + 2,
    values: parseCsvLine(line),
    raw: line,
  }));
  return { headers, rows };
}

function checkEmpty(filePath, label) {
  const { headers, rows } = loadCsv(filePath);
  const emptyCells = [];
  const emptyRows = [];
  const badRows = [];

  rows.forEach(({ line, values, raw }) => {
    if (!raw.trim() || values.every((v) => v === '')) emptyRows.push(line);
    if (values.length !== headers.length) badRows.push({ line, got: values.length, expected: headers.length });
    headers.forEach((h, i) => {
      const v = values[i];
      if (v === undefined || v === '') emptyCells.push({ line, column: h });
    });
  });

  console.log(`=== ${label} ===`);
  console.log(`Rows: ${rows.length} | Columns: ${headers.length}`);
  console.log(`Completely empty rows: ${emptyRows.length ? emptyRows.join(', ') : 'none'}`);
  console.log(`Wrong column count: ${badRows.length ? badRows.map((r) => `line ${r.line} (${r.got} vs ${r.expected})`).join(', ') : 'none'}`);
  console.log(`Empty/missing cells: ${emptyCells.length ? emptyCells.map((e) => `line ${e.line}:${e.column}`).join(', ') : 'none'}`);

  return { headers, rows, emptyCells, emptyRows, badRows };
}

const postsPath = path.join(root, 'data/posts.csv');
const statsPath = path.join(root, 'data/poststats.csv');

const posts = checkEmpty(postsPath, 'posts.csv');
const stats = checkEmpty(statsPath, 'poststats.csv');

const numeric = ['likes', 'comments', 'shares', 'views', 'estimated_minutes_watched'];
const zeroOrEmpty = [];

stats.rows.forEach(({ line, values }) => {
  const row = Object.fromEntries(stats.headers.map((h, i) => [h, values[i]]));
  numeric.forEach((col) => {
    const n = Number(row[col]);
    if (row[col] === '' || Number.isNaN(n)) zeroOrEmpty.push(`${line}:${col}=EMPTY`);
    else if (n === 0) zeroOrEmpty.push(`${line}:${col}=0`);
  });
});

console.log('=== poststats numeric empty/zero ===');
console.log(zeroOrEmpty.length ? zeroOrEmpty.join(', ') : 'none');

const postIds = posts.rows.map((r) => r.values[1]);
const statIds = new Set(stats.rows.map((r) => r.values[0]));
const publishDates = new Map(posts.rows.map((r) => [r.values[1], r.values[3]]));

const missingStats = postIds.filter((id) => !statIds.has(id));
const orphanStats = [...statIds].filter((id) => !postIds.includes(id));
const statsBeforePublish = stats.rows.filter(({ values }) => {
  const [vid, date] = values;
  return date < publishDates.get(vid);
});

console.log('=== coverage ===');
console.log(`Posts without any stats: ${missingStats.length ? missingStats.join(', ') : 'none'}`);
console.log(`Stats for unknown videos: ${orphanStats.length ? orphanStats.join(', ') : 'none'}`);
console.log(`Stats before publish date: ${statsBeforePublish.length ? statsBeforePublish.map((r) => r.values.slice(0, 2).join(' ')).join(', ') : 'none'}`);

const statCountByVideo = Object.fromEntries(postIds.map((id) => [id, 0]));
stats.rows.forEach(({ values }) => {
  statCountByVideo[values[0]] += 1;
});
console.log('=== days of stats per video ===');
postIds.forEach((id) => console.log(`${id}: ${statCountByVideo[id]} days (published ${publishDates.get(id)})`));
