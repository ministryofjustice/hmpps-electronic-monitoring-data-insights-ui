import CasesPage from '../pages/cases'
import LocationActivityPage from '../pages/locationActivity'
import Page from '../pages/page'

context('Cases', () => {
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

    cy.signIn()
    cy.get('[data-qa=primary-navigation]').contains('a', 'Cases').click()

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
      })

      locationPage.emMap().should('exist')
    })
    it('should not display any error messages on initial load', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('.govuk-error-message').should('not.exist')
    })
  })

  describe('Form validation - empty fields', () => {
    it('should show validation errors when submitting with all empty fields', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.get('.govuk-error-summary__title').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary__list').within(() => {
        cy.contains('From date must be DD/MM/YYYY').should('exist')
        cy.contains('To date must be DD/MM/YYYY').should('exist')
        cy.contains('You must enter a to hour').should('exist')
        cy.contains('You must enter a to minute').should('exist')
      })

      cy.contains('From date must be DD/MM/YYYY').should('exist')
      cy.contains('To date must be DD/MM/YYYY').should('exist')
      cy.contains('You must enter a to hour').should('exist')
      cy.contains('You must enter a to minute').should('exist')
    })

    it('should show validation errors for missing end date fields only', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary').should('exist')
      cy.contains('To date must be DD/MM/YYYY').should('exist')
      cy.contains('You must enter a to hour').should('exist')
      cy.contains('You must enter a to minute').should('exist')

      cy.contains('From date must be DD/MM/YYYY').should('not.exist')
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
      cy.contains('You must enter a valid From date and time').should('exist')
    })
  })

  describe('Form validation - invalid time values', () => {
    it('should show error for hour value greater than 23', () => {
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
      cy.contains('From hour must be between 00 and 23').should('exist')
    })

    it('should show error for minute value greater than 59', () => {
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
      cy.contains('From minute must be between 00 and 59').should('exist')
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
      cy.contains('To date and time must be after the from date and time').should('exist')
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
      cy.contains('To date and time must be after the from date and time').should('exist')
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

    it.skip('should display "no location data" message when no results found', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      cy.task('stubGetLocationsEmpty', 'X123456')

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
      cy.contains('No location data found for the selected date range').should('exist')
    })
  })

  describe('Error summary links', () => {
    it('should focus correct field when clicking error summary link', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary a').contains('To date must be DD/MM/YYYY').click()

      cy.focused().should('have.attr', 'id', 'end-date')
    })

    it('should focus hour field when clicking hour error link', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      locationPage.fillSearchForm({
        startDate: '01/01/2026',
        startHour: '10',
        startMinute: '00',
        endDate: '02/01/2026',
      })

      locationPage.submitButton().click()

      cy.get('.govuk-error-summary a').contains('You must enter a to hour').click()

      cy.focused().should('have.attr', 'id', 'end-hour')
    })
  })

  describe('API error handling', () => {
    it.skip('should display error message when API call fails', () => {
      const locationPage = Page.verifyOnPage(LocationActivityPage)

      cy.intercept('GET', '**/people/X123456/locations', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('getLocationDataError')

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
      cy.contains('Unable to retrieve location data. Try again later').should('exist')
    })
  })
})
