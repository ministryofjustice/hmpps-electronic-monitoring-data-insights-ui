import EmdiApiClient from '../data/emdiApiClient'

export default class EmdiService {
  constructor(private readonly emdiApiClient: EmdiApiClient) {}

  getCurrentTime() {
    return this.emdiApiClient.getCurrentTime()
  }
}
