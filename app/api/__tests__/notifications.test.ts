import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { GET, POST, PATCH, DELETE } from '../notifications/route'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Notifications API', () => {
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
      single: jest.fn().mockReturnThis(),
    }

    ;(createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
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
          eq: () => ({
            order: () => ({
              limit: () => ({
                then: (callback: any) => callback({ data: mockNotifications, error: null }),
              }),
            }),
          }),
        }),
      }))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockNotifications)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
      })

      const response = await GET()

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/notifications', () => {
    it('should create a new notification', async () => {
      const mockNotification = {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: false,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.from.mockImplementation(() => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              then: (callback: any) => callback({ data: mockNotification, error: null }),
            }),
          }),
        }),
      }))

      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'document_update',
          title: 'Test Notification',
          message: 'Test Message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockNotification)
    })

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'document_update',
          // Missing title and message
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/notifications', () => {
    it('should update notification read status', async () => {
      const mockNotification = {
        id: '1',
        type: 'document_update',
        title: 'Test Notification',
        message: 'Test Message',
        read: true,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => ({
                then: (callback: any) => callback({ data: mockNotification, error: null }),
              }),
            }),
          }),
        }),
      }))

      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          notificationId: '1',
          read: true,
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockNotification)
    })

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({
          // Missing notificationId and read
        }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/notifications', () => {
    it('should delete a notification', async () => {
      mockSupabase.from.mockImplementation(() => ({
        delete: () => ({
          eq: () => ({
            then: (callback: any) => callback({ error: null }),
          }),
        }),
      }))

      const request = new Request('http://localhost:3000/api/notifications?id=1', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(204)
    })

    it('should return 400 for missing notification ID', async () => {
      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'DELETE',
      })

      const response = await DELETE(request)

      expect(response.status).toBe(400)
    })
  })
}) 