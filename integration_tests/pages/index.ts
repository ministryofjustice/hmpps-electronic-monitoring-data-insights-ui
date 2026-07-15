import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('')
  }

  checkOnPage(): void {
    cy.location('pathname').should('eq', '/')
    cy.title().should('contain', 'Home')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  servicePhaseBanner = (): PageElement => cy.get('[data-qa=service-phase-banner]')

  // The data-qa attribute is not avaialable in the 3rd party header and footer
  fallbackHeader = (): PageElement => cy.get('.probation-common-fallback-header')

  fallbackFooter = (): PageElement => cy.get('.probation-common-fallback-footer')

  profileInfoHeader = (): PageElement => cy.get('[data-qa=profile-info-header__subject-details]')
}
