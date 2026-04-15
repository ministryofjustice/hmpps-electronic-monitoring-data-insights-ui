import OlMap from 'ol/Map'
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

  emMap = (): PageElement => cy.get('[data-qa=em-map]')

  fillSearchForm = ({
    crn = '',
    startDate = '',
    startHour = '',
    startMinute = '',
    endDate = '',
    endHour = '',
    endMinute = '',
  }: {
    crn?: string
    startDate?: string
    startHour?: string
    startMinute?: string
    endDate?: string
    endHour?: string
    endMinute?: string
  }): void => {
    if (crn) {
      this.crnInput().type(crn)
    }
    if (startDate) {
      this.startDateInput().type(startDate)
    }
    if (startHour) {
      this.startHourInput().type(startHour)
    }
    if (startMinute) {
      this.startMinuteInput().type(startMinute)
    }
    if (endDate) {
      this.endDateInput().type(endDate)
    }
    if (endHour) {
      this.endHourInput().type(endHour)
    }
    if (endMinute) {
      this.endMinuteInput().type(endMinute)
    }
  }

  get mapInstance() {
    return cy
      .get('[data-qa=em-map]')
      .should($el => {
        const map = ($el[0] as HTMLElement & { olMapInstance: OlMap }).olMapInstance
        assert.isDefined(map, 'Map instance should be initialized')
      })
      .then($el => {
        return ($el[0] as HTMLElement & { olMapInstance: OlMap }).olMapInstance
      })
  }
}
