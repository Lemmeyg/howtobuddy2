import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/sentry'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      logError(error, 'Error fetching profile')
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    logError(error, 'Error in profile GET route')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, company, role, bio, avatar_url } = body

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        company,
        role,
        bio,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      logError(error, 'Error updating profile')
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    logError(error, 'Error in profile PUT route')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notifications_document_updates, notifications_comments, notifications_mentions, notifications_realtime, notifications_sound } = body

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        notifications_document_updates,
        notifications_comments,
        notifications_mentions,
        notifications_realtime,
        notifications_sound,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      logError(error, 'Error updating notification settings')
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    logError(error, 'Error in profile PATCH route')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete user's data
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', session.user.id)

    if (profileError) {
      logError(profileError, 'Error deleting profile')
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    // Delete user's documents
    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', session.user.id)

    if (documentsError) {
      logError(documentsError, 'Error deleting documents')
      return NextResponse.json({ error: 'Failed to delete documents' }, { status: 500 })
    }

    // Delete user's account
    const { error: authError } = await supabase.auth.admin.deleteUser(session.user.id)

    if (authError) {
      logError(authError, 'Error deleting user account')
      return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    logError(error, 'Error in profile DELETE route')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 