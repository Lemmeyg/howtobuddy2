import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { downloadYouTubeAudio } from '../lib/youtube';
import { AssemblyAIService } from '../lib/assemblyai/service';
import { logInfo, logError } from '../lib/logging';

// Debug environment loading
console.log('\n=== Environment Debugging ===');
console.log('Current Working Directory:', process.cwd());
console.log('Environment File Path:', path.resolve(process.cwd(), '.env.local'));

// Check file existence and permissions
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const stats = fs.statSync(envPath);
  console.log('\n=== File System Debug ===');
  console.log('File exists:', true);
  console.log('File size:', stats.size, 'bytes');
  console.log('File permissions:', stats.mode.toString(8));
  console.log('File last modified:', stats.mtime);
  
  // Read and log file contents (safely)
  const fileContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n=== Environment File Contents ===');
  console.log('File contains AssemblyAI key:', fileContent.includes('NEXT_PUBLIC_ASSEMBLY_API_KEY'));
  console.log('Number of lines:', fileContent.split('\n').length);
  
  // Log all environment variables containing 'ASSEMBLY'
  console.log('\n=== Process Environment ===');
  const assemblyVars = Object.entries(process.env)
    .filter(([key]) => key.includes('ASSEMBLY'))
    .map(([key, value]) => ({
      key,
      present: !!value,
      length: value?.length,
      firstChars: value?.substring(0, 4),
      lastChars: value?.substring(value.length - 4)
    }));
  console.log('Assembly-related environment variables:', assemblyVars);
  
} catch (error) {
  console.error('\n=== File System Error ===');
  if (error instanceof Error) {
    console.error('Error accessing .env.local:', error.message);
  } else {
    console.error('Error accessing .env.local:', String(error));
  }
}

// Load environment variables from .env.local
console.log('\n=== Loading Environment Variables ===');
const result = config({ path: path.resolve(process.cwd(), '.env.local') });
console.log('Dotenv config result:', {
  error: result.error ? result.error.message : 'No error',
  parsed: result.parsed ? Object.keys(result.parsed) : 'Not parsed'
});

// Verify environment variables after loading
console.log('\n=== Post-Load Environment Check ===');
console.log('NEXT_PUBLIC_ASSEMBLY_API_KEY present:', !!process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY);
if (process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY) {
  const key = process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY;
  console.log('API Key format:', {
    first5: key.substring(0, 5),
    last5: key.substring(key.length - 5),
    length: key.length,
    expectedLength: 32 // AssemblyAI API keys are typically 32 characters
  });
}
console.log('All environment keys:', Object.keys(process.env).length, 'keys total');

async function testAssemblyAI() {
  try {
    // Log environment variables (without exposing sensitive data)
    logInfo('Checking environment variables', {
      hasAssemblyAIKey: !!process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      envFile: path.resolve(process.cwd(), '.env.local')
    });

    // Test with a YouTube video
    const videoUrl = 'https://www.youtube.com/watch?v=1L509JK8p1I';
    logInfo('Starting test with video:', videoUrl);

    // Step 1: Download YouTube audio
    logInfo('Step 1: Downloading YouTube audio...');
    const videoInfo = await downloadYouTubeAudio(videoUrl);
    logInfo('Video info:', {
      id: videoInfo.id,
      title: videoInfo.title,
      duration: videoInfo.duration,
      audioPath: videoInfo.audioPath
    });

    // Step 2: Initialize AssemblyAI
    logInfo('Step 2: Initializing AssemblyAI...');
    const assemblyAI = new AssemblyAIService({
      languageCode: 'en',
      punctuate: true,
      formatText: true
    });

    // Step 3: Submit transcription
    logInfo('Step 3: Submitting transcription...');
    const audioUrl = `file://${videoInfo.audioPath}`;
    logInfo('Using audio URL:', audioUrl);
    
    const transcriptionId = await assemblyAI.submitTranscription(audioUrl);
    logInfo('Transcription ID:', transcriptionId);

    // Step 4: Wait for transcription
    logInfo('Step 4: Waiting for transcription...');
    const transcription = await assemblyAI.waitForTranscription(transcriptionId);
    
    // Display full transcription results
    console.log('\n=== Transcription Results ===');
    console.log('Status:', transcription.status);
    console.log('Text:', transcription.text || 'No text available');
    console.log('Confidence:', transcription.confidence);
    console.log('Audio Duration:', transcription.audio_duration, 'seconds');
    console.log('Word Count:', transcription.word_count);
    
    if (transcription.utterances && transcription.utterances.length > 0) {
      console.log('\nUtterances:');
      transcription.utterances.forEach((utterance, index) => {
        console.log(`\n[${index + 1}] Speaker ${utterance.speaker || 'Unknown'}:`);
        console.log(`Text: ${utterance.text}`);
        console.log(`Time: ${utterance.start}s - ${utterance.end}s`);
        console.log(`Confidence: ${utterance.confidence}`);
      });
    }

    logInfo('Transcription completed!');

  } catch (error) {
    logError('Test failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the test
testAssemblyAI(); 