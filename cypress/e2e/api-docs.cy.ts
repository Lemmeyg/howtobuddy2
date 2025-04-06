describe('API Documentation', () => {
  beforeEach(() => {
    // Sign in before each test
    cy.visit('/auth/signin')
    cy.get('input[type="email"]').type(Cypress.env('testEmail'))
    cy.get('input[type="password"]').type(Cypress.env('testPassword'))
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should display API documentation page', () => {
    cy.visit('/api-docs')
    cy.get('[data-testid="api-docs-container"]').should('be.visible')
    cy.get('[data-testid="swagger-ui"]').should('be.visible')
  })

  it('should show all API endpoints', () => {
    cy.visit('/api-docs')
    
    // Check for document endpoints
    cy.get('[data-testid="documents-endpoints"]').should('be.visible')
    cy.get('[data-testid="get-documents"]').should('be.visible')
    cy.get('[data-testid="post-documents"]').should('be.visible')
    cy.get('[data-testid="get-document-by-id"]').should('be.visible')
    cy.get('[data-testid="put-document"]').should('be.visible')
    cy.get('[data-testid="delete-document"]').should('be.visible')

    // Check for template endpoints
    cy.get('[data-testid="templates-endpoints"]').should('be.visible')
    cy.get('[data-testid="get-templates"]').should('be.visible')
    cy.get('[data-testid="get-template-by-id"]').should('be.visible')
  })

  it('should display request/response schemas', () => {
    cy.visit('/api-docs')
    
    // Check for document schema
    cy.get('[data-testid="document-schema"]').should('be.visible')
    cy.get('[data-testid="document-properties"]').should('be.visible')
    
    // Check for template schema
    cy.get('[data-testid="template-schema"]').should('be.visible')
    cy.get('[data-testid="template-properties"]').should('be.visible')
  })

  it('should show authentication requirements', () => {
    cy.visit('/api-docs')
    
    // Check for security schemes
    cy.get('[data-testid="security-schemes"]').should('be.visible')
    cy.get('[data-testid="bearer-auth"]').should('be.visible')
    
    // Check for authorization header
    cy.get('[data-testid="auth-header"]').should('be.visible')
  })

  it('should allow testing API endpoints', () => {
    cy.visit('/api-docs')
    
    // Try to test GET /api/documents
    cy.get('[data-testid="try-out-get-documents"]').click()
    cy.get('[data-testid="execute-get-documents"]').click()
    
    // Check for response
    cy.get('[data-testid="response-get-documents"]').should('be.visible')
    cy.get('[data-testid="response-code"]').should('contain', '200')
  })
}) 