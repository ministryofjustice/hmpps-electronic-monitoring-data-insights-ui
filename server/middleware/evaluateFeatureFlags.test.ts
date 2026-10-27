import { NextFunction, Request, Response } from 'express'
import evaluateFeatureFlags from './evaluateFeatureFlags'
import FlagService from '../services/flagService'
import FeatureFlags from '../models/FeatureFlags'

describe('evaluateFeatureFlags', () => {
  it.each([true, false])('adds the evaluated ping cards update value %s to response locals', async enabled => {
    const flags = new FeatureFlags()
    flags.enablePingCardNavigation = false
    flags.enablePingCardsUpdate = enabled

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
    expect(res.locals.enablePingCardNavigation).toEqual(false)
    expect(res.locals.enablePingCardsUpdate).toBe(enabled)
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
    res.locals.enablePingCardsUpdate = true
    const next = jest.fn() as NextFunction

    await evaluateFeatureFlags(flagService)(req, res, next)

    expect(res.locals.flags).toEqual(new FeatureFlags())
    expect(res.locals.enablePingCardNavigation).toEqual(false)
    expect(res.locals.enablePingCardsUpdate).toBe(false)
    expect(res.locals.flags.enablePingCardsUpdate).toBe(false)
    expect(next).toHaveBeenCalledWith()
  })
})
