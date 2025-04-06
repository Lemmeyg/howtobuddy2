describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/signin')
  })

  it('should sign in successfully', () => {
    cy.get('input[type="email"]').type(Cypress.env('testEmail'))
    cy.get('input[type="password"]').type(Cypress.env('testPassword'))
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/dashboard')
    cy.get('h1').should('contain', 'Dashboard')
  })

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com')
    cy.get('input[type="password"]').type('wrong-password')
    cy.get('button[type="submit"]').click()

    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.url().should('include', '/auth/signin')
  })

  it('should sign out successfully', () => {
    // Sign in first
    cy.get('input[type="email"]').type(Cypress.env('testEmail'))
    cy.get('input[type="password"]').type(Cypress.env('testPassword'))
    cy.get('button[type="submit"]').click()

    // Sign out
    cy.get('[data-testid="sign-out-button"]').click()
    cy.url().should('include', '/auth/signin')
  })

  it('should redirect to sign in when accessing protected route', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/auth/signin')
  })
}) 