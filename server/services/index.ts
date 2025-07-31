import { dataAccess } from '../data'
import AuditService from './auditService'
import EMDIService from './emdiService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, emdiApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    emdiService: new EMDIService(emdiApiClient),
  }
}

export type Services = ReturnType<typeof services>
