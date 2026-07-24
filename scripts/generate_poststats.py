from collections import Counter
from datetime import date, timedelta
import csv
from pathlib import Path

POSTS = [
    ("vid001", "2026-06-01", "Long Form", 1262),
    ("vid002", "2026-06-05", "Short Form", 264),
    ("vid003", "2026-06-10", "Long Form", 848),
    ("vid004", "2026-06-12", "Long Form", 1120),
    ("vid005", "2026-06-15", "Short Form", 142),
    ("vid006", "2026-06-18", "Long Form", 936),
    ("vid007", "2026-06-22", "Short Form", 612),
    ("vid008", "2026-06-25", "Long Form", 854),
    ("vid009", "2026-06-28", "Long Form", 639),
    ("vid010", "2026-07-01", "Long Form", 1038),
]

END = date(2026, 7, 2)
rows = []

for vid, pub, vtype, length_sec in POSTS:
    pub_d = date.fromisoformat(pub)
    seed = sum(ord(c) for c in vid)
    day_idx = 0
    d = pub_d
    while d <= END:
        growth = 1 + min(day_idx, 14) * 0.012
        if vtype == "Long Form":
            base = 8200 + seed % 900
            views = int((base + (day_idx * 131 + seed) % 4200) * growth)
            likes = max(180, views // 28)
            comments = max(18, views // 320)
            shares = max(8, views // 520)
            emw = round(views * (length_sec / 60) * 0.18, 1)
        else:
            base = 26000 + seed % 1200
            views = int((base + (day_idx * 211 + seed) % 18000) * growth)
            likes = max(520, views // 48)
            comments = max(6, views // 2800)
            shares = max(55, views // 420)
            emw = round(views * (length_sec / 60) * 0.22, 1)
        rows.append([vid, d.isoformat(), likes, comments, shares, views, emw])
        d += timedelta(days=1)
        day_idx += 1

rows.sort(key=lambda r: (r[0], r[1]))

root = Path(__file__).resolve().parents[1]
targets = [
    root / "data" / "poststats.csv",
    root / "frontend" / "public" / "poststats.csv",
]

for path in targets:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "video_id",
            "stat_date",
            "likes",
            "comments",
            "shares",
            "views",
            "estimated_minutes_watched",
        ])
        writer.writerows(rows)

print(f"Wrote {len(rows)} rows")
print("Date range:", rows[0][1], "to", rows[-1][1])
print("Rows per video:", dict(Counter(r[0] for r in rows)))
