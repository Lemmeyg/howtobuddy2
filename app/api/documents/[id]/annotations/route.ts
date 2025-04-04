import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const annotationSchema = z.object({
  type: z.enum(['highlight', 'note']),
  startTime: z.number(),
  endTime: z.number(),
  content: z.string().optional(),
});

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

    const body = await request.json();
    const validatedData = annotationSchema.parse(body);

    // Get document to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document metadata with new annotation
    const { data: currentDocument, error: getError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('id', params.id)
      .single();

    if (getError) {
      console.error('Error fetching document metadata:', getError);
      return NextResponse.json(
        { error: 'Failed to fetch document metadata' },
        { status: 500 }
      );
    }

    const metadata = currentDocument.metadata || {};
    const annotations = metadata.annotations || [];

    const newAnnotation = {
      id: `${validatedData.startTime}-${validatedData.endTime}`,
      type: validatedData.type,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      content: validatedData.content,
      createdAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ...metadata,
          annotations: [...annotations, newAnnotation],
        },
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating document with annotation:', updateError);
      return NextResponse.json(
        { error: 'Failed to add annotation' },
        { status: 500 }
      );
    }

    return NextResponse.json(newAnnotation);
  } catch (error) {
    console.error('Error in POST /api/documents/[id]/annotations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const annotationId = searchParams.get('id');

    if (!annotationId) {
      return NextResponse.json(
        { error: 'Annotation ID is required' },
        { status: 400 }
      );
    }

    // Get document to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document metadata to remove annotation
    const { data: currentDocument, error: getError } = await supabase
      .from('documents')
      .select('metadata')
      .eq('id', params.id)
      .single();

    if (getError) {
      console.error('Error fetching document metadata:', getError);
      return NextResponse.json(
        { error: 'Failed to fetch document metadata' },
        { status: 500 }
      );
    }

    const metadata = currentDocument.metadata || {};
    const annotations = metadata.annotations || [];

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ...metadata,
          annotations: annotations.filter((a: any) => a.id !== annotationId),
        },
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating document with annotation removal:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete annotation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]/annotations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 