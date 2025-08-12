import { dataAccess } from '../data'
import AuditService from './auditService'
// import EMDIService from './emdiService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  // const emdiService = new EMDIService(emdiApiClient)

  return {
    applicationInfo,
    auditService,
    // emdiService,
  }
}

export type Services = ReturnType<typeof services>
