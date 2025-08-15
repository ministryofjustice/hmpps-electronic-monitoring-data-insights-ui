import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export default class EmdiApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Emdi API', config.apis.emdiApi, logger, authenticationClient)
  }

  async getData(): Promise<string> {
    logger.info('Getting EMDI data')
    return this.get({ path: this.config.url }) as Promise<string>
  }

  getCurrentTime() {
    return this.get({ path: '//' }, asSystem())
  }
}
