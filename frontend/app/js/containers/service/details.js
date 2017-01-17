import View from 'app/components/service/details'
import event from 'app/utils/event'
import {
    services_update_catalog,
    clear_external_url_components,
    update_external_url_components,
    services_update_all
  } from 'app/actions/service'

var Container = event.subscribe_connect(
  (state, props) => {
    const serviceid = props.subsection || props.routeParams.id
    const service = state.services.services.find( (s) => s.uuid == serviceid )
    const service_template = (state.services.catalog || []).find( (s) => s.type == service.type ) || { name: service.type }
    const locstate = props.location.state || {}
    const tab = locstate.tab || 'details'
    const type = locstate.type || ''
    return {
      service,
      service_template,
      tab,
      type,
      external_urls: state.serverboard.external_urls,
      screens: (props.serverboards || {}).screens || []
    }
  },
  (dispatch) => ({}),
  [],
  (props) => [
    services_update_catalog,
    clear_external_url_components,
    services_update_all,
    () => update_external_url_components(props.service.traits)
  ]
)(View)

export default Container
