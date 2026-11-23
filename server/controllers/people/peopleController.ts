import { Request, Response } from 'express'
import type session from 'express-session'
import PeopleService from '../../services/peopleService'
import AuditService, { Page } from '../../services/auditService'
import CaseLocationActivityService, {
  type CaseLocationBasePosition,
  type CaseLocationPosition,
} from '../../services/caseLocationActivityService'
import DateSearchValidationService from '../../services/dateSearchValidationService'
import { searchLocationsQuerySchema } from '../../schemas/locationActivity/searchDateFormSchema'
import {
  calculateAge,
  formatSyncDate,
  formatSyncTime,
  getDateComponents,
  parseDateTimeFromISOString,
} from '../../utils/date'
import locationLocale from '../../locales/location.locale.json'
import { defaultLocationMapControls, heatmapLevelKeys, LocationMapControls } from '../../types/locationMapControls'
import PeopleExclusionService from '../../services/peopleExclusionService'
import type { ExclusionZonesResult } from '../../services/peopleExclusionService'
import LocationDataSyncService from '../../services/locationDataSyncService'
import { ApiLocationDataSyncResponse } from '../../data/locationDataSyncApiClient'
import logger from '../../../logger'

type SelectedPersonContext = session.SessionData['peopleSelection'][string]

interface LocationDateFilterFormData {
  date: string
  hour: string
  minute: string
  second?: string
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
    second?: string
  }
  end?: {
    date?: string
    hour?: string
    minute?: string
    second?: string
  }
  mapControls?: Partial<Record<keyof LocationMapControls, unknown>>
}

interface ValidationError {
  field: string
  message: string
  href?: string
  highlightOnly?: boolean
}

