import { NotificationService, NotificationPayload } from '../notification.service'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}))

describe('NotificationService', () => {
  let notificationService: NotificationService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'test-user-id' } } },
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      channel: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      removeChannel: jest.fn(),
    }

    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
    notificationService = NotificationService.getInstance()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      const payload: NotificationPayload = {
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        metadata: { document_id: '123' },
      }

      mockSupabase.from.mockImplementation(() => ({
        insert: () => ({
          then: (callback: any) => callback({ error: null }),
        }),
      }))

      await expect(notificationService.sendNotification(payload)).resolves.not.toThrow()
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      const payload: NotificationPayload = {
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
      }

      await expect(notificationService.sendNotification(payload)).rejects.toThrow('User not authenticated')
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            then: (callback: any) => callback({ error: null }),
          }),
        }),
      }))

      await expect(notificationService.markAsRead('1')).resolves.not.toThrow()
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      await expect(notificationService.markAsRead('1')).rejects.toThrow('User not authenticated')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              then: (callback: any) => callback({ error: null }),
            }),
          }),
        }),
      }))

      await expect(notificationService.markAllAsRead()).resolves.not.toThrow()
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      await expect(notificationService.markAllAsRead()).rejects.toThrow('User not authenticated')
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        delete: () => ({
          eq: () => ({
            then: (callback: any) => callback({ error: null }),
          }),
        }),
      }))

      await expect(notificationService.deleteNotification('1')).resolves.not.toThrow()
    })

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      await expect(notificationService.deleteNotification('1')).rejects.toThrow('User not authenticated')
    })
  })

  describe('getNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockNotifications = [
        {
          id: '1',
          user_id: 'user1',
          type: 'document_update',
          title: 'Document Updated',
          message: 'Your document has been updated',
          read: false,
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.select.mockResolvedValueOnce({ data: mockNotifications, error: null })

      const notifications = await notificationService.getNotifications()

      expect(notifications).toEqual(mockNotifications)
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabase.limit).toHaveBeenCalledWith(20)
    })

    it('should handle errors when fetching notifications', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: new Error('Failed to fetch') })

      const notifications = await notificationService.getNotifications()

      expect(notifications).toEqual([])
    })
  })

  describe('subscribeToNotifications', () => {
    it('should subscribe to notifications successfully', () => {
      const callback = jest.fn()
      const unsubscribe = notificationService.subscribeToNotifications(callback)

      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications')
      expect(mockSupabase.on).toHaveBeenCalled()
      expect(mockSupabase.subscribe).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe('function')
    })

    it('should call callback when new notification is received', () => {
      const callback = jest.fn()
      const mockNotification = {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: false,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.on.mockImplementation((_event: string, _filter: any, handler: any) => {
        handler({ new: mockNotification })
        return mockSupabase
      })

      notificationService.subscribeToNotifications(callback)

      expect(callback).toHaveBeenCalledWith(mockNotification)
    })

    it('should unsubscribe from notifications successfully', () => {
      const callback = jest.fn()
      const unsubscribe = notificationService.subscribeToNotifications(callback)

      unsubscribe()

      expect(mockSupabase.removeChannel).toHaveBeenCalled()
    })
  })
}) 