import { FliptClient } from '@flipt-io/flipt-client-js/node'
import FlagService from './flagService'

jest.mock('@flipt-io/flipt-client-js/node', () => ({
  FliptClient: {
    init: jest.fn(),
  },
}))

const evaluateBoolean = jest.fn()
const close = jest.fn()

describe('FlagService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(FliptClient.init as jest.Mock).mockResolvedValue({ evaluateBoolean, close })
  })

  it('returns feature flags based on Flipt boolean evaluation results', async () => {
    evaluateBoolean.mockImplementation(({ flagKey }: { flagKey: string }) => ({
      flagKey,
      enabled: flagKey === 'enable-heatmap' || flagKey === 'enable-ping-cards-update',
    }))

    const flags = await new FlagService().getFlags({ username: 'USER1' })

    expect(FliptClient.init).toHaveBeenCalledWith({
      namespace: 'hmpps-electronic-monitoring-data-insights',
      url: 'http://localhost:8100',
      updateInterval: 120,
    })

    expect(evaluateBoolean).toHaveBeenNthCalledWith(1, {
      flagKey: 'enable-ping-card-navigation',
      entityId: 'user1',
      context: {
        username: 'user1',
      },
    })
    expect(flags.enablePingCardNavigation).toEqual(false)
    expect(flags.enableExclusionZones).toEqual(false)
    expect(flags.enablePingCardsUpdate).toEqual(true)
    expect(flags.enableHeatmap).toEqual(true)
  })

  it('initializes one client and evaluates flags with each request user context', async () => {
    const service = new FlagService()

    await service.getFlags({ username: 'USER1' })
    await service.getFlags({ username: 'USER2' })

    expect(FliptClient.init).toHaveBeenCalledTimes(1)
    expect(evaluateBoolean).toHaveBeenLastCalledWith({
      flagKey: 'enable-ping-cards-update',
      entityId: 'user2',
      context: { username: 'user2' },
    })
  })

  it('retries client initialization after a failure and closes the initialized client', async () => {
    ;(FliptClient.init as jest.Mock)
      .mockRejectedValueOnce(new Error('Flipt unavailable'))
      .mockResolvedValueOnce({ evaluateBoolean, close })
    const service = new FlagService()

    await expect(service.getFlags({ username: 'USER1' })).rejects.toThrow('Flipt unavailable')
    await service.getFlags({ username: 'USER1' })

    expect(FliptClient.init).toHaveBeenCalledTimes(2)
    service.close()
    expect(close).toHaveBeenCalledTimes(1)
  })

  it.each([true, false])('sets the ping cards update flag to %s from Flipt', async enabled => {
    evaluateBoolean.mockImplementation(({ flagKey }: { flagKey: string }) => ({
      flagKey,
      enabled: flagKey === 'enable-ping-cards-update' && enabled,
    }))

    const flags = await new FlagService().getFlags({ username: 'USER1' })

    expect(evaluateBoolean).toHaveBeenCalledWith({
      flagKey: 'enable-ping-cards-update',
      entityId: 'user1',
      context: { username: 'user1' },
    })
    expect(flags.enablePingCardsUpdate).toBe(enabled)
  })

  it.each([
    { scenario: 'missing', result: undefined },
    { scenario: 'mismatched', result: { flagKey: 'unexpected-flag', enabled: true } },
  ])('defaults the ping cards update flag to false for a $scenario evaluation', async ({ result }) => {
    evaluateBoolean.mockImplementation(({ flagKey }: { flagKey: string }) =>
      flagKey === 'enable-ping-cards-update' ? result : { flagKey, enabled: false },
    )

    const flags = await new FlagService().getFlags({})

    expect(flags.enablePingCardsUpdate).toBe(false)
  })

  it('defaults a flag to false when Flipt does not return the requested flag key', async () => {
    evaluateBoolean.mockReturnValueOnce({ flagKey: 'unexpected-flag', enabled: true })

    const flags = await new FlagService().getFlags({})

    expect(evaluateBoolean).toHaveBeenCalledWith({
      flagKey: 'enable-ping-card-navigation',
      entityId: 'anonymous',
      context: {},
    })
    expect(flags.enablePingCardNavigation).toEqual(false)
  })
})
