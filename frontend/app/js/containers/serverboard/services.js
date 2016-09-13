import ServicesView from 'app/components/serverboard/services'
import event from 'app/utils/event'
import { serverboard_attach_service } from 'app/actions/serverboard'
import { service_add, services_update_catalog } from 'app/actions/service'

var Services = event.subscribe_connect(
  (state) => ({
    services: state.serverboard.serverboard.services,
    location: state.routing.locationBeforeTransitions,
    service_catalog: state.serverboard.catalog || []
  }),
  (dispatch) => ({
    onAttachService: (a,b) => dispatch( serverboard_attach_service(a,b) ),
    onAddService: (a,b) => dispatch( service_add(a,b) ),
  }),
  ["service.updated","serverboards.updated"]
)(ServicesView)

export default Services
