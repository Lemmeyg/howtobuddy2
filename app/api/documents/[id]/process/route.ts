import { NextResponse } from 'next/server';
import { processDocument } from '@/lib/document-processing';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { logInfo, logError } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the document
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (documentError || !document) {
      logError('Document not found', { documentId: params.id, error: documentError });
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Start processing in the background
    processDocument({
      documentId: document.id,
      videoUrl: document.video_url,
      onProgress: (status, progress) => {
        logInfo('Processing progress', { 
          documentId: document.id, 
          status, 
          progress 
        });
      },
    }).catch(error => {
      logError('Processing failed', { 
        documentId: document.id, 
        error 
      });
    });

    return NextResponse.json({ 
      message: 'Processing started',
      documentId: document.id,
      status: 'processing'
    });
  } catch (error) {
    logError('Error in process route', { error });
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
} 