export default class PeopleController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly auditService: AuditService,
    private readonly caseLocationActivityService: CaseLocationActivityService,
    private readonly dateSearchValidationService: DateSearchValidationService,
    private readonly peopleExclusionService: PeopleExclusionService,
    private readonly locationDataSyncService: LocationDataSyncService,
  ) {}

  private buildDateFilterFormValues(
    queryRange: { fromDate: string; toDate: string },
    submittedFormData?: LocationBuildProps,
  ): LocationBuildProps {
    const defaultValues = {
      date: '',
      hour: '',
      minute: '',
    }

    const fromDateRange = queryRange.fromDate ? parseDateTimeFromISOString(queryRange.fromDate) : null
    const toDateRange = queryRange.toDate ? parseDateTimeFromISOString(queryRange.toDate) : null
    const formValues = {
      fromDate: fromDateRange?.isValid() ? getDateComponents(fromDateRange) : defaultValues,
      toDate: toDateRange?.isValid() ? getDateComponents(toDateRange) : defaultValues,
    }

    if (submittedFormData?.fromDate && submittedFormData?.toDate) {
      return {
        fromDate: {
          ...formValues.fromDate,
          date: submittedFormData.fromDate.date,
        },
        toDate: {
          ...formValues.toDate,
          date: submittedFormData.toDate.date,
        },
      }
    }

    return formValues
  }

  private parseBooleanMapControlValue(value: unknown): boolean | undefined {
    if (value === 'true') return true
    if (value === 'false') return false
    return undefined
  }

  private buildSubmittedDateFilterFormValues(query: QueryParams): LocationBuildProps | undefined {
    if (!query.start || !query.end) return undefined

    return {
      fromDate: {
        date: query.start.date ?? '',
        hour: query.start.hour ?? '',
        minute: query.start.minute ?? '',
        ...(query.start.second ? { second: query.start.second } : {}),
      },
      toDate: {
        date: query.end.date ?? '',
        hour: query.end.hour ?? '',
        minute: query.end.minute ?? '',
        ...(query.end.second ? { second: query.end.second } : {}),
      },
    }
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
      heatmapLevels: {
        ...defaultLocationMapControls.heatmapLevels,
        ...sessionControls.heatmapLevels,
      },
    }

    ;(['tracks', 'confidence', 'numbers', 'heatmap', 'exclusion'] as const).forEach(key => {
      const value = this.parseBooleanMapControlValue(queryControls[key])
      if (value !== undefined) {
        controls[key] = value
      }
    })

    heatmapLevelKeys.forEach(level => {
      const value = this.parseBooleanMapControlValue(
        (queryControls.heatmapLevels as Partial<Record<typeof level, unknown>> | undefined)?.[level],
      )
      if (value !== undefined) {
        controls.heatmapLevels[level] = value
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

    let positions: CaseLocationBasePosition[] = []
    let positionCardData: CaseLocationPosition[] = []
    let exclusionResult: ExclusionZonesResult | null = null
    let validationErrors: ValidationError[] = []
    let hasSearched = false
    let locationAlert: { text: string } | null = null
    let queryRange = { fromDate: '', toDate: '' }
    let formValues: LocationBuildProps
    let locationDataSyncResponse: ApiLocationDataSyncResponse | null = null
    let isDataSyncError = false
    const mapControls = this.buildLocationMapControls(req)
    const hasQueryParams = req.query.start !== undefined || req.query.end !== undefined

    try {
      locationDataSyncResponse = await this.locationDataSyncService.getLocationDataSyncStatus(res.locals.user.username)
    } catch (error) {
      isDataSyncError = true
      logger.error(
        { correlationId: req.id, errorType: error instanceof Error ? error.name : typeof error },
        'Error fetching data freshness',
      )
    }

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
          const { params } = issue as { params?: { highlightOnly?: boolean } }
          return {
            field,
            message: issue.message,
            href,
            highlightOnly: params?.highlightOnly === true,
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
              const crn = deliusId
              positions = await this.caseLocationActivityService.getPositions(
                res.locals.user.username,
                personContext.personId,
                queryResult.data.fromDate,
                queryResult.data.toDate,
                { crn },
              )
              positionCardData = this.caseLocationActivityService.annotatePositionsWithDisplayProperties(positions)
            } catch (error) {
              logger.error(
                { correlationId: req.id, errorType: error instanceof Error ? error.name : typeof error },
                'Error fetching locations',
              )
              locationAlert = { text: locationLocale.alerts.fetchError }
            }

            if (res.locals.enableExclusionZones) {
              try {
                exclusionResult = await this.peopleExclusionService.getExclusionZone(
                  res.locals.user.username,
                  personContext.personId,
                  deliusId,
                )
              } catch (error) {
                logger.error(
                  { correlationId: req.id, errorType: error instanceof Error ? error.name : typeof error },
                  'Error fetching exclusion zones',
                )
              }
            }
          } else {
            locationAlert = { text: locationLocale.alerts.fetchError }
          }
        } else {
          validationErrors = validation.errors || []
        }

        formValues = this.buildDateFilterFormValues(
          queryRange,
          this.buildSubmittedDateFilterFormValues(req.query as QueryParams),
        )
      }
    } else {
      formValues = this.buildDateFilterFormValues(queryRange)
    }

    if (!locationAlert && hasSearched && validationErrors.length === 0 && positions.length === 0) {
      locationAlert = { text: locationLocale.alerts.noResults }
    }

    const isMapLoading = hasSearched && positions.length > 0 && !(locationAlert && locationAlert.text)
    const latestPosition = locationDataSyncResponse?.statuses?.[0]?.latestPosition ?? null

    res.render('pages/personLocation', {
      activeNav: 'cases',
      activeTab: 'locations',
      locale: locationLocale,
      fullName: personContext.fullName,
      popData: {
        crn: deliusId,
        dateOfBirth: personContext.dateOfBirth,
        age: calculateAge(personContext.dateOfBirth),
      },
      showComplianceBadge: false,
      personContext,
      positions: positionCardData,
      dateFilterForm: {
        action: `/people/${deliusId}/locations`,
        values: formValues,
        errors: validationErrors,
        errorSummary: validationErrors
          .filter(err => !err.highlightOnly)
          .map(err => ({ text: err.message, href: err?.href })),
        showCrn: false,
      },
      hasSearched,
      isMapLoading,
      fromDate: queryRange.fromDate,
      toDate: queryRange.toDate,
      locationAlert,
      mapControls,
      currentUrl: encodeURIComponent(String(req.originalUrl)),
      exclusionZones: exclusionResult?.exclusionZones ?? null,
      dataFreshness: locationDataSyncResponse,
      dataFreshnessLatestDate: latestPosition ? formatSyncDate(latestPosition) : null,
      dataFreshnessLatestTime: latestPosition ? formatSyncTime(latestPosition) : null,
      isDataFreshnessError: isDataSyncError,
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
