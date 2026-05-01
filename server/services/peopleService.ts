import type PeopleApiClient from '../data/peopleApiClient'
import type { ApiPerson } from '../data/peopleApiClient'

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

  async searchPeople(username: string, deliusId: string): Promise<PeopleSearchResult> {
    const response = await this.peopleApiClient.searchPeople(username, deliusId)

    return {
      people: response.persons.map(person => this.mapPerson(person)),
      nextToken: response.nextToken,
    }
  }

  async getPerson(username: string, personId: string): Promise<Person> {
    const person = await this.peopleApiClient.getPerson(username, personId)
    return this.mapPerson(person)
  }

  private mapPerson(person: ApiPerson): Person {
    return {
      id: person.personId,
      consumerId: person.consumerId,
      name: person.personName,
      nomisId: person.nomisId,
      pncId: person.pncId,
      deliusId: person.deliusId,
      horId: person.horId,
      ceprId: person.ceprId,
      prisonId: person.prisonId,
      dateOfBirth: person.dob,
      address: {
        postcode: person.zip,
        city: person.city,
        street: person.street,
      },
    }
  }
}
