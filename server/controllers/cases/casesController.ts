import { Request, Response } from 'express'
import { map } from 'zod/v4'
import AuditService, { Page } from '../../services/auditService'
import mockPopDetails from '../mocks/popDetails'
import mockAdamCollins from './mocks/adamCollins'
import mockLeonelJames from './mocks/leonelJames'
import mockSamJamesWalker from './mocks/samJamesWalker'
import { getDateStringFromDateObject, getFormattedPerson, getNameFromPersonObject } from '../../utils/dummyDataUtils'
import TrailService, { Filters } from '../../services/trailService'
import DateSearchValidationService from '../../services/dateSearchValidtionService'
import { searchLocationsQuerySchema } from '../../schemas/locationActivity/searchDateFormSchema'
import { parseDateTimeFromISOString } from '../../utils/date'
import e from 'connect-flash'
import { convertZodErrorToValidationError } from '../../utils/errors'
import { start } from 'repl'

// const mapData = [
//   {
//     latitude: 53.4808,
//     longitude: -2.2426,
//     precision: 50,
//     sequenceNumber: 1,
//     speed: 5,
//     direction: 1.57,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T12:00:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '5 km/h',
//     displayDirection: '90°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 12:00:00',
//     displayConfidence: '50m',
//     displayLatitude: '53.4808',
//     displayLongitude: '-2.2426',
//   },
//   {
//     latitude: 53.478,
//     longitude: -2.25,
//     precision: 400,
//     sequenceNumber: 2,
//     speed: 15,
//     direction: 2.75,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T12:10:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '15 km/h',
//     displayDirection: '158°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 12:10:00',
//     displayConfidence: '400m',
//     displayLatitude: '53.478',
//     displayLongitude: '-2.25',
//   },
//   {
//     latitude: 53.483,
//     longitude: -2.236,
//     precision: 200,
//     sequenceNumber: 3,
//     speed: 9,
//     direction: 0.52,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T12:20:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '9 km/h',
//     displayDirection: '30°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 12:20:00',
//     displayConfidence: '200m',
//     displayLatitude: '53.483',
//     displayLongitude: '-2.236',
//   },
//   {
//     latitude: 53.476,
//     longitude: -2.229,
//     precision: 500,
//     sequenceNumber: 4,
//     speed: 2,
//     direction: 3.14,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T12:30:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '2 km/h',
//     displayDirection: '180°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 12:30:00',
//     displayConfidence: '500m',
//     displayLatitude: '53.476',
//     displayLongitude: '-2.229',
//   },
//   {
//     latitude: 53.485,
//     longitude: -2.26,
//     precision: 300,
//     sequenceNumber: 5,
//     speed: 4,
//     direction: 4.71,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T12:40:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '4 km/h',
//     displayDirection: '270°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 12:40:00',
//     displayConfidence: '300m',
//     displayLatitude: '53.485',
//     displayLongitude: '-2.26',
//   },
//   {
//     latitude: 53.472,
//     longitude: -2.245,
//     precision: 100,
//     sequenceNumber: 6,
//     speed: 7,
//     direction: 5.23,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T12:50:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '7 km/h',
//     displayDirection: '300°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 12:50:00',
//     displayConfidence: '100m',
//     displayLatitude: '53.472',
//     displayLongitude: '-2.245',
//   },
//   {
//     latitude: 53.49,
//     longitude: -2.255,
//     precision: 100,
//     sequenceNumber: 7,
//     speed: 3,
//     direction: 6.28,
//     geolocationMechanism: 'GPS',
//     timestamp: '2025-01-01T13:00:00Z',
//     overlayTitleTemplateId: 'overlay-title-test-location',
//     overlayBodyTemplateId: 'overlay-body-test-location',
//     personName: 'Jane Doe',
//     personNomisId: 'A1234BC',
//     displaySpeed: '3 km/h',
//     displayDirection: '360°',
//     displayGeolocationMechanism: 'GPS',
//     displayTimestamp: '2025-01-01 13:00:00',
//     displayConfidence: '100m',
//     displayLatitude: '53.49',
//     displayLongitude: '-2.255',
//   },
// ]

export default class CasesController {
  constructor(
    private readonly auditService: AuditService,
    private readonly trailService: TrailService,
    private readonly dateSearchValidationService: DateSearchValidationService,
  ) {}

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

   const formData = searchLocationsQuerySchema.safeParse(req.query)
   let mapDBData = [] as any[]

    console.log('Form data parse result:', formData)

    if (formData.success) {
      const fromDate = parseDateTimeFromISOString(formData.data.fromDate)
      const toDate = parseDateTimeFromISOString(formData.data.toDate)
      
     const validation = this.dateSearchValidationService.validateDateSearchRequest(fromDate, toDate)
     console.log('>>>> Validation result in controller:', validation);
      const trailJson = await this.trailService.getTrailJson()
      const filters: Filters = { from: formData.data.fromDate, to: formData.data.toDate }
      mapDBData = this.trailService.filterByDate(trailJson, filters).data
    } 
     console.log('query data to be sent to view:', req.query)
    console.log('Map data to be sent to view:', mapDBData.length)
    // console.log('Received query parameters:', req.query)
    //console.log('Received query start :', start, ' end:', end)
    // const mapDBData = [] as any[]
    res.render('pages/casesLocation', {
      activeNav: 'Location activity',
      activeTab: 'location-activity',
      popData: mockPopDetails,
      positions: mapDBData,
      start: req?.query?.start || '',
      end: req?.query?.end || '',
      alert: true,
      id: req.params.id,
    })
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
