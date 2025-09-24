import Page, { PageElement } from './page'

export default class CasesPage extends Page {
  constructor() {
    super('Overview')
  }

  casesSubNav = (): PageElement => cy.get('[data-qa=cases-sub-navigation]')
}
