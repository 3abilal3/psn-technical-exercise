-- Q1: total views per video
SELECT
  p.video_id,
  p.title,
  p.account_name,
  p.video_type,
  SUM(CAST(REPLACE(ps.views, ',', '') AS INTEGER)) AS total_views,
  SUM(ps.likes) AS total_likes,
  SUM(CAST(REPLACE(ps.watchtime, ',', '') AS REAL)) AS total_minutes_watched
FROM posts p
INNER JOIN poststats ps
  ON p.video_id = ps.video_id
GROUP BY
  p.video_id,
  p.title,
  p.account_name,
  p.video_type
ORDER BY total_views DESC;


-- Q2: views by video type over time
SELECT
  ps.data_date,
  p.video_type,
  SUM(CAST(REPLACE(ps.views, ',', '') AS INTEGER)) AS total_views
FROM posts p
INNER JOIN poststats ps
  ON p.video_id = ps.video_id
GROUP BY
  ps.data_date,
  p.video_type
ORDER BY
  ps.data_date,
  p.video_type;


-- Q3: top 5 videos in the last 28 days
SELECT
  p.video_id,
  p.title,
  p.account_name,
  p.video_type,
  SUM(CAST(REPLACE(ps.views, ',', '') AS INTEGER)) AS views_last_28_days
FROM posts p
INNER JOIN poststats ps
  ON p.video_id = ps.video_id
WHERE date(
  substr(ps.data_date, 7, 4) || '-' ||
  substr(ps.data_date, 4, 2) || '-' ||
  substr(ps.data_date, 1, 2)
) >= date('2026-01-25', '-28 days')
GROUP BY
  p.video_id,
  p.title,
  p.account_name,
  p.video_type
ORDER BY views_last_28_days DESC
LIMIT 5;
