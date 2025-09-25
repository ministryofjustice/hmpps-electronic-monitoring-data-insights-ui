import IndexPage from '../pages/index'
import Page from '../pages/page'

context('Layout', () => {
  const profileDetails = [
    { label: 'CRN:', value: 'X172591 ' },
    { label: 'Date of birth:', value: '7 October 1964' },
    { label: 'Tier:', value: 'B3' },
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

  it('Should display the PoP info header labels and values', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.verifyProfileDetails(profileDetails)
  })
})
