import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationCenter } from '../notification-center'
import { notificationService } from '@/lib/services/notification.service'

// Mock notification service
jest.mock('@/lib/services/notification.service', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    subscribeToNotifications: jest.fn(),
    unsubscribeFromNotifications: jest.fn(),
  },
}))

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe('NotificationCenter', () => {
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
    {
      id: '2',
      user_id: 'user1',
      type: 'comment',
      title: 'New Comment',
      message: 'Someone commented on your document',
      read: true,
      metadata: {},
      created_at: '2024-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    ;(notificationService.getNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    ;(notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined)
    ;(notificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined)
    ;(notificationService.deleteNotification as jest.Mock).mockResolvedValue(undefined)
    ;(notificationService.subscribeToNotifications as jest.Mock).mockImplementation((callback) => {
      callback(mockNotifications[0])
      return () => {}
    })
  })

  it('should render notification bell with unread count', async () => {
    render(<NotificationCenter />)

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Unread count
    })
  })

  it('should open notification dropdown when clicked', async () => {
    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Mark all as read')).toBeInTheDocument()
    })
  })

  it('should display notifications in the dropdown', async () => {
    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Document Updated')).toBeInTheDocument()
      expect(screen.getByText('New Comment')).toBeInTheDocument()
    })
  })

  it('should mark notification as read when clicked', async () => {
    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const markAsReadButton = screen.getAllByRole('button', { name: /mark as read/i })[0]
    fireEvent.click(markAsReadButton)

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('1')
    })
  })

  it('should mark all notifications as read when button clicked', async () => {
    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const markAllAsReadButton = screen.getByText('Mark all as read')
    fireEvent.click(markAllAsReadButton)

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled()
    })
  })

  it('should delete notification when delete button clicked', async () => {
    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(notificationService.deleteNotification).toHaveBeenCalledWith('1')
    })
  })

  it('should handle new notifications through subscription', async () => {
    const newNotification = {
      id: '3',
      user_id: 'user1',
      type: 'mention',
      title: 'You were mentioned',
      message: 'Someone mentioned you in a comment',
      read: false,
      metadata: {},
      created_at: '2024-01-03T00:00:00Z',
    }

    ;(notificationService.subscribeToNotifications as jest.Mock).mockImplementation((callback) => {
      callback(newNotification)
      return () => {}
    })

    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('You were mentioned')).toBeInTheDocument()
    })
  })

  it('should display empty state when no notifications', async () => {
    ;(notificationService.getNotifications as jest.Mock).mockResolvedValue([])

    render(<NotificationCenter />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument()
    })
  })
}) 