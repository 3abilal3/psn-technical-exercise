-- posts + poststats (SQLite)
-- stat_date added to poststats for daily metrics

-- 1. Total views per video
SELECT
  p.video_id,
  p.title,
  p.account_name,
  p.video_type,
  SUM(ps.views) AS total_views,
  SUM(ps.likes) AS total_likes,
  SUM(ps.estimated_minutes_watched) AS total_minutes_watched
FROM posts p
INNER JOIN poststats ps
  ON p.video_id = ps.video_id
GROUP BY
  p.video_id,
  p.title,
  p.account_name,
  p.video_type
ORDER BY total_views DESC;


-- 2. Views by video type over time
SELECT
  ps.stat_date,
  p.video_type,
  SUM(ps.views) AS total_views
FROM posts p
INNER JOIN poststats ps
  ON p.video_id = ps.video_id
GROUP BY
  ps.stat_date,
  p.video_type
ORDER BY
  ps.stat_date,
  p.video_type;


-- 3. Top 5 videos in the last 28 days
SELECT
  p.video_id,
  p.title,
  p.account_name,
  p.video_type,
  SUM(ps.views) AS views_last_28_days
FROM posts p
INNER JOIN poststats ps
  ON p.video_id = ps.video_id
WHERE ps.stat_date >= DATE('2026-07-02', '-28 days')
GROUP BY
  p.video_id,
  p.title,
  p.account_name,
  p.video_type
ORDER BY views_last_28_days DESC
LIMIT 5;
