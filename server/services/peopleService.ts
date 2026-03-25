import type PeopleApiClient from '../data/peopleApiClient'

export type Person = {
  id: string | null
  consumerId: string | null
  name: string | null
  nomisId: string | null
  pncId: string | null
  deliusId: string | null
  horId: string | null
  ceprId: string | null
  prisonId: string | null
  dateOfBirth: string | null
  address: {
    postcode: string | null
    city: string | null
    street: string | null
  }
}

export type PeopleSearchResult = {
  people: Person[]
  nextToken: string | null
}

export default class PeopleService {
  constructor(private readonly peopleApiClient: PeopleApiClient) {}

  async searchPeople(_token: string, _deliusId: string): Promise<PeopleSearchResult> {
    throw new Error('Not implemented')
  }

  async getPerson(_token: string, _personId: string): Promise<Person> {
    throw new Error('Not implemented')
  }
}
