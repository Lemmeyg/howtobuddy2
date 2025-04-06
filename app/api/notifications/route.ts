import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return new NextResponse('Error fetching notifications', { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in notifications route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, metadata } = body

    const { error } = await supabase.from('notifications').insert([
      {
        user_id: session.user.id,
        type,
        title,
        message,
        metadata,
        read: false,
      },
    ])

    if (error) {
      console.error('Error creating notification:', error)
      return new NextResponse('Error creating notification', { status: 500 })
    }

    return new NextResponse('Notification created', { status: 201 })
  } catch (error) {
    console.error('Error in notifications route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return new NextResponse('Error marking notification as read', { status: 500 })
      }
    } else {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return new NextResponse('Error marking all notifications as read', { status: 500 })
      }
    }

    return new NextResponse('Notifications updated', { status: 200 })
  } catch (error) {
    console.error('Error in notifications route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return new NextResponse('Notification ID is required', { status: 400 })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting notification:', error)
      return new NextResponse('Error deleting notification', { status: 500 })
    }

    return new NextResponse('Notification deleted', { status: 200 })
  } catch (error) {
    console.error('Error in notifications route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 