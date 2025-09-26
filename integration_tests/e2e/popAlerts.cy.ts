import CasesPage from '../pages/cases'
import Page from '../pages/page'
import PopAlert from '../pages/components/popAlert'

context('PoP Alert', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubExampleTime')
  })

  it('Navigates to Cases page via primary navigation and the PoP Alert is present', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    Page.verifyOnPage(CasesPage)

    PopAlert.getAlert().should('be.visible')
    PopAlert.getAlert().within(() => {
      cy.get('.moj-alert__heading').should(
        'contain.text',
        'Richard Marks has violated their curfew within the last 7 days',
      )
      cy.get('a').should('have.text', 'View Richards’s compliance').and('have.attr', 'href', '#')
    })
  })

  it('Navigates to Cases Notes via primary navigation and PoP Alert is not present', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()
    Page.verifyOnPage(CasesPage)
    cy.get('[data-qa=cases-sub-navigation]').contains('a', 'Case Notes').click()
    PopAlert.getAlert().should('not.exist')
  })
})
