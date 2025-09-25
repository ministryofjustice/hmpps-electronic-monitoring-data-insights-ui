declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    /**
     * Custom command to find a <dt> and check the following <dd> has the correct text.
     * @example cy.checkDlItem('CRN:', '123456789 ')
     */
    checkDlItem(label: string, value: string): void
  }
}
