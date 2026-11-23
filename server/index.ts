import createApp from './app'
import { services } from './services'

export const serviceInstances = services()
const app = createApp(serviceInstances)

export default app
