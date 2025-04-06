import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/sentry'

// Get document versions
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get document versions
    const { data: versions, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', params.id)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      await logError(error, {
        userId: session.user.id,
        documentId: params.id,
      })

      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    return NextResponse.json(versions)
  } catch (error) {
    await logError(error as Error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Restore document version
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get version ID from request body
    const { versionId } = await request.json()

    // Get version content
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select('content')
      .eq('id', versionId)
      .eq('document_id', params.id)
      .eq('user_id', session.user.id)
      .single()

    if (versionError || !version) {
      await logError(versionError || new Error('Version not found'), {
        userId: session.user.id,
        documentId: params.id,
        versionId,
      })

      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    // Update document with version content
    const { error: updateError } = await supabase
      .from('documents')
      .update({ content: version.content })
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (updateError) {
      await logError(updateError, {
        userId: session.user.id,
        documentId: params.id,
        versionId,
      })

      return NextResponse.json(
        { error: 'Failed to restore version' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    await logError(error as Error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 