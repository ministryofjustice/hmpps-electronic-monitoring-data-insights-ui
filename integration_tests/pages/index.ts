import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('This site is under construction...')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  fallbackHeader = (): PageElement => cy.get('.probation-common-fallback-header')

  fallbackFooter = (): PageElement => cy.get('.probation-common-fallback-footer')

  profileInfoHeader = (): PageElement => cy.get('[data-qa=profile-info-header__subject-details]')

  verifyProfileDetails(details) {
    this.profileInfoHeader().within(() => {
      details.forEach(item => {
        cy.checkDlItem(item.label, item.value)
      })
    })
  }
}
