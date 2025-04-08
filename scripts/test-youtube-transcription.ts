import { downloadYouTubeAudio, cleanupAudioFile } from '../lib/youtube';
import { AssemblyAIService } from '../lib/assemblyai/service';

async function testYouTubeTranscription() {
  try {
    // Test with a different YouTube video (Big Buck Bunny trailer)
    const videoUrl = 'https://www.youtube.com/watch?v=YE7VzlLtp-4';
    console.log('Starting test with video:', videoUrl);

    // Step 1: Download YouTube audio
    console.log('\nStep 1: Downloading YouTube audio...');
    const videoInfo = await downloadYouTubeAudio(videoUrl);
    console.log('Video info:', {
      id: videoInfo.id,
      title: videoInfo.title,
      duration: videoInfo.duration,
      audioPath: videoInfo.audioPath
    });

    try {
      // Step 2: Initialize AssemblyAI
      console.log('\nStep 2: Initializing AssemblyAI...');
      const assemblyAI = new AssemblyAIService();

      // Step 3: Submit transcription
      console.log('\nStep 3: Submitting transcription...');
      const transcriptionId = await assemblyAI.submitTranscription(`file://${videoInfo.audioPath}`);
      console.log('Transcription ID:', transcriptionId);

      // Step 4: Wait for transcription
      console.log('\nStep 4: Waiting for transcription...');
      const transcription = await assemblyAI.waitForTranscription(transcriptionId);
      console.log('\nTranscription completed!');
      console.log('Text:', transcription.text);

    } finally {
      // Clean up
      console.log('\nCleaning up temporary files...');
      cleanupAudioFile(videoInfo.audioPath);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Run the test
testYouTubeTranscription(); 