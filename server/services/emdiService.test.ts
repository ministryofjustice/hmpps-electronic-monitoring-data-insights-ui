import EmdiApiClient from '../data/emdiApiClient'
import ExampleService from './emdiService'

jest.mock('../data/emdiApiClient')

describe('ExampleService', () => {
  const emdiApiClient = new EmdiApiClient(null) as jest.Mocked<EmdiApiClient>
  let exampleService: ExampleService

  beforeEach(() => {
    exampleService = new ExampleService(emdiApiClient)
  })

  it('should call getCurrentTime on the api client and return its result', async () => {
    const expectedTime = '2025-01-01T12:00:00Z'

    emdiApiClient.getCurrentTime.mockResolvedValue(expectedTime)

    const result = await exampleService.getCurrentTime()

    expect(emdiApiClient.getCurrentTime).toHaveBeenCalledTimes(1)
    expect(result).toEqual(expectedTime)
  })
})
