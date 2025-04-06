import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/components/ui/use-toast'

export type NotificationType = 'document_update' | 'comment' | 'mention' | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  metadata: Record<string, any>
  created_at: string
}

class NotificationService {
  private static instance: NotificationService
  private supabase = createClientComponentClient()
  private channel: any = null
  private callbacks: ((notification: Notification) => void)[] = []

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public async getNotifications(limit = 20, offset = 0): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return data || []
  }

  public async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  public async markAllAsRead(): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('Error deleting notification:', error)
    }
  }

  public async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type,
          title,
          message,
          metadata,
          read: false,
        },
      ])

    if (error) {
      console.error('Error sending notification:', error)
    }
  }

  public subscribeToNotifications(callback: (notification: Notification) => void): void {
    this.callbacks.push(callback)

    if (!this.channel) {
      this.setupRealtimeSubscription()
    }
  }

  public unsubscribeFromNotifications(callback: (notification: Notification) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback)

    if (this.callbacks.length === 0 && this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
  }

  private setupRealtimeSubscription(): void {
    this.channel = this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const notification = payload.new as Notification
          this.callbacks.forEach((callback) => callback(notification))
          
          // Show toast notification
          toast({
            title: notification.title,
            description: notification.message,
          })
        }
      )
      .subscribe()
  }
}

export const notificationService = NotificationService.getInstance() 