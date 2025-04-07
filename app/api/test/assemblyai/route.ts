import { NextResponse } from 'next/server';
import { AssemblyAIService } from '@/lib/assemblyai/service';

export async function POST(request: Request) {
  try {
    const { videoUrl } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    const assemblyAI = new AssemblyAIService();
    
    // Submit the transcription job
    const transcriptionId = await assemblyAI.submitTranscription(videoUrl);
    
    // Return the transcription ID immediately
    return NextResponse.json({
      message: 'Transcription job submitted successfully',
      transcriptionId,
      status: 'processing'
    });

  } catch (error) {
    console.error('AssemblyAI test error:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transcriptionId = searchParams.get('transcriptionId');

    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'Transcription ID is required' },
        { status: 400 }
      );
    }

    const assemblyAI = new AssemblyAIService();
    const status = await assemblyAI.waitForTranscription(transcriptionId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('AssemblyAI status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check transcription status' },
      { status: 500 }
    );
  }
} 