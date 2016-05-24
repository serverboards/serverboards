import ServicesView from '../../components/serverboard/services'
import event from '../../utils/event'
import { serverboard_reload_services, serverboard_attach_service } from '../../actions/serverboard'

var Services = event.subscribe_connect(
  (state) => ({
    services: state.serverboard.current_services,
    location: state.routing.locationBeforeTransitions
  }),
  (dispatch) => ({
    onAttachService: (a,b) => dispatch( serverboard_attach_service(a,b) ),
  }),
  ["service.updated","serverboards.updated"],
  (props) => [() => (serverboard_reload_services(props.serverboard.shortname))]
)(ServicesView)

export default Services
