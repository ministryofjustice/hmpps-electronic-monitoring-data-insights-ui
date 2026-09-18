import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import initialiseLocationDataView from './views/cases/index'
import './utils/appInsights'
import { initialiseTechnicalUpdatesBanner } from './utils/technicalUpdatesBanner'

govukFrontend.initAll()

const main = document.querySelector('main')
if (main) {
  mojFrontend.initAll({ scope: main })
}

if (document.querySelector('.location-activity')) {
  initialiseLocationDataView()
}
document.addEventListener('DOMContentLoaded', () => {
  initialiseTechnicalUpdatesBanner()
})
