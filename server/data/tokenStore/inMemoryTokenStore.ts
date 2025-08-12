import TokenStore from './tokenStore'

export default class InMemoryTokenStore implements TokenStore {
  map = new Map<string, { token: string; expiry: Date }>()

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    this.map.set(key, { token, expiry: new Date(Date.now() + durationSeconds * 1000) })
    return Promise.resolve()
  }

  public async getToken(key: string): Promise<string | null> {
    const token = this.map.get(key)

    if (token) {
      if (token.expiry.getTime() > Date.now()) {
        return Promise.resolve(token.token)
      }
    }
    return Promise.resolve(null)
  }
}
