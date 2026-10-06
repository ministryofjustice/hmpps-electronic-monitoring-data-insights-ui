import CasesPage from '../pages/cases'
import LocationActivityPage from '../pages/locationActivity'
import Page from '../pages/page'

const londonToday = (): string =>
  new Date().toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

const countOccurrences = (text: string, needle: string): number => text.split(needle).length - 1

const expectSingleInlineTimeMessage = (side: 'start' | 'end', message: string) => {
  cy.get(`#${side}-time-error`)
    .should('have.length', 1)
    .invoke('text')
    .then(text => expect(countOccurrences(text, message), `"${message}" shown once inline`).to.eq(1))
}

context('Cases', () => {
  const locatioActivitySessionid = 'location-activity-session-id'

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubExampleTime')
    cy.intercept('GET', '**/os-map/vector/style', {
      statusCode: 200,
      fixture: 'vectorStyle.json',
      headers: {
        'Content-Type': 'application/json',
      },
    }).as('getStyle')

    cy.intercept('GET', '**/os-map/vector/tiles/**', {
      statusCode: 200,
      body: '',
      headers: { 'Content-Type': 'application/x-protobuf' },
    }).as('getTiles')

    cy.session(locatioActivitySessionid, () => {
      cy.signIn()
    })
    cy.visit('/cases/1/overview')

    const casesPage = Page.verifyOnPage(CasesPage)
    casesPage.locationActivityLink().click()
  })

  describe('Location Activity Page', () => {
    it('should display date search controls and the map', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.dateSearchForm().within(() => {
        locationPage.startDateInput().should('exist')
        locationPage.startHourInput().should('exist')
        locationPage.startMinuteInput().should('exist')

        locationPage.endDateInput().should('exist')
        locationPage.endHourInput().should('exist')
        locationPage.endMinuteInput().should('exist')

        locationPage.submitButton().should('exist')
        locationPage.clearFiltersLink().should('exist')
      })

      locationPage.emMap().should('exist')
    })
    it('should not display any error messages on initial load', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('.govuk-error-message').should('not.exist')
      cy.title().should('not.match', /^Error: /)
    })
  })

  describe('Form validation - empty fields', () => {
    it('should show validation errors when submitting with all empty fields', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.title().should('match', /^Error: /)
      cy.get('.govuk-error-summary__title').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary__list').within(() => {
        cy.contains(`Select or enter a 'date from'`).should('exist')
        cy.contains(`Enter a 'time from'`).should('exist')
        cy.contains(`Select or enter a 'date to'`).should('exist')
        cy.contains(`Enter a 'time to'`).should('exist')
        cy.contains(`Enter an hour for`).should('not.exist')
      })
      locationPage.errorSummaryLinks().should('have.length', 4)

      cy.contains(`Select or enter a 'date from'`).should('exist')
      cy.contains(`Select or enter a 'date to'`).should('exist')
      cy.contains(`Enter a 'time from'`).should('exist')
      cy.contains(`Enter a 'time to'`).should('exist')
    })

    it('should show validation errors for missing end date fields only', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
      })

      locationPage.endDateInput().clear()

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains(`Select or enter a 'date to'`).should('exist')
      cy.contains(`Enter a 'time to'`).should('exist')
      locationPage.errorSummaryLinks().should('have.length', 2)

      cy.contains(`Enter a 'time from'`).should('not.exist')
    })
  })

  describe('Form validation - invalid date format', () => {
    it('should show error for invalid date format', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '2026-01-01', // Wrong format
        startHour: '10',
        startMinute: '00',
        endDate: '2026-01-02',
        endHour: '15',
        endMinute: '30',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains('Enter date in the format DD/MM/YYYY').should('exist')
    })

    it('should show error for a date that does not exist', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '31/02/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '15',
        endMinute: '30',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains('Enter a correct date').should('exist')
      locationPage.errorSummaryLinks().should('have.length', 1)
    })
  })

  describe('Form validation - invalid time values', () => {
    it('should show error for hour value greater than 23 and highlight only the hour', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '25', // Invalid
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '10',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains('Enter a correct hour').should('exist')
      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.expectHighlighted('start-hour')
      locationPage.submitButton().click()
      locationPage.expectNotHighlighted('start-minute', 'end-hour', 'end-minute')
    })

    it('should show error for minute value greater than 59 and highlight only the minute', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '65', // Invalid
        endDate: '02/01/2026',
        endHour: '10',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains('Enter the correct minutes').should('exist')
      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.expectHighlighted('start-minute')
      locationPage.expectNotHighlighted('start-hour', 'end-hour', 'end-minute')
    })
  })

  describe('Form validation - hour and minute highlighting', () => {
    it('should highlight both inputs with one summary link and one inline message when the whole time is empty', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.errorSummaryLinks().should('contain', `Enter a 'time to'`)
      locationPage.errorSummaryLinks().should('have.attr', 'href', '#end-hour')

      expectSingleInlineTimeMessage('end', `Enter a 'time to'`)
      locationPage.expectHighlighted('end-hour', 'end-minute')
      locationPage.expectNotHighlighted('start-hour', 'start-minute')
    })

    it('should highlight only the hour when only the hour is empty', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endMinute: '30',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.errorSummaryLinks().should('contain', `Enter an hour for 'time to'`)
      locationPage.expectHighlighted('end-hour')
      locationPage.expectNotHighlighted('end-minute')
    })

    it('should highlight only the minute when only the minute is empty', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '15',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.errorSummaryLinks().should('contain', `Enter the minutes for 'time to'`)
      locationPage.errorSummaryLinks().should('have.attr', 'href', '#end-minute')
      locationPage.expectHighlighted('end-minute')
      locationPage.expectNotHighlighted('end-hour')
    })

    it('should show both messages and highlight both inputs when the hour is empty and the minute is invalid', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endMinute: '60',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 2)
      locationPage.errorSummaryLinks().should('contain', `Enter an hour for 'time to'`)
      locationPage.errorSummaryLinks().should('contain', 'Enter the correct minutes')
      cy.get('#end-time-error')
        .should('contain', `Enter an hour for 'time to'`)
        .and('contain', 'Enter the correct minutes')
      locationPage.expectHighlighted('end-hour', 'end-minute')
    })

    it('should highlight both inputs with a single message when time to is later today', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)
      const today = londonToday()

      locationPage.fillSearchForm({
        startDate: today,
        startHour: '00',
        startMinute: '00',
        endDate: today,
        endHour: '23',
        endMinute: '59',
      })

      locationPage.submitButton().click()

      cy.title().should('match', /^Error: /)
      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.errorSummaryLinks().should('contain', `Enter a 'time to' that is in the past`)
      expectSingleInlineTimeMessage('end', `Enter a 'time to' that is in the past`)
      locationPage.expectHighlighted('end-hour', 'end-minute')
      locationPage.expectNotHighlighted('start-hour', 'start-minute')

      cy.get('#end-hour').should('have.value', '23')
      cy.get('#end-minute').should('have.value', '59')
    })

    it('should show an error for each side when both times are later today', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)
      const today = londonToday()

      locationPage.fillSearchForm({
        startDate: today,
        startHour: '23',
        startMinute: '58',
        endDate: today,
        endHour: '23',
        endMinute: '59',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 2)
      locationPage.errorSummaryLinks().should('contain', `Enter a 'time from' that is in the past`)
      locationPage.errorSummaryLinks().should('contain', `Enter a 'time to' that is in the past`)
      expectSingleInlineTimeMessage('start', `Enter a 'time from' that is in the past`)
      expectSingleInlineTimeMessage('end', `Enter a 'time to' that is in the past`)
      locationPage.expectHighlighted('start-hour', 'start-minute', 'end-hour', 'end-minute')
    })

    it('should highlight both end inputs with a single message when time to is before time from on the same date', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '15',
        startMinute: '30',
        endDate: '01/01/2026',
        endHour: '10',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 1)
      locationPage.errorSummaryLinks().should('contain', `'Time to' must be after 'time from'`)
      locationPage.errorSummaryLinks().should('have.attr', 'href', '#end-hour')
      expectSingleInlineTimeMessage('end', `'Time to' must be after 'time from'`)
      locationPage.expectHighlighted('end-hour', 'end-minute')
      locationPage.expectNotHighlighted('start-hour', 'start-minute')
    })

    it('should show a date error and a time error together on the same side', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '2026-01-01', // Wrong format
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 2)
      locationPage.errorSummaryLinks().should('contain', 'Enter date in the format DD/MM/YYYY')
      locationPage.errorSummaryLinks().should('contain', `Enter a 'time to'`)
      locationPage.expectHighlighted('end-hour', 'end-minute')
      locationPage.expectNotHighlighted('start-hour', 'start-minute')
    })

    it('should give every summary link a target when several inputs are invalid', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '2026-01-01', // Wrong format
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '25',
        endMinute: '60',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().should('have.length', 3)
      locationPage.errorSummaryLinks().then($links => {
        const hrefs = $links.toArray().map(link => link.getAttribute('href'))
        expect(hrefs).to.have.members(['#start-date', '#end-hour', '#end-minute'])
        hrefs.forEach(href => cy.get(href as string).should('exist'))
      })
    })

    it('should focus the hour input when clicking a link for an error that highlights both inputs', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '15',
        startMinute: '30',
        endDate: '01/01/2026',
        endHour: '10',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      locationPage.errorSummaryLinks().contains(`'Time to' must be after 'time from'`).click()

      cy.focused().should('have.attr', 'id', 'end-hour')
    })

    it('should clear the errors and highlighting when clearing the filters', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '15',
        startMinute: '30',
        endDate: '01/01/2026',
        endHour: '10',
        endMinute: '00',
      })

      locationPage.submitButton().click()
      locationPage.expectHighlighted('end-hour', 'end-minute')

      locationPage.dateSearchForm().within(() => {
        locationPage.clearFiltersLink().click()
      })

      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('.govuk-error-message').should('not.exist')
      locationPage.expectNotHighlighted('end-hour', 'end-minute')
    })
  })

  describe('Form validation - date range logic', () => {
    it('should show error when end date is before start date', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '05/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '01/01/2026',
        endHour: '15',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains(`'Date to' must be after 'date from'`).should('exist')
    })

    it('should show error when end time is before start time on same date', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      cy.task('stubGetLocations', { crn: 'X123456', locations: [] })
      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '15',
        startMinute: '30',
        endDate: '01/01/2026',
        endHour: '10',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains(`'Time to' must be after 'time from'`).should('exist')
    })
  })

  describe('Successful search', () => {
    it('should submit form with valid data and display no errors', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)
      const locationData = [
        {
          timestamp: '2026-01-01T12:00:00Z',
          latitude: 51.5074,
          longitude: -0.1278,
          geolocationMechanism: 'GPS',
        },
      ]

      cy.task('stubGetLocations', { crn: 'X123456', locations: locationData })

      cy.intercept('GET', '/cases/*/location-activity?*').as('getLocationData')

      locationPage.fillSearchForm({
        crn: 'X123456',
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '15',
        endMinute: '30',
      })

      locationPage.submitButton().click()

      cy.wait('@getLocationData')
      cy.get('.govuk-error-summary').should('not.exist')
    })

    it('should display "no location data" message when no results found', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      cy.task('stubGetLocations', { crn: 'X123456', locations: [] })
      cy.intercept('GET', '/cases/*/location-activity?*').as('getNoLocationData')

      locationPage.fillSearchForm({
        crn: 'X123456',
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '15',
        endMinute: '30',
      })

      locationPage.submitButton().click()
      cy.wait('@getNoLocationData')
      cy.get('[data-qa=location-data-error]')
        .invoke('text')
        .then(text => text.trim())
        .should('eq', 'No location data found for the selected date range.')
    })
  })

  describe('Error summary links', () => {
    it('should focus correct field when clicking error summary link', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary a').contains(`Select or enter a 'date to'`).click()

      cy.focused().should('have.attr', 'id', 'end-date')
    })

    it('should focus hour field when clicking hour error link', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '25',
        endMinute: '00',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary a').contains('Enter a correct hour').click()

      cy.focused().should('have.attr', 'id', 'end-hour')
    })
  })

  describe('API error handling', () => {
    it('should display error message when API call fails', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      cy.task('stubGetLocationsError', 'X123456')
      cy.intercept('GET', '/cases/*/location-activity?*').as('getLocationDataError')

      locationPage.fillSearchForm({
        crn: 'X123456',
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
        endHour: '15',
        endMinute: '30',
      })

      locationPage.submitButton().click()

      cy.wait('@getLocationDataError')
      cy.contains('Unable to fetch location data. Please try again later.').should('exist')
    })
  })

  describe('Map screen reader accessibility', () => {
    describe('Map region', () => {
      it('should have a region landmark with a label', () => {
        cy.get('[data-qa=em-map]').should('have.attr', 'role', 'region')
        cy.get('[data-qa=em-map]').should('have.attr', 'aria-label', 'Interactive map')
      })

      it('should have aria-describedby linking to instructions', () => {
        cy.get('[data-qa=em-map]').should('have.attr', 'aria-describedby', 'map-instructions')
        cy.get('#map-instructions').should('exist')
        cy.get('#map-instructions').should('not.be.empty')
      })
    })

    describe('Pan announcements', () => {
      it('should have a live region for pan announcements', () => {
        cy.get('#map-pan-announce').should('have.attr', 'aria-live', 'polite')
        cy.get('#map-pan-announce').should('have.attr', 'aria-atomic', 'true')
      })
    })

    describe('Rotation controls', () => {
      it('should not show an orientation lock control', () => {
        cy.get('#lock-rotation-btn', { includeShadowDom: true }).should('not.exist')
      })

      it('should not include a rotation status live region', () => {
        cy.get('#map-rotation-status').should('not.exist')
      })
    })
  })

  describe('Date auto-fill behaviour', () => {
    it('should automatically set the end date to match the start date when end date is empty', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)
      locationPage.startDateInput().type('01/01/2026')
      locationPage.startDateInput().blur()
      locationPage.endDateInput().should('have.value', '01/01/2026')
    })

    it('should not change the end date if it is already set when start date is changed', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)
      locationPage.startDateInput().type('01/01/2026')
      locationPage.endDateInput().clear().type('02/01/2026')
      locationPage.startDateInput().focus().blur()
      locationPage.endDateInput().should('have.value', '02/01/2026')
    })
  })

  describe('Update map button', () => {
    it('should re-enable the update map button once the map finishes loading', () => {
      const locationData = [
        {
          timestamp: '2026-01-01T12:00:00Z',
          latitude: 51.5074,
          longitude: -0.1278,
          geolocationMechanism: 'GPS',
        },
      ]
      cy.task('stubGetLocations', { crn: 'X123456', locations: locationData })

      cy.visit(
        '/cases/1/location-activity?start[date]=01/01/2026&start[hour]=10&start[minute]=00&end[date]=02/01/2026&end[hour]=15&end[minute]=30',
      )

      const locationPage = Page.verifyOnPage(LocationActivityPage)
      locationPage.submitButton().should('not.be.disabled')
    })

    it('should not disable the update map button on initial page load with no search performed', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)
      locationPage.submitButton().should('not.be.disabled')
    })
  })
})
