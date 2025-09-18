import IndexPage from '../pages/index'
import Page from '../pages/page'

context('Layout', () => {
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
})
