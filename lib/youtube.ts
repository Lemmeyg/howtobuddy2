import { logError, logInfo } from './logging';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  audioPath: string;
}

function extractVideoId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?]+)/);
  if (!match) throw new Error('Invalid YouTube URL');
  return match[1];
}

export async function downloadYouTubeAudio(videoUrl: string): Promise<YouTubeVideoInfo> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const videoId = extractVideoId(videoUrl);
    const outputPath = path.join(uploadsDir, `${videoId}.m4a`);

    // Get video info using Python and yt-dlp
    const { stdout: infoJson } = await execAsync(
      `python -m yt_dlp -j "${videoUrl}"`,
      { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );
    const info = JSON.parse(infoJson);

    // Download audio using Python and yt-dlp
    await execAsync(
      `python -m yt_dlp -x --audio-format m4a -o "${outputPath}" "${videoUrl}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    logInfo(`Successfully downloaded audio for video ${videoId}`);

    return {
      id: videoId,
      title: info.title,
      duration: info.duration,
      audioPath: outputPath
    };
  } catch (error) {
    logError('Error downloading YouTube audio:', error);
    throw new Error('Failed to download YouTube audio');
  }
}

export function cleanupAudioFile(audioPath: string) {
  try {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      logInfo(`Cleaned up audio file: ${audioPath}`);
    }
  } catch (error) {
    logError('Error cleaning up audio file:', error);
  }
} 