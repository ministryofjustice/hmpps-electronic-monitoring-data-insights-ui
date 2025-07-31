import EMDIApiClient from '../data/emdiApiClient'

export default class EMDIService {
  constructor(private readonly emdiApiClient: EMDIApiClient) {}

  getCurrentTime() {
    return this.emdiApiClient.getCurrentTime()
  }
}
