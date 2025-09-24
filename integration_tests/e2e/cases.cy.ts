import CasesPage from '../pages/cases'
import Page from '../pages/page'

context('Cases', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubExampleTime')
  })

  it('Navigates to Cases page via primary navigation and sub navigation is present', () => {
    cy.signIn()
    cy.get('.moj-primary-navigation').contains('a', 'Cases').click()

    const casesPage = Page.verifyOnPage(CasesPage)
    casesPage.casesSubNav().should('exist')
    casesPage.casesCurfewBadge().should('exist')
    Page.verifyOnPage(CasesPage)
  })

  it('Navigates to Cases page via primary navigation and curfew badge is present', () => {
    cy.signIn()
    cy.get('.moj-primary-navigation').contains('a', 'Cases').click()

    const casesPage = Page.verifyOnPage(CasesPage)
    casesPage.casesCurfewBadge().should('exist')
    Page.verifyOnPage(CasesPage)
  })

  it('Navigates between Cases sub navigation tabs', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    // Overview tab (should be active by default)
    cy.get('[aria-current=page]').should('contain.text', 'Overview')
    cy.contains('h1', 'Overview')

    // Curfew Activity tab
    cy.get('[data-qa=cases-sub-navigation]').contains('a', 'Curfew Activity').click()
    cy.get('[aria-current=page]').should('contain.text', 'Curfew Activity')
    cy.contains('h1', 'Curfew')

    // Case Notes tab
    cy.get('[data-qa=cases-sub-navigation]').contains('a', 'Case Notes').click()
    cy.get('[aria-current=page]').should('contain.text', 'Case Notes')
    cy.contains('h1', 'Notes')
  })
})
