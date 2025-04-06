describe('Documentation Page', () => {
  beforeEach(() => {
    // Sign in before each test
    cy.visit('/auth/signin')
    cy.get('input[type="email"]').type(Cypress.env('testEmail'))
    cy.get('input[type="password"]').type(Cypress.env('testPassword'))
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })

  it('should display documentation page', () => {
    cy.visit('/docs')
    cy.get('h1').should('contain', 'HowToBuddy Documentation')
  })

  it('should show all documentation tabs', () => {
    cy.visit('/docs')
    
    // Check for all tabs
    cy.get('button').contains('Getting Started').should('be.visible')
    cy.get('button').contains('Documents').should('be.visible')
    cy.get('button').contains('Templates').should('be.visible')
    cy.get('button').contains('Analytics').should('be.visible')
  })

  it('should navigate between tabs', () => {
    cy.visit('/docs')
    
    // Click through each tab and verify content
    cy.get('button').contains('Documents').click()
    cy.get('h2').should('contain', 'Working with Documents')
    
    cy.get('button').contains('Templates').click()
    cy.get('h2').should('contain', 'Using Templates')
    
    cy.get('button').contains('Analytics').click()
    cy.get('h2').should('contain', 'Understanding Analytics')
    
    cy.get('button').contains('Getting Started').click()
    cy.get('h2').should('contain', 'Getting Started with HowToBuddy')
  })

  it('should show help section with all cards', () => {
    cy.visit('/docs')
    
    // Check for help section
    cy.get('h2').contains('Need Help?').should('be.visible')
    cy.get('button').contains('Contact Support').should('be.visible')
    cy.get('button').contains('View API Docs').should('be.visible')
    cy.get('button').contains('Watch Tutorials').should('be.visible')
  })

  it('should have working links and buttons', () => {
    cy.visit('/docs')
    
    // Check Create Document button
    cy.get('button').contains('Create Document').should('be.visible')
    cy.get('button').contains('Watch Tutorial').should('be.visible')
    
    // Check support links
    cy.get('button').contains('Contact Support').should('be.visible')
    cy.get('button').contains('View API Docs').should('be.visible')
    cy.get('button').contains('Watch Tutorials').should('be.visible')
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      cy.visit('/docs')
    })

    it('should show search input', () => {
      cy.get('input[type="search"]').should('be.visible')
      cy.get('input[type="search"]').should('have.attr', 'placeholder', 'Search documentation...')
    })

    it('should search and show relevant content', () => {
      // Search for "version"
      cy.get('input[type="search"]').type('version')
      
      // Should automatically switch to Documents tab
      cy.get('h2').should('contain', 'Working with Documents')
      cy.get('h3').should('contain', 'Version History')
    })

    it('should search case-insensitively', () => {
      // Search with different cases
      cy.get('input[type="search"]').type('TEMPLATE')
      cy.get('h2').should('contain', 'Using Templates')

      cy.get('input[type="search"]').clear().type('template')
      cy.get('h2').should('contain', 'Using Templates')
    })

    it('should handle no search results gracefully', () => {
      // Search for non-existent term
      cy.get('input[type="search"]').type('nonexistentterm')
      
      // Should stay on current tab
      cy.get('h2').should('contain', 'Getting Started with HowToBuddy')
    })

    it('should clear search results when input is cleared', () => {
      // Search for something
      cy.get('input[type="search"]').type('version')
      cy.get('h3').should('contain', 'Version History')
      
      // Clear search
      cy.get('input[type="search"]').clear()
      
      // Should show default tab
      cy.get('h2').should('contain', 'Getting Started with HowToBuddy')
    })
  })

  describe('Detailed Content', () => {
    beforeEach(() => {
      cy.visit('/docs')
    })

    it('should show detailed getting started steps', () => {
      cy.get('h3').contains('Create an Account').parent().within(() => {
        cy.get('ul').should('be.visible')
        cy.get('li').should('have.length', 4)
      })
    })

    it('should show dashboard features', () => {
      cy.get('h3').contains('Dashboard Overview').parent().within(() => {
        cy.get('ul').should('be.visible')
        cy.get('li').should('have.length', 4)
        cy.get('li').contains('Recent Documents').should('be.visible')
      })
    })

    it('should show document creation details', () => {
      cy.get('h3').contains('Create Your First Document').parent().within(() => {
        cy.get('ul').should('be.visible')
        cy.get('li').contains('keyboard shortcut').should('be.visible')
        cy.get('button').contains('Watch Tutorial').should('be.visible')
      })
    })
  })
}) 