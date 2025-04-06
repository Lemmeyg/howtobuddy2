describe('Analytics Dashboard', () => {
  beforeEach(() => {
    // Sign in before each test
    cy.visit('/auth/signin')
    cy.get('input[type="email"]').type(Cypress.env('testEmail'))
    cy.get('input[type="password"]').type(Cypress.env('testPassword'))
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should display analytics overview', () => {
    cy.visit('/analytics')
    cy.get('[data-testid="analytics-overview"]').should('be.visible')
    
    // Check for key metrics
    cy.get('[data-testid="total-documents"]').should('be.visible')
    cy.get('[data-testid="total-video-minutes"]').should('be.visible')
    cy.get('[data-testid="template-usage"]').should('be.visible')
  })

  it('should show document statistics', () => {
    cy.visit('/analytics')
    cy.get('[data-testid="document-stats"]').should('be.visible')
    
    // Check for document metrics
    cy.get('[data-testid="documents-created"]').should('be.visible')
    cy.get('[data-testid="documents-updated"]').should('be.visible')
    cy.get('[data-testid="documents-deleted"]').should('be.visible')
  })

  it('should display activity timeline', () => {
    cy.visit('/analytics')
    cy.get('[data-testid="activity-timeline"]').should('be.visible')
    
    // Check for recent activity items
    cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1)
  })

  it('should show template usage statistics', () => {
    cy.visit('/analytics')
    cy.get('[data-testid="template-stats"]').should('be.visible')
    
    // Check for template metrics
    cy.get('[data-testid="template-usage-chart"]').should('be.visible')
    cy.get('[data-testid="most-used-template"]').should('be.visible')
  })

  it('should allow filtering by date range', () => {
    cy.visit('/analytics')
    
    // Open date range picker
    cy.get('[data-testid="date-range-picker"]').click()
    
    // Select a custom range
    cy.get('[data-testid="custom-range"]').click()
    cy.get('[data-testid="start-date"]').type('2024-01-01')
    cy.get('[data-testid="end-date"]').type('2024-12-31')
    cy.get('[data-testid="apply-range"]').click()
    
    // Verify data is filtered
    cy.get('[data-testid="filtered-data"]').should('be.visible')
  })
}) 