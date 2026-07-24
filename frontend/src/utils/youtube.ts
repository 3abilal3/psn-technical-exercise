export function getYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function getYoutubeEmbedUrl(
  url: string,
  autoplay = false,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
): string | null {
  const id = getYoutubeId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  if (origin) {
    params.set('origin', origin);
  }

  if (autoplay) {
    params.set('autoplay', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function getYoutubeThumbnail(url: string, quality: 'default' | 'mqdefault' | 'hqdefault' = 'hqdefault'): string | null {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : null;
}
