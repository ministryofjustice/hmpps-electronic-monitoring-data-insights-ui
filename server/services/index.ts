import { dataAccess } from '../data'
import AuditService from './auditService'
import DateSearchValidationService from './dateSearchValidtionService'
import EmdiService from './emdiService'
import TrailService from './trailService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, emdiApiClient } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const emdiService = new EmdiService(emdiApiClient)
  const trailService = new TrailService()
  const dateSearchValidationService = new DateSearchValidationService()

  return {
    applicationInfo,
    auditService,
    emdiService,
    trailService,
    dateSearchValidationService,
  }
}

export type Services = ReturnType<typeof services>
