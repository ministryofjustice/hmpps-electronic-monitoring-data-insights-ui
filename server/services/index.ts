import { dataAccess } from '../data'
import AuditService from './auditService'
import EmdiService from './emdiService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, emdiApiClient } = dataAccess()

  const auditService = new AuditService(hmppsAuditClient)
  const emdiService = new EmdiService(emdiApiClient)

  return {
    applicationInfo,
    auditService,
    emdiService,
  }
}

export type Services = ReturnType<typeof services>
