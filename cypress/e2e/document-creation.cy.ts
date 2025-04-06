describe('Document Creation Flow', () => {
  beforeEach(() => {
    // Sign in before each test
    cy.visit('/auth/signin')
    cy.get('input[type="email"]').type(Cypress.env('testEmail'))
    cy.get('input[type="password"]').type(Cypress.env('testPassword'))
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should create a new document successfully', () => {
    cy.get('[data-testid="create-document-button"]').click()
    cy.url().should('include', '/documents/new')

    // Fill out the form
    cy.get('input[name="title"]').type('Test Document')
    cy.get('textarea[name="content"]').type('This is a test document content.')
    cy.get('button[type="submit"]').click()

    // Verify document was created
    cy.url().should('include', '/documents/')
    cy.get('h1').should('contain', 'Test Document')
    cy.get('[data-testid="document-content"]').should('contain', 'This is a test document content.')
  })

  it('should show validation errors for empty form', () => {
    cy.get('[data-testid="create-document-button"]').click()
    cy.url().should('include', '/documents/new')

    cy.get('button[type="submit"]').click()

    cy.get('[data-testid="error-message"]').should('be.visible')
    cy.get('[data-testid="error-message"]').should('contain', 'Title is required')
  })

  it('should save document changes', () => {
    // Create a document first
    cy.get('[data-testid="create-document-button"]').click()
    cy.get('input[name="title"]').type('Test Document')
    cy.get('textarea[name="content"]').type('Initial content')
    cy.get('button[type="submit"]').click()

    // Edit the document
    cy.get('textarea[name="content"]').clear().type('Updated content')
    cy.get('[data-testid="save-button"]').click()

    // Verify changes were saved
    cy.get('[data-testid="document-content"]').should('contain', 'Updated content')
    cy.get('[data-testid="save-success"]').should('be.visible')
  })

  it('should show version history', () => {
    // Create a document first
    cy.get('[data-testid="create-document-button"]').click()
    cy.get('input[name="title"]').type('Test Document')
    cy.get('textarea[name="content"]').type('Initial content')
    cy.get('button[type="submit"]').click()

    // Make some changes to create versions
    cy.get('textarea[name="content"]').clear().type('First change')
    cy.get('[data-testid="save-button"]').click()
    cy.get('textarea[name="content"]').clear().type('Second change')
    cy.get('[data-testid="save-button"]').click()

    // Open version history
    cy.get('[data-testid="version-history-button"]').click()
    cy.get('[data-testid="version-list"]').should('be.visible')
    cy.get('[data-testid="version-list"] li').should('have.length.at.least', 2)
  })

  it('should handle large document content', () => {
    cy.get('[data-testid="create-document-button"]').click()
    
    // Generate large content (50KB)
    const largeContent = 'A'.repeat(50 * 1024)
    
    cy.get('input[name="title"]').type('Large Document')
    cy.get('textarea[name="content"]').type(largeContent, { delay: 0 })
    cy.get('button[type="submit"]').click()

    // Verify document was created
    cy.url().should('include', '/documents/')
    cy.get('[data-testid="document-content"]').should('contain', largeContent)
  })

  it('should handle special characters in title and content', () => {
    cy.get('[data-testid="create-document-button"]').click()
    
    const specialTitle = '!@#$%^&*()_+ Test'
    const specialContent = '¡™£¢∞§¶•ªº Test Content'
    
    cy.get('input[name="title"]').type(specialTitle)
    cy.get('textarea[name="content"]').type(specialContent)
    cy.get('button[type="submit"]').click()

    // Verify document was created with special characters
    cy.url().should('include', '/documents/')
    cy.get('h1').should('contain', specialTitle)
    cy.get('[data-testid="document-content"]').should('contain', specialContent)
  })

  it('should handle concurrent edits', () => {
    // Create initial document
    cy.get('[data-testid="create-document-button"]').click()
    cy.get('input[name="title"]').type('Concurrent Test')
    cy.get('textarea[name="content"]').type('Initial content')
    cy.get('button[type="submit"]').click()

    // Simulate concurrent edit
    cy.get('textarea[name="content"]').clear().type('Edit 1')
    cy.get('[data-testid="save-button"]').click()
    
    // Open document in new tab (simulating another user)
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen')
    })
    cy.get('[data-testid="open-new-tab"]').click()
    
    // Make another edit
    cy.get('textarea[name="content"]').clear().type('Edit 2')
    cy.get('[data-testid="save-button"]').click()

    // Should show conflict warning
    cy.get('[data-testid="conflict-warning"]').should('be.visible')
  })

  it('should handle offline mode', () => {
    cy.get('[data-testid="create-document-button"]').click()
    
    // Simulate offline mode
    cy.window().then((win) => {
      cy.stub(win.navigator.onLine).returns(false)
      win.dispatchEvent(new Event('offline'))
    })

    cy.get('input[name="title"]').type('Offline Document')
    cy.get('textarea[name="content"]').type('Offline content')
    cy.get('button[type="submit"]').click()

    // Should show offline warning
    cy.get('[data-testid="offline-warning"]').should('be.visible')
    
    // Should save to local storage
    cy.window().then((win) => {
      const draft = JSON.parse(win.localStorage.getItem('document_draft')!)
      expect(draft.title).to.equal('Offline Document')
      expect(draft.content).to.equal('Offline content')
    })
  })

  it('should handle document templates', () => {
    cy.get('[data-testid="create-document-button"]').click()
    
    // Select template
    cy.get('[data-testid="template-selector"]').click()
    cy.get('[data-testid="template-option"]').first().click()

    // Verify template content is loaded
    cy.get('input[name="title"]').should('not.be.empty')
    cy.get('textarea[name="content"]').should('not.be.empty')

    // Modify template content
    cy.get('input[name="title"]').clear().type('Modified Template')
    cy.get('textarea[name="content"]').type(' - Modified')
    cy.get('button[type="submit"]').click()

    // Verify modified template was saved
    cy.url().should('include', '/documents/')
    cy.get('h1').should('contain', 'Modified Template')
  })
}) 