import Page, { PageElement } from './page'

export default class LocationActivityPage extends Page {
  constructor() {
    super('Location activity')
  }

  checkOnPage(): void {
    cy.get('h2').contains(this.title)
  }

  dateSearchForm = (): PageElement => cy.get('[data-qa=date-filter-form]')

  crnInput = (): PageElement => cy.get('[name="crn"]')

  startDateInput = (): PageElement => cy.get('input#start-date')

  startHourInput = (): PageElement => cy.get('[data-qa=start-hour]')

  startMinuteInput = (): PageElement => cy.get('[data-qa=start-minute]')

  endDateInput = (): PageElement => cy.get('input#end-date')

  endHourInput = (): PageElement => cy.get('[data-qa=end-hour]')

  endMinuteInput = (): PageElement => cy.get('[data-qa=end-minute]')

  submitButton = (): PageElement => cy.get('button[type="submit"]')

  emMap = (): PageElement => cy.get('em-map, #map, [data-testid="map"]')
}
