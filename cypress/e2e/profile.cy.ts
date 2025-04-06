describe('Profile Page', () => {
  beforeEach(() => {
    // Sign in before each test
    cy.visit('/signin')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should navigate to profile page', () => {
    cy.get('[data-testid="user-nav"]').click()
    cy.get('[data-testid="profile-settings"]').click()
    cy.url().should('include', '/profile')
    cy.get('h1').should('contain', 'Profile Settings')
  })

  it('should update profile information', () => {
    cy.visit('/profile')
    
    // Update profile information
    cy.get('input[id="name"]').clear().type('Updated Name')
    cy.get('input[id="company"]').clear().type('Updated Company')
    cy.get('input[id="role"]').clear().type('Updated Role')
    cy.get('input[id="bio"]').clear().type('Updated Bio')
    
    // Save changes
    cy.get('button').contains('Save Changes').click()
    
    // Verify toast message
    cy.get('[role="alert"]')
      .should('contain', 'Profile updated')
      .should('contain', 'Your profile has been updated successfully.')
    
    // Reload page and verify persistence
    cy.reload()
    cy.get('input[id="name"]').should('have.value', 'Updated Name')
    cy.get('input[id="company"]').should('have.value', 'Updated Company')
    cy.get('input[id="role"]').should('have.value', 'Updated Role')
    cy.get('input[id="bio"]').should('have.value', 'Updated Bio')
  })

  it('should update notification preferences', () => {
    cy.visit('/profile')
    
    // Navigate to notifications tab
    cy.get('button').contains('Notifications').click()
    
    // Toggle notification settings
    cy.get('label').contains('Document Updates').parent().find('button[role="switch"]').click()
    cy.get('label').contains('Comments').parent().find('button[role="switch"]').click()
    
    // Verify toast message
    cy.get('[role="alert"]').should('be.visible')
    
    // Reload page and verify persistence
    cy.reload()
    cy.get('button').contains('Notifications').click()
    cy.get('label')
      .contains('Document Updates')
      .parent()
      .find('button[role="switch"]')
      .should('have.attr', 'aria-checked', 'true')
    cy.get('label')
      .contains('Comments')
      .parent()
      .find('button[role="switch"]')
      .should('have.attr', 'aria-checked', 'true')
  })

  it('should change password', () => {
    cy.visit('/profile')
    
    // Navigate to security tab
    cy.get('button').contains('Security').click()
    
    // Fill in password fields
    cy.get('input[id="current-password"]').type('oldpassword123')
    cy.get('input[id="new-password"]').type('newpassword123')
    cy.get('input[id="confirm-password"]').type('newpassword123')
    
    // Update password
    cy.get('button').contains('Update Password').click()
    
    // Verify toast message
    cy.get('[role="alert"]')
      .should('contain', 'Password updated')
      .should('contain', 'Your password has been updated successfully.')
  })

  it('should toggle 2FA', () => {
    cy.visit('/profile')
    
    // Navigate to security tab
    cy.get('button').contains('Security').click()
    
    // Toggle 2FA
    cy.get('label').contains('Enable 2FA').parent().find('button[role="switch"]').click()
    
    // Verify toast message
    cy.get('[role="alert"]').should('be.visible')
    
    // Reload page and verify persistence
    cy.reload()
    cy.get('button').contains('Security').click()
    cy.get('label')
      .contains('Enable 2FA')
      .parent()
      .find('button[role="switch"]')
      .should('have.attr', 'aria-checked', 'true')
  })

  it('should handle profile update errors', () => {
    cy.visit('/profile')
    
    // Intercept profile update request and force an error
    cy.intercept('PUT', '/api/profile', {
      statusCode: 500,
      body: { error: 'Failed to update profile' },
    }).as('updateProfile')
    
    // Try to update profile
    cy.get('input[id="name"]').clear().type('Updated Name')
    cy.get('button').contains('Save Changes').click()
    
    // Verify error toast
    cy.get('[role="alert"]')
      .should('contain', 'Error')
      .should('contain', 'Failed to update profile')
  })

  it('should handle network errors gracefully', () => {
    cy.visit('/profile')
    
    // Simulate offline state
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false)
    })
    
    // Try to update profile
    cy.get('input[id="name"]').clear().type('Updated Name')
    cy.get('button').contains('Save Changes').click()
    
    // Verify error toast
    cy.get('[role="alert"]')
      .should('contain', 'Error')
      .should('contain', 'Failed to update profile')
  })
}) 