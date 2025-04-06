describe('Notification System', () => {
  beforeEach(() => {
    // Sign in before each test
    cy.visit('/signin')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should display notification bell with unread count', () => {
    // Intercept notifications API
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: '1',
          type: 'document_update',
          title: 'Document Updated',
          message: 'Your document has been updated',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          type: 'comment',
          title: 'New Comment',
          message: 'Someone commented on your document',
          read: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ],
    }).as('getNotifications')

    // Check notification bell
    cy.get('[data-testid="notification-bell"]').should('be.visible')
    cy.get('[data-testid="notification-count"]').should('contain', '1')
  })

  it('should open notification dropdown and display notifications', () => {
    // Intercept notifications API
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: '1',
          type: 'document_update',
          title: 'Document Updated',
          message: 'Your document has been updated',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    }).as('getNotifications')

    // Open notification dropdown
    cy.get('[data-testid="notification-bell"]').click()

    // Check notification content
    cy.get('[data-testid="notification-dropdown"]').should('be.visible')
    cy.get('[data-testid="notification-title"]').should('contain', 'Document Updated')
    cy.get('[data-testid="notification-message"]').should('contain', 'Your document has been updated')
  })

  it('should mark notification as read', () => {
    // Intercept notifications API
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: '1',
          type: 'document_update',
          title: 'Document Updated',
          message: 'Your document has been updated',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    }).as('getNotifications')

    // Intercept mark as read API
    cy.intercept('PATCH', '/api/notifications/1/read', {
      statusCode: 200,
    }).as('markAsRead')

    // Open notification dropdown and mark as read
    cy.get('[data-testid="notification-bell"]').click()
    cy.get('[data-testid="mark-as-read"]').click()

    // Check API call
    cy.wait('@markAsRead')
    cy.get('[data-testid="notification-count"]').should('not.exist')
  })

  it('should mark all notifications as read', () => {
    // Intercept notifications API
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: '1',
          type: 'document_update',
          title: 'Document Updated',
          message: 'Your document has been updated',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          type: 'comment',
          title: 'New Comment',
          message: 'Someone commented on your document',
          read: false,
          created_at: '2024-01-02T00:00:00Z',
        },
      ],
    }).as('getNotifications')

    // Intercept mark all as read API
    cy.intercept('PATCH', '/api/notifications/read-all', {
      statusCode: 200,
    }).as('markAllAsRead')

    // Open notification dropdown and mark all as read
    cy.get('[data-testid="notification-bell"]').click()
    cy.get('[data-testid="mark-all-read"]').click()

    // Check API call
    cy.wait('@markAllAsRead')
    cy.get('[data-testid="notification-count"]').should('not.exist')
  })

  it('should delete notification', () => {
    // Intercept notifications API
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [
        {
          id: '1',
          type: 'document_update',
          title: 'Document Updated',
          message: 'Your document has been updated',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    }).as('getNotifications')

    // Intercept delete API
    cy.intercept('DELETE', '/api/notifications/1', {
      statusCode: 200,
    }).as('deleteNotification')

    // Open notification dropdown and delete
    cy.get('[data-testid="notification-bell"]').click()
    cy.get('[data-testid="delete-notification"]').click()

    // Check API call
    cy.wait('@deleteNotification')
    cy.get('[data-testid="notification-title"]').should('not.exist')
  })

  it('should receive real-time notifications', () => {
    // Intercept notifications API
    cy.intercept('GET', '/api/notifications', {
      statusCode: 200,
      body: [],
    }).as('getNotifications')

    // Open notification dropdown
    cy.get('[data-testid="notification-bell"]').click()

    // Simulate real-time notification
    cy.window().then((win) => {
      const event = new CustomEvent('notification', {
        detail: {
          id: '1',
          type: 'document_update',
          title: 'New Document',
          message: 'A new document has been created',
          read: false,
          created_at: '2024-01-03T00:00:00Z',
        },
      })
      win.dispatchEvent(event)
    })

    // Check new notification
    cy.get('[data-testid="notification-title"]').should('contain', 'New Document')
    cy.get('[data-testid="notification-message"]').should('contain', 'A new document has been created')
  })

  it('should handle notification errors gracefully', () => {
    // Intercept notifications API with error
    cy.intercept('GET', '/api/notifications', {
      statusCode: 500,
      body: { error: 'Failed to fetch notifications' },
    }).as('getNotifications')

    // Open notification dropdown
    cy.get('[data-testid="notification-bell"]').click()

    // Check error state
    cy.get('[data-testid="notification-error"]').should('be.visible')
    cy.get('[data-testid="notification-error"]').should('contain', 'Failed to load notifications')
  })
}) 