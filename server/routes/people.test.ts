import type { Services } from '../services'
import peopleRoutes from './people'

describe('peopleRoutes', () => {
  it('registers GET /people/:delius_id', () => {
    const get = jest.fn()
    const services = {
      auditService: {},
      caseLocationActivityService: {},
      dateSearchValidationService: {},
      peopleService: {},
    } as Services

    peopleRoutes(services, get)

    expect(get).toHaveBeenCalledWith('/people/:delius_id', expect.any(Function))
  })

  it('registers GET /people/:delius_id/locations', () => {
    const get = jest.fn()
    const services = {
      auditService: {},
      caseLocationActivityService: {},
      dateSearchValidationService: {},
      peopleService: {},
    } as Services

    peopleRoutes(services, get)

    expect(get).toHaveBeenCalledWith('/people/:delius_id/locations', expect.any(Function))
  })
})
