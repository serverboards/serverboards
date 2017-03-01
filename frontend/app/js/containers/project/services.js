import ServicesView from 'app/components/project/services'
import connect from 'app/containers/connect'

var Services = connect({
  state: (state) => ({
    services: state.project.project.services,
    location: state.routing.locationBeforeTransitions,
    service_catalog: state.services.catalog || []
  }),
  subcriptions: ["service.updated", "projects.updated"]
})(ServicesView)

export default Services
