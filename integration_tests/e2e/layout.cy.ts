import IndexPage from '../pages/index'
import Page from '../pages/page'

context('Layout', () => {
  const profileDetails = [
    { label: 'CRN:', value: 'X172591' },
    { label: 'Date of birth:', value: '7 October 1964' },
  ]

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubExampleTime')
  })

  it('Layout uses probation components fallback header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackHeader().should('exist')
  })

  it('Layout uses probation components fallback footer', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackFooter().should('exist')
  })

  it('Displays the service phase banner', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)

    indexPage.servicePhaseBanner().should('contain.text', 'Beta')
    indexPage.servicePhaseBanner().should('contain.text', 'This is a new service.')
    indexPage
      .servicePhaseBanner()
      .contains('a', 'Give feedback (opens in a new tab)')
      .should('have.attr', 'href', 'https://www.smartsurvey.co.uk/t/CF3MFT/')
      .and('have.attr', 'target', '_blank')
    indexPage
      .servicePhaseBanner()
      .contains('a', 'report a problem')
      .should('have.attr', 'href', 'mailto:emdisupport@justice.gov.uk?subject=EMDI problem')
  })

  it('Should display the PoP info header labels and values', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.verifyProfileDetails(profileDetails)
  })
})
