import fs from 'fs';

function parseRecords(text) {
  const records = [];
  let row = [];
  let cur = '';
  let q = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === ',' && !q) {
      row.push(cur);
      cur = '';
      continue;
    }
    if ((c === '\n' || c === '\r') && !q) {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cur);
      records.push(row);
      row = [];
      cur = '';
      continue;
    }
    cur += c;
  }

  if (cur || row.length) {
    row.push(cur);
    records.push(row);
  }

  return records;
}

function parseDateDMY(s) {
  const [d, m, y] = s.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const downloads = 'c:/Users/U K Comp/Downloads';
const statsText = fs.readFileSync(
  `${downloads}/Junior Full Stack Developer __ Technical Exercise Dataset 2026 - poststats - Junior Full Stack Developer __ Technical Exercise Dataset 2026 - poststats.csv`,
  'utf8',
);
const stats = parseRecords(statsText);
const sh = stats[0];
let minD = '9999';
let maxD = '0000';

for (let i = 1; i < stats.length; i += 1) {
  const iso = parseDateDMY(stats[i][1]);
  if (iso < minD) minD = iso;
  if (iso > maxD) maxD = iso;
}

console.log('poststats rows', stats.length - 1, 'date range', minD, 'to', maxD);

const postsText = fs.readFileSync(
  `${downloads}/Junior Full Stack Developer __ Technical Exercise Dataset 2026 - posts - Junior Full Stack Developer __ Technical Exercise Dataset 2026 - posts.csv`,
  'utf8',
);
const posts = parseRecords(postsText);
const ph = posts[0];
const accounts = new Set();
const vtypes = new Set();

for (let i = 1; i < posts.length; i += 1) {
  accounts.add(posts[i][ph.indexOf('account_name')]);
  vtypes.add(posts[i][ph.indexOf('video_type')]);
}

console.log('posts rows', posts.length - 1);
console.log('accounts', [...accounts].sort());
console.log('video types', [...vtypes]);
