import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseCsvRecords(text) {
  const records = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(current.trim());
      records.push(row);
      row = [];
      current = '';
      continue;
    }
    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    records.push(row);
  }

  return records;
}

function loadCsv(filePath) {
  const records = parseCsvRecords(fs.readFileSync(filePath, 'utf8').trim());
  const headers = records[0];
  const rows = records.slice(1).flatMap((values, i) => {
    if (values.length === 1 && values[0] === '') return [];
    return [{ line: i + 2, values }];
  });
  return { headers, rows };
}

function parseDateDMY(value) {
  const [day, month, year] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseNumber(value) {
  return Number(String(value ?? '').replace(/,/g, ''));
}

function checkEmpty(filePath, label) {
  const { headers, rows } = loadCsv(filePath);
  const emptyCells = [];
  const badRows = [];

  rows.forEach(({ line, values }) => {
    if (values.length !== headers.length) {
      badRows.push({ line, got: values.length, expected: headers.length });
    }
    headers.forEach((h, i) => {
      const v = values[i];
      if (v === undefined || v === '') emptyCells.push({ line, column: h });
    });
  });

  console.log(`=== ${label} ===`);
  console.log(`Rows: ${rows.length} | Columns: ${headers.length}`);
  console.log(`Wrong column count: ${badRows.length ? badRows.map((r) => `line ${r.line} (${r.got} vs ${r.expected})`).join(', ') : 'none'}`);
  console.log(`Empty/missing cells: ${emptyCells.length ? `${emptyCells.length} (showing first 10: ${emptyCells.slice(0, 10).map((e) => `line ${e.line}:${e.column}`).join(', ')})` : 'none'}`);

  return { headers, rows, emptyCells, badRows };
}

const postsPath = path.join(root, 'data/posts.csv');
const statsPath = path.join(root, 'data/poststats.csv');

const posts = checkEmpty(postsPath, 'posts.csv');
const stats = checkEmpty(statsPath, 'poststats.csv');

const numeric = ['likes', 'comments', 'shares', 'views', 'watchtime'];
const badNumbers = [];

stats.rows.forEach(({ line, values }) => {
  const row = Object.fromEntries(stats.headers.map((h, i) => [h, values[i]]));
  numeric.forEach((col) => {
    const n = parseNumber(row[col]);
    if (row[col] === '' || Number.isNaN(n)) badNumbers.push(`${line}:${col}=EMPTY`);
  });
});

console.log('=== poststats numeric issues ===');
console.log(badNumbers.length ? badNumbers.slice(0, 20).join(', ') : 'none');

const postIds = posts.rows.map((r) => r.values[posts.headers.indexOf('video_id')]);
const statIds = new Set(stats.rows.map((r) => r.values[stats.headers.indexOf('video_id')]));
const publishDates = new Map(
  posts.rows.map((r) => [r.values[posts.headers.indexOf('video_id')], r.values[posts.headers.indexOf('published_at_date')]]),
);

const missingStats = postIds.filter((id) => !statIds.has(id));
const orphanStats = [...statIds].filter((id) => !postIds.includes(id));

let minDate = '9999-99-99';
let maxDate = '0000-00-00';
stats.rows.forEach(({ values }) => {
  const iso = parseDateDMY(values[stats.headers.indexOf('data_date')]);
  if (iso < minDate) minDate = iso;
  if (iso > maxDate) maxDate = iso;
});

console.log('=== coverage ===');
console.log(`Posts: ${postIds.length}`);
console.log(`Stat rows: ${stats.rows.length}`);
console.log(`Stat date range: ${minDate} to ${maxDate}`);
console.log(`Posts without any stats: ${missingStats.length ? missingStats.slice(0, 10).join(', ') : 'none'}`);
console.log(`Stats for unknown videos: ${orphanStats.length ? orphanStats.slice(0, 10).join(', ') : 'none'}`);

const accounts = [...new Set(posts.rows.map((r) => r.values[posts.headers.indexOf('account_name')]))].sort();
const types = [...new Set(posts.rows.map((r) => r.values[posts.headers.indexOf('video_type')]))].sort();
console.log(`Accounts: ${accounts.join(', ')}`);
console.log(`Video types: ${types.join(', ')}`);
