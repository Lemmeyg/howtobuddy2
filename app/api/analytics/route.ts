import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/sentry'

export async function GET() {
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    // Get document count and stats
    const { count: documentCount, error: documentError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (documentError) {
      throw documentError
    }

    // Get total video minutes and document types
    const { data: documents, error: videoError } = await supabase
      .from('documents')
      .select('metadata, document_type')
      .eq('user_id', session.user.id)
      .not('metadata->duration', 'is', null)

    if (videoError) {
      throw videoError
    }

    const totalVideoMinutes = documents.reduce((total, doc) => {
      const duration = doc.metadata?.duration || 0
      return total + Math.ceil(duration / 60)
    }, 0)

    // Calculate document type distribution
    const documentTypeDistribution = documents.reduce((acc, doc) => {
      const type = doc.document_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get recent activity with more details
    const { data: recentActivity, error: activityError } = await supabase
      .from('documents')
      .select('title, created_at, document_type, metadata')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      throw activityError
    }

    // Get template usage with template names
    const { data: templateUsage, error: templateError } = await supabase
      .from('template_usage')
      .select(`
        template_id,
        count,
        templates (
          name
        )
      `)
      .eq('user_id', session.user.id)
      .order('count', { ascending: false })
      .limit(10)

    if (templateError) {
      throw templateError
    }

    // Get user's activity timeline
    const { data: activityTimeline, error: timelineError } = await supabase
      .from('documents')
      .select('created_at, document_type')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (timelineError) {
      throw timelineError
    }

    // Calculate daily activity
    const dailyActivity = activityTimeline.reduce((acc, doc) => {
      const date = new Date(doc.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      user: {
        email: profile.email,
        createdAt: profile.created_at,
        lastSignIn: profile.last_sign_in_at,
      },
      documentCount,
      totalVideoMinutes,
      documentTypeDistribution,
      recentActivity,
      templateUsage: templateUsage.map(usage => ({
        template_id: usage.template_id,
        name: usage.templates?.name || 'Unknown Template',
        count: usage.count
      })),
      dailyActivity,
    })
  } catch (error) {
    await logError(error as Error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 