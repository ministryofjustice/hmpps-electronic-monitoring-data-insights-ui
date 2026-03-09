import rateLimit from 'express-rate-limit'
import { Router } from 'express'
import { Config } from '../config'

/**
 * Sets up rate limiting for the given Express app.
 *
 * @param {object} app - The Express app instance.
 * @param {object} config - The configuration object containing rate limiting settings.
 *
 */

export default function rateLimitSetUp(app: Router, config: Config) {
  /**
   * Rate limiter for general routes.
   */
  const generalLimiter = rateLimit({
    windowMs: config.rateWindowMS,
    max: config.rateLimitMax,
    message: 'Too many requests, please try again later.',
    skip: req => {
      const userAgent = req.get('User-Agent') || ''
      const isCypressRequest = userAgent.includes('Cypress')

      return process.env.NODE_ENV === 'test' || (!config.production && isCypressRequest)
    },
  })

  // Apply the general rate limiter to all requests
  app.use(generalLimiter)
}
