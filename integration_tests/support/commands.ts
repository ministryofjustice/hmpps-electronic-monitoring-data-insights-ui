Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('checkDlItem', (label, value) => {
  cy.contains('dt', label).next('dd').should('have.text', value)
})
