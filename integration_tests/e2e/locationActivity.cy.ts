import CasesPage from '../pages/cases'
import LocationActivityPage from '../pages/locationActivity'
import Page from '../pages/page'

context('Cases', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubExampleTime')
  })

  describe('Location Activity Page', () => {
    it('should display date search controls and the map', () => {
      cy.signIn()
      cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

      const casesPage = Page.verifyOnPage(CasesPage)
      casesPage.locationActivityLink().click()

      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.dateSearchForm().within(() => {
        locationPage.startDateInput().should('exist')
        locationPage.startHourInput().should('exist')
        locationPage.startMinuteInput().should('exist')

        locationPage.endDateInput().should('exist')
        locationPage.endHourInput().should('exist')
        locationPage.endMinuteInput().should('exist')

        locationPage.submitButton().should('exist')
      })

      locationPage.emMap().should('exist')
    })
  })
})
