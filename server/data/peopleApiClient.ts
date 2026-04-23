import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

export type ApiPerson = {
  personId: string | null
  consumerId: string | null
  personName: string | null
  nomisId: string | null
  pncId: string | null
  deliusId: string | null
  horId: string | null
  ceprId: string | null
  prisonId: string | null
  dob: string | null
  zip: string | null
  city: string | null
  street: string | null
}

export type ApiPeopleResponse = {
  persons: ApiPerson[]
  nextToken: string | null
}

export default class PeopleApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('People API', config.apis.emdiApi, logger, authenticationClient)
  }

  async searchPeople(token: string, deliusId: string): Promise<ApiPeopleResponse> {
    return this.get<ApiPeopleResponse>(
      {
        path: '/people',
        query: { deliusId },
      },
      asUser(token),
    )
  }

  async getPerson(token: string, personId: string): Promise<ApiPerson> {
    return this.get<ApiPerson>(
      {
        path: `/people/${personId}`,
      },
      asUser(token),
    )
  }
}
