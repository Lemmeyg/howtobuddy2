import { logger } from './logger';

interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  duration: number;
  channelTitle: string;
}

export async function getYouTubeVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
  try {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${process.env.YOUTUBE_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 403) {
        throw new Error('YouTube API key is invalid or has exceeded quota');
      }
      throw new Error(error.error?.message || 'Failed to fetch YouTube video info');
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    return {
      videoId,
      title: video.snippet.title,
      duration: parseDuration(video.contentDetails.duration),
      channelTitle: video.snippet.channelTitle,
    };
  } catch (error) {
    logger.error('Error fetching YouTube video info', { error, videoUrl });
    throw error;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/,
    /youtube\.com\/embed\/([^&\n?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  return (
    (parseInt(hours) || 0) * 3600 +
    (parseInt(minutes) || 0) * 60 +
    (parseInt(seconds) || 0)
  );
} 