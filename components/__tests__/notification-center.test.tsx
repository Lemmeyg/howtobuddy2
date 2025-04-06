import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationCenter } from '../notifications/notification-center'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}))

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('NotificationCenter', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      channel: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      removeChannel: jest.fn(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    }

    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should render notification bell with unread count', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: [
                  {
                    id: '1',
                    type: 'document_update',
                    title: 'Test Notification',
                    message: 'Test Message',
                    read: false,
                    created_at: '2024-01-01T00:00:00Z',
                  },
                ],
                error: null,
              }),
          }),
        }),
      }),
    }))

    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
    })
  })

  it('should open notification center when clicking the bell', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: [],
                error: null,
              }),
          }),
        }),
      }),
    }))

    render(<NotificationCenter />)

    fireEvent.click(screen.getByTestId('notification-bell'))

    await waitFor(() => {
      expect(screen.getByTestId('notification-center')).toBeInTheDocument()
    })
  })

  it('should display notifications in the center', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: mockNotifications,
                error: null,
              }),
          }),
        }),
      }),
    }))

    render(<NotificationCenter />)
    fireEvent.click(screen.getByTestId('notification-bell'))

    await waitFor(() => {
      expect(screen.getByTestId('notification-item')).toBeInTheDocument()
      expect(screen.getByText('Test Notification')).toBeInTheDocument()
      expect(screen.getByText('Test Message')).toBeInTheDocument()
    })
  })

  it('should mark notification as read', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: mockNotifications,
                error: null,
              }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          then: (callback: any) => callback({ error: null }),
        }),
      }),
    }))

    render(<NotificationCenter />)
    fireEvent.click(screen.getByTestId('notification-bell'))

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('mark-as-read'))
    })

    await waitFor(() => {
      expect(screen.queryByTestId('unread-count')).not.toBeInTheDocument()
    })
  })

  it('should mark all notifications as read', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: mockNotifications,
                error: null,
              }),
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          then: (callback: any) => callback({ error: null }),
        }),
      }),
    }))

    render(<NotificationCenter />)
    fireEvent.click(screen.getByTestId('notification-bell'))

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('mark-all-read'))
    })

    await waitFor(() => {
      expect(screen.queryByTestId('unread-count')).not.toBeInTheDocument()
    })
  })

  it('should delete a notification', async () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: false,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: mockNotifications,
                error: null,
              }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          then: (callback: any) => callback({ error: null }),
        }),
      }),
    }))

    render(<NotificationCenter />)
    fireEvent.click(screen.getByTestId('notification-bell'))

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('delete-notification'))
    })

    await waitFor(() => {
      expect(screen.queryByTestId('notification-item')).not.toBeInTheDocument()
    })
  })

  it('should handle empty notification state', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            then: (callback: any) =>
              callback({
                data: [],
                error: null,
              }),
          }),
        }),
      }),
    }))

    render(<NotificationCenter />)
    fireEvent.click(screen.getByTestId('notification-bell'))

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument()
    })
  })
}) 