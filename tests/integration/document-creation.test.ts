import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

test.describe('Document Creation Flow', () => {
  let userId: string
  let documentId: string

  test.beforeAll(async () => {
    // Create a test user
    const { data: user, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password',
    })
    if (error) throw error
    userId = user.user!.id
  })

  test.afterAll(async () => {
    // Clean up test data
    if (documentId) {
      await supabase.from('documents').delete().eq('id', documentId)
    }
    if (userId) {
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.auth.admin.deleteUser(userId)
    }
  })

  test('should create a new document', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test-password')
    await page.click('button[type="submit"]')

    // Navigate to documents page
    await page.goto('/dashboard')
    await page.click('text=New Document')

    // Fill document form
    await page.fill('input[name="title"]', 'Test Document')
    await page.fill('textarea[name="content"]', 'Test content')
    await page.selectOption('select[name="document_type"]', 'text')
    await page.click('button[type="submit"]')

    // Verify document was created
    await expect(page).toHaveURL(/\/documents\/[a-f0-9-]+/)
    await expect(page.locator('h1')).toContainText('Test Document')

    // Get document ID from URL
    const url = page.url()
    documentId = url.split('/').pop()!
  })

  test('should handle document creation errors', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'test-password')
    await page.click('button[type="submit"]')

    // Navigate to documents page
    await page.goto('/dashboard')
    await page.click('text=New Document')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Verify error messages
    await expect(page.locator('text=Title is required')).toBeVisible()
    await expect(page.locator('text=Content is required')).toBeVisible()
  })
}) 