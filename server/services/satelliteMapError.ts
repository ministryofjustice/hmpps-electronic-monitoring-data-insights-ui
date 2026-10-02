export default class SatelliteMapError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'SatelliteMapError'
  }
}
