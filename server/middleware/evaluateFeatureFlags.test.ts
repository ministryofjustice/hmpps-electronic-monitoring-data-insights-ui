import { NextFunction, Request, Response } from 'express'
import evaluateFeatureFlags from './evaluateFeatureFlags'
import FlagService from '../services/flagService'
import FeatureFlags from '../models/FeatureFlags'

describe('evaluateFeatureFlags', () => {
  it('adds evaluated flags to response locals', async () => {
    const flags = new FeatureFlags()
    flags.enableHeatmap = true
    flags.enablePingCardNavigation = false

    const flagService = {
      getFlags: jest.fn().mockResolvedValue(flags),
    } as unknown as FlagService
    const req = {} as Request
    const res = {
      locals: {
        user: {
          username: 'USER1',
        },
      },
    } as Response
    const next = jest.fn() as NextFunction

    await evaluateFeatureFlags(flagService)(req, res, next)

    expect(flagService.getFlags).toHaveBeenCalledWith({ username: 'USER1' })
    expect(res.locals.flags).toEqual(flags)
    expect(res.locals.enableHeatmap).toEqual(true)
    expect(res.locals.enablePingCardNavigation).toEqual(false)
    expect(next).toHaveBeenCalledWith()
  })

  it('defaults flags to false when Flipt fails', async () => {
    const error = new Error('Flipt failed')
    const flagService = {
      getFlags: jest.fn().mockRejectedValue(error),
    } as unknown as FlagService
    const req = {} as Request
    const res = {
      locals: {
        user: {
          username: 'USER1',
        },
      },
    } as Response
    const next = jest.fn() as NextFunction

    await evaluateFeatureFlags(flagService)(req, res, next)

    expect(res.locals.flags).toEqual(new FeatureFlags())
    expect(res.locals.enableHeatmap).toEqual(false)
    expect(res.locals.enablePingCardNavigation).toEqual(false)
    expect(next).toHaveBeenCalledWith()
  })
})
