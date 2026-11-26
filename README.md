# HMPPS Electronic Monitoring Data Insights UI

[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/hmpps-electronic-monitoring-data-insights-ui)

An authenticated TypeScript and Express service for probation practitioners to review electronic-monitoring GPS location data. It is normally opened from Manage People on Probation (MPOP); the person reference in the URL is a variable CRN, not a fixed identifier.

## Supported user journeys

- `/people/:crn?redirectTo=/people/:crn/locations` looks up a person and redirects to their location history.
- `/people/:crn/locations` displays GPS locations, date searches, map controls, and applicable restriction and data-freshness information.
- `/map-help` explains the location map.
- `/whats-new?returnUrl=...` displays release information and returns to the requested page.
- `/authError` displays the authentication error page.

Authentication, health checks, static assets, and map support routes are also required by these journeys. `/` remains a minimal sign-in and return-link fallback. The retired `/cases/*` pages and the application's local `/search` route intentionally return the authenticated not-found page; the external MPOP navigation remains.

## Develop locally

Use the Node.js version in `.nvmrc` (currently 22.23.5). The package supports Node 22 or 24 and npm 10 or 11.

```bash
npm run setup
npm run start:dev
```

The development server listens on port 3000 by default. `start:dev` reads local settings from an untracked `.env` file. Configure the endpoints and credentials needed for your development environment; common settings include:

- HMPPS Auth: `HMPPS_AUTH_URL`, `HMPPS_AUTH_EXTERNAL_URL`, `AUTH_CODE_CLIENT_ID`, `AUTH_CODE_CLIENT_SECRET`, `CLIENT_CREDS_CLIENT_ID`, and `CLIENT_CREDS_CLIENT_SECRET`.
- APIs and feature flags: `EMDI_API_URL`, `TOKEN_VERIFICATION_API_URL`, `TOKEN_VERIFICATION_ENABLED`, `COMPONENT_API_URL`, `FLIPT_URL`, and `FLIPT_NAMESPACE`.
- Maps: `OS_MAPS_API_KEY`, `OS_MAPS_API_SECRET`, and `GETMAPPING_WMTS_CAPABILITIES_URL`.

Application configuration and development defaults are primarily in `server/config.ts` and `server/app.ts`. Do not commit credentials or place production secrets in local files; production values are supplied through deployment configuration and secrets.

## Checks

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

`npm run typecheck` checks the server, browser code, and Playwright tests without emitting JavaScript. `npm run test` runs Jest locally; `npm run test:ci` runs it serially and writes CI reports.

### Browser and accessibility tests

The Playwright tests use WireMock on port 9091 and the test application on port 3007. In separate terminals:

```bash
docker compose -f docker-compose-test.yml up
npm run start-feature:dev
```

Install Chromium once with `npx playwright install chromium`, then run:

```bash
npm run test:browser
npm run test:browser-report
```

The browser suite covers the supported user journeys and includes axe accessibility checks. CI runs these checks as a gate.

## CI and release

The pipeline runs the shared Node build/lint and unit-test workflows, this repository's typecheck and WireMock/Playwright integration checks, and Helm lint for dev, preprod, and prod. Separate workflows retain code, dependency, and Veracode scans. Release image verification and release creation, promotion, retries, and rollbacks are documented in [Release management](docs/release-management.md).

The service security policy is [here](https://github.com/ministryofjustice/hmpps-electronic-monitoring-data-insights-ui/security/policy).
