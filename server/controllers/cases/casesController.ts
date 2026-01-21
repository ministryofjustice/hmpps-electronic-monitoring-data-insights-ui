import { Request, Response } from 'express'
import AuditService, { Page } from '../../services/auditService'
import mockPopDetails from '../mocks/popDetails'
import mockAdamCollins from './mocks/adamCollins'
import mockLeonelJames from './mocks/leonelJames'
import mockSamJamesWalker from './mocks/samJamesWalker'
import { getDateStringFromDateObject, getFormattedPerson, getNameFromPersonObject } from '../../utils/dummyDataUtils'
import TrailService, { Filters, Position } from '../../services/trailService'
import DateSearchValidationService from '../../services/dateSearchValidtionService'
import { searchLocationsQuerySchema } from '../../schemas/locationActivity/searchDateFormSchema'
import { getDateComponents, parseDateTimeFromISOString } from '../../utils/date'
import { ValidationResult } from '../../models/ValidationResult'
import { convertZodErrorToValidationError } from '../../utils/errors'

interface LocationDateFilterFormData {
  date: string
  hour: string
  minute: string
}
interface FilterStateProps {
  errors: ValidationResult
  formData: LocationBuildProps
}

interface LocationBuildProps {
  fromDate: LocationDateFilterFormData
  toDate: LocationDateFilterFormData
}
export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly trailService: TrailService,
    private readonly dateSearchValidationService: DateSearchValidationService,
  ) {}

  private conssumeDateFilterState(req: Request): FilterStateProps {
    const validationErrors = req.session?.validationErrors || []
    const formData = req.session?.formData as LocationBuildProps | undefined

    delete req.session?.validationErrors
    delete req.session?.formData

    return {
      errors: validationErrors,
      formData,
    }
  }

  private normalizeDateFilterFormData(dateFilter: LocationDateFilterFormData): LocationDateFilterFormData {
    const date = new Date(dateFilter.date)
    const normalizedDate = date.toISOString().split('T')[0]

    const hour = dateFilter.hour.padStart(2, '0')
    const minute = dateFilter.minute.padStart(2, '0')

    return {
      date: normalizedDate,
      hour,
      minute,
    }
  }

  private buildDateFilterFormValues(
    sessionFormData: LocationBuildProps | undefined,
    queryRange: { fromDate: string; toDate: string },
  ): LocationBuildProps {
    const defaultValues = {
      date: '',
      hour: '',
      minute: '',
    }

    if (sessionFormData?.fromDate && sessionFormData?.toDate) {
      return {
        fromDate: this.normalizeDateFilterFormData(sessionFormData?.fromDate),
        toDate: this.normalizeDateFilterFormData(sessionFormData.toDate),
      }
    }

    const fromDateRabge = queryRange.fromDate ? parseDateTimeFromISOString(queryRange.fromDate) : null
    const toDateRange = queryRange.toDate ? parseDateTimeFromISOString(queryRange.toDate) : null
    return {
      fromDate: fromDateRabge?.isValid() ? getDateComponents(fromDateRabge) : defaultValues,
      toDate: toDateRange?.isValid() ? getDateComponents(toDateRange) : defaultValues,
    }
  }

  private persistFormState(req: Request, errors: ValidationResult, formData: LocationBuildProps): void {
    req.session!.validationErrors = errors
    req.session!.formData = formData
  }

  async overview(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_OVERVIEW_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    const id = req.params.person_id
    const { highlight } = req.params

    let person
    switch (id) {
      case '1':
        person = mockAdamCollins
        break
      case '2':
        person = mockLeonelJames
        break
      case '3':
        person = mockSamJamesWalker
        break

      default:
        person = mockAdamCollins
        break
    }

    const fullName = getNameFromPersonObject(person)
    person = getFormattedPerson(person)

    const popDetails = {
      crn: person.delius_id,
      dateOfBirth: getDateStringFromDateObject(person.date_of_birth),
      tier: 'B3',
    }

    res.render('pages/casesOverview', {
      activeNav: 'cases',
      activeTab: 'overview',
      popData: popDetails,
      alert: true,
      fullName,
      person,
      id,
      highlight,
    })
  }

  async curfew(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_CURFEW_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })
    res.render('pages/casesCurfew', {
      activeNav: 'cases',
      activeTab: 'curfew',
      popData: mockPopDetails,
      alert: true,
      id: req.params.id,
    })
  }

  async location(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_LOCATION_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    const personId = req.params.person_id
    const { errors: sessionErrors, formData: sessionFormData } = this.conssumeDateFilterState(req)
    const queryResult = searchLocationsQuerySchema.safeParse(req.query)
    const queryRange = queryResult.success ? queryResult.data : { fromDate: '', toDate: '' }

    let positions: Position[] = []
    let validationErrors = sessionErrors
    let hasSearched = false

    if (queryResult.success) {
      hasSearched = true
      const fromDate = parseDateTimeFromISOString(queryResult.data.fromDate)
      const toDate = parseDateTimeFromISOString(queryResult.data.toDate)

      const validation = this.dateSearchValidationService.validateDateSearchRequest(fromDate, toDate)

      if (validation.success) {
        const trailJson = await this.trailService.getTrailJson()

        const filters: Filters = { from: queryResult.data.fromDate, to: queryResult.data.toDate }
        positions = this.trailService.filterByDate(trailJson, filters)
      } else {
        validationErrors = validation.errors || []
      }
    }

    // console.log({ query: req.query }, 'xxx location >>> query data to be sent to view')
    // console.log({ count: positions.length }, 'xxx Map data to be sent to view')

    const formValues = this.buildDateFilterFormValues(sessionFormData, queryRange)
    const locationAlert =
      hasSearched && positions.length === 0 ? { text: 'No location data found for the selected date range.' } : null

    res.render('pages/casesLocation', {
      activeNav: 'Location activity',
      activeTab: 'location-activity',
      popData: mockPopDetails,
      positions,
      alert: true,
      id: personId,
      dateFilterForm: {
        action: `/cases/${personId}/location-activity`,
        values: formValues,
        errors: validationErrors,
        errorSummary: validationErrors.map(err => ({ text: err.message })),
      },
      hasSearched,
      fromDate: queryRange.fromDate,
      toDate: queryRange.toDate,
      locationAlert,
    })
  }

  async searchLocation(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_LOCATION_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    const personId = req.params.person_id
    const { fromDate, toDate } = req.body
    const formPayload = { fromDate, toDate }

    const parsedform = searchLocationsQuerySchema.safeParse(formPayload)

    // console.log('xxx searchLocation >>> query data to be sent to view:', req.query)

    if (!parsedform.success) {
      const errors = convertZodErrorToValidationError(parsedform.error)
      this.persistFormState(req, errors, formPayload)
      return res.redirect(`/cases/${personId}/location-activity`)
    }

    const fromDateTime = parseDateTimeFromISOString(parsedform.data.fromDate)
    const toDateTime = parseDateTimeFromISOString(parsedform.data.toDate)
    const validation = this.dateSearchValidationService.validateDateSearchRequest(fromDateTime, toDateTime)

    if (!validation.success) {
      this.persistFormState(req, validation.errors || [], formPayload)
      return res.redirect(`/cases/${personId}/location-activity`)
    }

    const query = new URLSearchParams({
      fromDate: parsedform.data.fromDate,
      toDate: parsedform.data.toDate,
    })

    return res.redirect(`/cases/${personId}/location-activity?${query.toString()}`)
  }

  async notes(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.CASES_NOTES_PAGE, { who: res.locals.user.username, correlationId: req.id })
    res.render('pages/casesNotes', {
      activeNav: 'cases',
      activeTab: 'notes',
      id: req.params.id,
    })
  }
}
