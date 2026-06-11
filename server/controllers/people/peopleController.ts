import { Request, Response } from 'express'
import type session from 'express-session'
import PeopleService from '../../services/peopleService'
import AuditService, { Page } from '../../services/auditService'
import CaseLocationActivityService, {
  type CaseLocationBasePosition,
  type CaseLocationPosition,
} from '../../services/caseLocationActivityService'
import DateSearchValidationService from '../../services/dateSearchValidationService'
import { ValidationResult } from '../../models/ValidationResult'
import { searchLocationsQuerySchema } from '../../schemas/locationActivity/searchDateFormSchema'
import { getDateComponents, parseDateTimeFromISOString } from '../../utils/date'
import casesLocationLocale from '../cases/cases-location.locale.json'
import { defaultLocationMapControls, LocationMapControls } from '../../types/locationMapControls'

type SelectedPersonContext = session.SessionData['peopleSelection'][string]

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

interface QueryParams {
  start?: {
    date?: string
    hour?: string
    minute?: string
  }
  end?: {
    date?: string
    hour?: string
    minute?: string
  }
  mapControls?: Partial<Record<keyof LocationMapControls, unknown>>
}

interface ValidationError {
  field: string
  message: string
  href?: string
}

export default class PeopleController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly auditService: AuditService,
    private readonly caseLocationActivityService: CaseLocationActivityService,
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

    const fromDateRange = queryRange.fromDate ? parseDateTimeFromISOString(queryRange.fromDate) : null
    const toDateRange = queryRange.toDate ? parseDateTimeFromISOString(queryRange.toDate) : null
    return {
      fromDate: fromDateRange?.isValid() ? getDateComponents(fromDateRange) : defaultValues,
      toDate: toDateRange?.isValid() ? getDateComponents(toDateRange) : defaultValues,
    }
  }

  private parseBooleanMapControlValue(value: unknown): boolean | undefined {
    if (value === 'true') return true
    if (value === 'false') return false
    return undefined
  }

  private buildLocationMapControls(req: Request): LocationMapControls {
    const sessionControls: Partial<LocationMapControls> = req.session?.locationMapControls || {}
    const queryControls = (req.query as QueryParams).mapControls || {}

    const baseLayer =
      queryControls.baseLayer === 'street' || queryControls.baseLayer === 'satellite'
        ? queryControls.baseLayer
        : sessionControls.baseLayer

    const controls: LocationMapControls = {
      ...defaultLocationMapControls,
      ...sessionControls,
      ...(baseLayer ? { baseLayer } : {}),
    }

    ;(['tracks', 'confidence', 'numbers'] as const).forEach(key => {
      const value = this.parseBooleanMapControlValue(queryControls[key])
      if (value !== undefined) {
        controls[key] = value
      }
    })

    if (req.session) {
      req.session.locationMapControls = controls
    }
    return controls
  }

  async getPersonByDeliusId(req: Request, res: Response): Promise<void> {
    const { delius_id: deliusId } = req.params
    const { username } = res.locals.user
    const result = await this.peopleService.searchPeople(username, deliusId)
    const person = result.people[0] ?? null

    if (person) {
      this.setSelectedPerson(req, deliusId, {
        personId: person.id ?? '',
        consumerId: person.consumerId ?? '',
        fullName: person.name ?? '',
        dateOfBirth: person.dateOfBirth ?? '',
      })
    }

    const redirectTo = this.getAllowedRedirectTo(req, deliusId)

    if (redirectTo && person) {
      res.redirect(redirectTo)
      return
    }

    res.render('pages/person', {
      activeNav: 'people',
      fullName: person?.name ?? 'Person not found',
      popData: person
        ? {
            crn: person.deliusId,
            dateOfBirth: person.dateOfBirth,
            tier: 'B3',
          }
        : null,
      showComplianceBadge: false,
      person,
    })
  }

  async location(req: Request, res: Response): Promise<void> {
    await this.auditService.logPageView(Page.PEOPLE_LOCATION_PAGE, {
      who: res.locals.user.username,
      correlationId: req.id,
    })

    const { delius_id: deliusId } = req.params
    const personContext = this.getSelectedPerson(req, deliusId)

    if (!personContext) {
      const redirectTo = encodeURIComponent(`/people/${deliusId}/locations`)
      res.redirect(`/people/${deliusId}?redirectTo=${redirectTo}`)
      return
    }

    const { errors: sessionErrors, formData: sessionFormData } = this.conssumeDateFilterState(req)
    let positions: CaseLocationBasePosition[] = []
    let positionCardData: CaseLocationPosition[] = []
    let validationErrors: ValidationError[] = sessionErrors
    let hasSearched = false
    let locationAlert: { text: string } | null = null
    let queryRange = { fromDate: '', toDate: '' }
    let formValues: LocationBuildProps
    const mapControls = this.buildLocationMapControls(req)
    const hasQueryParams = req.query.start !== undefined || req.query.end !== undefined

    if (hasQueryParams) {
      hasSearched = true
      const queryResult = searchLocationsQuerySchema.safeParse(req.query)

      if (!queryResult.success) {
        const rawQuery = req.query as QueryParams

        formValues = {
          fromDate: {
            date: rawQuery?.start?.date ?? '',
            hour: rawQuery?.start?.hour ?? '',
            minute: rawQuery?.start?.minute ?? '',
          },
          toDate: {
            date: rawQuery?.end?.date ?? '',
            hour: rawQuery?.end?.hour ?? '',
            minute: rawQuery?.end?.minute ?? '',
          },
        }
        validationErrors = queryResult.error.issues.map(issue => {
          const field = issue.path.join('.')
          const href = `#${issue.path.join('-')}`
          return {
            field,
            message: issue.message,
            href,
          }
        })
      } else {
        queryRange = queryResult.data

        const fromDate = parseDateTimeFromISOString(queryResult.data.fromDate)
        const toDate = parseDateTimeFromISOString(queryResult.data.toDate)
        const validation = this.dateSearchValidationService.validateDateSearchRequest(fromDate, toDate)

        if (validation.success) {
          if (personContext.personId) {
            try {
              positions = await this.caseLocationActivityService.getPositions(
                res.locals.user.username,
                personContext.personId,
                queryResult.data.fromDate,
                queryResult.data.toDate,
              )
              positionCardData = this.caseLocationActivityService.annotatePositionsWithDisplayProperties(positions)
            } catch (error) {
              /* eslint no-console: ["error", { allow: ["warn", "error"] }] */
              console.error('Error fetching locations:', error)
              locationAlert = { text: casesLocationLocale.alerts.fetchError }
            }
          } else {
            locationAlert = { text: casesLocationLocale.alerts.fetchError }
          }
        } else {
          validationErrors = validation.errors || []
        }

        formValues = this.buildDateFilterFormValues(sessionFormData, queryRange)
      }
    } else {
      formValues = this.buildDateFilterFormValues(sessionFormData, queryRange)
    }

    if (!locationAlert && hasSearched && validationErrors.length === 0 && positions.length === 0) {
      locationAlert = { text: casesLocationLocale.alerts.noResults }
    }

    res.render('pages/personLocation', {
      activeNav: 'people',
      activeTab: 'locations',
      locale: casesLocationLocale,
      fullName: personContext.fullName,
      popData: {
        crn: deliusId,
        dateOfBirth: personContext.dateOfBirth,
        tier: 'B3',
      },
      showComplianceBadge: false,
      personContext,
      positions: positionCardData,
      dateFilterForm: {
        action: `/people/${deliusId}/locations`,
        values: formValues,
        errors: validationErrors,
        errorSummary: validationErrors.map(err => ({ text: err.message, href: err?.href })),
        showCrn: false,
      },
      hasSearched,
      fromDate: queryRange.fromDate,
      toDate: queryRange.toDate,
      locationAlert,
      mapControls,
      currentUrl: encodeURIComponent(String(req.originalUrl)),
    })
  }

  private getSelectedPerson(req: Request, deliusId: string): SelectedPersonContext | null {
    return req.session.peopleSelection?.[deliusId] ?? null
  }

  private getAllowedRedirectTo(req: Request, deliusId: string): string | null {
    const redirectTo = typeof req.query.redirectTo === 'string' ? req.query.redirectTo : null
    const allowedRedirectTo = `/people/${deliusId}/locations`

    return redirectTo === allowedRedirectTo ? redirectTo : null
  }

  private setSelectedPerson(req: Request, deliusId: string, personContext: SelectedPersonContext): void {
    req.session.peopleSelection = {
      ...(req.session.peopleSelection || {}),
      [deliusId]: personContext,
    }
  }
}
