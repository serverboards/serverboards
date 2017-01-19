import ServicesView from 'app/components/serverboard/services'
import connect from 'app/containers/connect'

var Services = connect({
  state: (state) => ({
    services: state.serverboard.serverboard.services,
    location: state.routing.locationBeforeTransitions,
    service_catalog: state.services.catalog || []
  }),
  subcriptions: ["service.updated", "serverboards.updated"]
})(ServicesView)

export default Services
