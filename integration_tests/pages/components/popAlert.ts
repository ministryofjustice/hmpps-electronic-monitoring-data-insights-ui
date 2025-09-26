class PopAlert {
  getAlert() {
    return cy.get('[data-qa="popCurfewStatusAlert"]')
  }

  getTitle() {
    return this.getAlert().find('.moj-alert__title')
  }

  getBody() {
    return this.getAlert().find('.moj-alert__body')
  }

  getDismissButton() {
    return this.getAlert().find('.moj-alert__dismiss')
  }
}

export default new PopAlert()
