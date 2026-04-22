import { dataAccess } from '../data'
import AuditService from './auditService'
import DateSearchValidationService from './dateSearchValidationService'
import EmdiService from './emdiService'
import PeopleService from './peopleService'
import TrailService from './trailService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, emdiApiClient, peopleApiClient } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const emdiService = new EmdiService(emdiApiClient)
  const peopleService = new PeopleService(peopleApiClient)
  const trailService = new TrailService()
  const dateSearchValidationService = new DateSearchValidationService()

  return {
    applicationInfo,
    auditService,
    emdiService,
    peopleService,
    trailService,
    dateSearchValidationService,
  }
}

export type Services = ReturnType<typeof services>
