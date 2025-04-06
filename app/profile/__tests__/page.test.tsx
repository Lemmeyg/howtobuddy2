import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import ProfilePage from '../page'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}))

describe('ProfilePage', () => {
  const mockSession = {
    user: {
      id: 'user1',
      email: 'test@example.com',
    },
  }

  const mockProfile = {
    id: 'profile1',
    user_id: 'user1',
    full_name: 'Test User',
    company: 'Test Company',
    role: 'Developer',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
  }

  let mockSupabase: any
  let mockRouter: any
  let mockToast: any

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      update: jest.fn().mockResolvedValue({ error: null }),
    }
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    // Mock router
    mockRouter = {
      push: jest.fn(),
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    // Mock toast
    mockToast = {
      toast: jest.fn(),
    }
    ;(useToast as jest.Mock).mockReturnValue(mockToast)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to sign in if no session exists', async () => {
    // Mock no session
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })

    render(<ProfilePage />)

    // Check if redirected to sign in
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/signin')
    })
  })

  it('should load and display profile data', async () => {
    render(<ProfilePage />)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Developer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })
  })

  it('should update profile when save button is clicked', async () => {
    render(<ProfilePage />)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Change profile data
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Updated User' },
    })
    fireEvent.change(screen.getByLabelText('Company'), {
      target: { value: 'Updated Company' },
    })

    // Click save button
    fireEvent.click(screen.getByText('Save Changes'))

    // Check if update was called
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        full_name: 'Updated User',
        company: 'Updated Company',
        role: 'Developer',
        bio: 'Test bio',
      })
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Profile updated successfully',
      })
    })
  })

  it('should handle profile update errors', async () => {
    // Mock update error
    mockSupabase.update.mockResolvedValueOnce({
      error: new Error('Failed to update profile'),
    })

    render(<ProfilePage />)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Change profile data and save
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Updated User' },
    })
    fireEvent.click(screen.getByText('Save Changes'))

    // Check if error toast was shown
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Error updating profile',
        variant: 'destructive',
      })
    })
  })

  it('should update notification settings', async () => {
    render(<ProfilePage />)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Switch to notifications tab
    fireEvent.click(screen.getByText('Notifications'))

    // Toggle notification settings
    fireEvent.click(screen.getByLabelText('Email Notifications'))
    fireEvent.click(screen.getByLabelText('In-app Notifications'))

    // Click save button
    fireEvent.click(screen.getByText('Save Changes'))

    // Check if update was called
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        email_notifications: true,
        in_app_notifications: true,
      })
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Notification settings updated successfully',
      })
    })
  })

  it('should handle password change', async () => {
    render(<ProfilePage />)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Switch to security tab
    fireEvent.click(screen.getByText('Security'))

    // Fill password form
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'current123' },
    })
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'new123' },
    })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'new123' },
    })

    // Click change password button
    fireEvent.click(screen.getByText('Change Password'))

    // Check if update was called
    await waitFor(() => {
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'new123',
      })
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Password updated successfully',
      })
    })
  })

  it('should handle account deletion', async () => {
    render(<ProfilePage />)

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Switch to security tab
    fireEvent.click(screen.getByText('Security'))

    // Click delete account button
    fireEvent.click(screen.getByText('Delete Account'))

    // Check if delete was called
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/signin')
    })
  })
}) 