import { AssemblyAITranscriptResponse, AssemblyAIError, YouTubeVideoInfo } from "@/types/assemblyai";
import { logError, logInfo } from "./logger";

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;
const ASSEMBLY_API_URL = "https://api.assemblyai.com/v2";
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/assemblyai";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const POLLING_INTERVAL = 5000; // 5 seconds
const MAX_POLLING_TIME = 300000; // 5 minutes
const MAX_POLLING_ATTEMPTS = MAX_POLLING_TIME / POLLING_INTERVAL;

if (!ASSEMBLY_API_KEY) {
  throw new Error("ASSEMBLY_API_KEY is not defined");
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

interface TranscriptionJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  text?: string;
  audio_duration?: number;
  confidence?: number;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  chapters?: Array<{
    headline: string;
    start: number;
    end: number;
    summary: string;
  }>;
  highlights?: Array<{
    text: string;
    start: number;
    end: number;
    rank: number;
  }>;
  entities?: Array<{
    text: string;
    entity_type: string;
    start: number;
    end: number;
  }>;
}

export async function submitTranscriptionJob(videoUrl: string): Promise<string> {
  try {
    logInfo("Submitting transcription job", { videoUrl });

    const response = await fetch(`${ASSEMBLY_API_URL}/transcript`, {
      method: "POST",
      headers: {
        "Authorization": ASSEMBLY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: videoUrl,
        auto_chapters: true,
        auto_highlights: true,
        entity_detection: true,
        sentiment_analysis: true,
        iab_categories: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`AssemblyAI API error: ${error.error || "Unknown error"}`);
    }

    const data = await response.json();
    logInfo("Transcription job submitted", { jobId: data.id });

    return data.id;
  } catch (error) {
    logError("Error submitting transcription job", { error, videoUrl });
    throw error;
  }
}

export async function waitForTranscription(jobId: string): Promise<TranscriptionJob> {
  try {
    while (true) {
      const response = await fetch(`${ASSEMBLY_API_URL}/transcript/${jobId}`, {
        headers: {
          "Authorization": ASSEMBLY_API_KEY,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`AssemblyAI API error: ${error.error || "Unknown error"}`);
      }

      const data: TranscriptionJob = await response.json();

      if (data.status === "completed") {
        logInfo("Transcription completed", { jobId });
        return data;
      }

      if (data.status === "error") {
        throw new Error(data.error || "Transcription failed");
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    logError("Error waiting for transcription", { error, jobId });
    throw error;
  }
}

export async function getTranscriptionStatus(transcriptId: string): Promise<TranscriptionJob> {
  try {
    logInfo("Checking transcription status", { transcriptId });

    const response = await fetch(`${ASSEMBLY_API_URL}/transcript/${transcriptId}`, {
      headers: {
        "Authorization": ASSEMBLY_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`AssemblyAI API error: ${error.error || "Unknown error"}`);
    }

    const data = await response.json();
    logInfo("Transcription status retrieved", { 
      transcriptId, 
      status: data.status 
    });

    return data;
  } catch (error) {
    logError("Error checking transcription status", { error, transcriptId });
    throw error;
  }
}

export async function waitForTranscriptionCompletion(
  transcriptId: string,
  onProgress?: (status: TranscriptionJob) => void
): Promise<string> {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  const interval = 5000;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getTranscriptionStatus(transcriptId);

    if (onProgress) {
      onProgress(result);
    }

    if (result.status === "completed" && result.text) {
      return result.text;
    }

    if (result.status === "error") {
      throw new Error(`Transcription failed: ${result.error || "Unknown error"}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error("Transcription timed out");
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