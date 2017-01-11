import ServicesView from 'app/components/serverboard/services'
import event from 'app/utils/event'

var Services = event.subscribe_connect(
  (state) => ({
    services: state.serverboard.serverboard.services,
    location: state.routing.locationBeforeTransitions,
    service_catalog: state.services.catalog || []
  }),
  (dispatch) => ({
  }),
  ["service.updated","serverboards.updated"]
)(ServicesView)

export default Services
