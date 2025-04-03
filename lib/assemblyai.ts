import { AssemblyAITranscriptResponse, AssemblyAIError, YouTubeVideoInfo } from "@/types/assemblyai";

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes
const MAX_POLLING_ATTEMPTS = MAX_POLLING_TIME / POLLING_INTERVAL;

if (!ASSEMBLYAI_API_KEY) {
  throw new Error("ASSEMBLYAI_API_KEY is not set in environment variables");
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function submitTranscriptRequest(videoUrl: string): Promise<{ id: string }> {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/transcribe/webhook`;
  
  const response = await fetchWithRetry(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: "POST",
    headers: {
      "Authorization": ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: videoUrl,
      language_code: "en",
      punctuate: true,
      format_text: true,
      webhook_url: webhookUrl,
      webhook_auth_header_name: "X-Webhook-Auth",
      webhook_auth_header_value: process.env.WEBHOOK_SECRET,
    }),
  });

  if (!response.ok) {
    const error: AssemblyAIError = await response.json();
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(error.error || "Failed to submit transcript request");
  }

  return response.json();
}

export async function getTranscriptStatus(transcriptId: string): Promise<AssemblyAITranscriptResponse> {
  const response = await fetchWithRetry(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
    headers: {
      "Authorization": ASSEMBLYAI_API_KEY,
    },
  });

  if (!response.ok) {
    const error: AssemblyAIError = await response.json();
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(error.error || "Failed to get transcript status");
  }

  return response.json();
}

export async function getYouTubeVideoInfo(videoUrl: string): Promise<YouTubeVideoInfo> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const response = await fetchWithRetry(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${process.env.YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 403) {
      throw new Error("YouTube API key is invalid or has exceeded quota");
    }
    throw new Error(error.error?.message || "Failed to fetch YouTube video info");
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = data.items[0];
  return {
    videoId,
    title: video.snippet.title,
    duration: parseDuration(video.contentDetails.duration),
    channelTitle: video.snippet.channelTitle,
  };
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

  const hours = (match[1] || "").replace("H", "");
  const minutes = (match[2] || "").replace("M", "");
  const seconds = (match[3] || "").replace("S", "");

  return (
    (parseInt(hours) || 0) * 3600 +
    (parseInt(minutes) || 0) * 60 +
    (parseInt(seconds) || 0)
  );
}

export async function pollTranscriptStatus(
  transcriptId: string,
  onProgress?: (status: AssemblyAITranscriptResponse) => void
): Promise<AssemblyAITranscriptResponse> {
  let attempts = 0;
  
  while (attempts < MAX_POLLING_ATTEMPTS) {
    const status = await getTranscriptStatus(transcriptId);
    
    if (onProgress) {
      onProgress(status);
    }

    if (status.status === "completed" || status.status === "error") {
      return status;
    }

    await delay(POLLING_INTERVAL);
    attempts++;
  }

  throw new Error("Transcription polling timed out");
} 