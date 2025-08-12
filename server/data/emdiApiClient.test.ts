import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import EmdiApiClient from './emdiApiClient'
import config from '../config'

describe('EmdiApiClient', () => {
  let emdiApiClient: EmdiApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>

    emdiApiClient = new EmdiApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getCurrentTime', () => {
    it('should make a GET request to /example/time using system token and return the response body', async () => {
      nock(config.apis.emdiApi.url)
        .get('/example/time')
        .matchHeader('authorization', 'Bearer test-system-token')
        .reply(200, { time: '2025-01-01T12:00:00Z' })

      const response = await emdiApiClient.getCurrentTime()

      expect(response).toEqual({ time: '2025-01-01T12:00:00Z' })
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
