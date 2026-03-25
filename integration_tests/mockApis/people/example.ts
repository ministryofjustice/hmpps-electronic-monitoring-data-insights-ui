import { stubFor } from '../wiremock'

const baseUrl = '/crime-matching'

type StubGetPerson200Options = {
  status: 200
  personId: number
  response: {
    data: {
      personId: number
      name: string
      nomisId: string
      pncRef: string
      address: string
      dateOfBirth: string
      probationPractitioner: string
      deviceActivations: []
    }
  }
}

type StubGetPerson404Options = {
  status: 404 | 500
  personId: number
  response: string
}

type StubGetPersonOptions = StubGetPerson200Options | StubGetPerson404Options

const defaultGetPersonOptions: StubGetPersonOptions = {
  status: 200,
  personId: 1,
  response: {
    data: {
      personId: 1,
      name: 'Jane Doe',
      nomisId: 'Nomis 1"',
      pncRef: 'YY/NNNNNNND',
      address: '123 Street',
      dateOfBirth: '2000-12-01T00:00:00.000Z',
      probationPractitioner: 'John Smith',
      deviceActivations: [],
    },
  },
}

const stubGetPerson = (options: StubGetPersonOptions = defaultGetPersonOptions) => {
  const urlPattern = `${baseUrl}/persons/${options.personId}`

  return stubFor({
    request: {
      method: 'GET',
      urlPattern,
    },
    response: {
      status: options.status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: options.response,
    },
  })
}

export { stubGetPerson, StubGetPersonOptions }
