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
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    const casesPage = Page.verifyOnPage(CasesPage)
    casesPage.casesSubNav().should('exist')
    casesPage.casesCurfewBadge().should('exist')
    Page.verifyOnPage(CasesPage)
  })

  it('Navigates to Cases page via primary navigation and curfew badge is present', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    const casesPage = Page.verifyOnPage(CasesPage)
    casesPage.casesCurfewBadge().should('exist')
    Page.verifyOnPage(CasesPage)
  })

  it('Navigates between Cases sub navigation tabs', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    // Overview tab (should be active by default)
    cy.get('[aria-current=page]').should('contain.text', 'Overview')
    cy.contains('h1', 'Adam Collins')

    // Curfew activity tab
    cy.get('[data-qa=cases-sub-navigation]').contains('a', 'Curfew activity').click()
    cy.get('[aria-current=page]').should('contain.text', 'Curfew activity')
    cy.contains('h1', 'Curfew')

    // Case notes tab
    cy.get('[data-qa=cases-sub-navigation]').contains('a', 'Case notes').click()
    cy.get('[aria-current=page]').should('contain.text', 'Case notes')
    cy.contains('h1', 'Notes')
  })

  it('should display all expected summary keys', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    const expectedKeys = [
      'Name',
      'Date of birth',
      'Gender',
      'Address',
      'Aliases',
      'Current circumstances',
      'Disabilities',
      'Adjustments',
      'Approved address',
      'Phone number',
      'Mobile number',
      'Email address',
      'Responsible officer (RO)',
      'Main offence',
      'Email',
      'Order',
      'EM licence conditions',
      'Start date',
      'End date',
      'Tag fitted',
      'Days remaining',
      'Released',
      'Released from',
      'Tag model',
      'Tag serial number',
      'Tag status',
      'HMU model',
      'HMU status',
      'Monday to Friday',
      'Saturday and Sunday',
      'Monday to Sunday',
    ]

    cy.get('.govuk-summary-list__key').each($els => {
      expect(expectedKeys).to.include($els.text().trim())
    })
  })

  it('should display all expected summary card titles', () => {
    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

    const expectedTitles = [
      'Personal details',
      'Contact details',
      'Responsible officer (RO)',
      'Sentence',
      'Curfew tag details',
      'Help and support',
    ]

    cy.get('.govuk-summary-card__title').each($els => {
      expect(expectedTitles).to.include($els.text().trim())
    })
  })
})
