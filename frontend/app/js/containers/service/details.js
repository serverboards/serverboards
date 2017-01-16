import View from 'app/components/service/details'
import event from 'app/utils/event'
import {
    services_update_catalog,
    clear_external_url_components,
    update_external_url_components
  } from 'app/actions/service'

var Container = event.subscribe_connect(
  (state, props) => {
    const service = state.serverboard.serverboard.services.find( (s) => s.uuid == props.subsection )
    const service_template = (state.services.catalog || []).find( (s) => s.type == service.type ) || { name: service.type }
    const tab = props.location.state.tab || 'details'
    const type = props.location.state.type || ''
    return {
      service,
      service_template,
      tab,
      type,
      external_urls: state.serverboard.external_urls
    }
  },
  (dispatch) => ({}),
  [],
  (props) => [
    services_update_catalog,
    clear_external_url_components,
    () => update_external_url_components(props.service.traits)
  ]
)(View)

export default Container
