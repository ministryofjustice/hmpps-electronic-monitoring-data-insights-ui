import type { SuperAgentRequest } from 'superagent'
import { stubFor } from '../wiremock'

type Person = {
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

export type StubPerson200Options = {
  status: 200
  personId: string
  response: Person
}

const defaultPerson: Person = {
  personId: '41591',
  consumerId: '9b74b1071beb2210743d8551f54bcbcc',
  personName: 'DEVWR0004718',
  nomisId: 'Q0788IA',
  pncId: 'MU50/038758B',
  deliusId: 'X31092',
  horId: 'C5011307',
  ceprId: null,
  prisonId: 'J05007',
  dob: '2020-01-01',
  zip: 'BL2 1EW',
  city: 'Bolton',
  street: '2 Dunlin Close',
}

const defaultStubPersonOptions: StubPerson200Options = {
  status: 200,
  personId: '1',
  response: defaultPerson,
}

const stubPersonEmpty = (options: StubPerson200Options = defaultStubPersonOptions): SuperAgentRequest =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/people/${options.personId}`,
    },
    response: {
      status: options.status,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: options.response,
    },
  })

export default stubPersonEmpty
