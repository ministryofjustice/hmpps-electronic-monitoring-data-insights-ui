import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import '@ministryofjustice/hmpps-electronic-monitoring-components/map'
import initialiseLocationDataView from './views/cases/index'

govukFrontend.initAll()
mojFrontend.initAll()

initialiseLocationDataView()
