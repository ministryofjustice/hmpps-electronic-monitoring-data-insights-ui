import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'

export default class EmdiService {
  constructor(private readonly emdiApiClient: RestClient) {}

  async getCurrentTime(): Promise<string> {
    const time = await this.emdiApiClient.get<string>({ path: '/example/time' }, asSystem())
    return time
  }

  async getData(username: string): Promise<string> {
    const response = await this.emdiApiClient.get(
      {
        path: `/hello`,
        query: {
          include_device_activations: true,
        },
      },
      asSystem(username),
    )

    return response.toString()
  }
}
