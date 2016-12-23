import ServicesView from 'app/components/serverboard/services'
import event from 'app/utils/event'
import { service_add, services_update_catalog } from 'app/actions/service'

var Services = event.subscribe_connect(
  (state) => ({
    services: state.serverboard.serverboard.services,
    location: state.routing.locationBeforeTransitions,
    service_catalog: state.serverboard.catalog || []
  }),
  (dispatch) => ({
  }),
  ["service.updated","serverboards.updated"]
)(ServicesView)

export default Services
