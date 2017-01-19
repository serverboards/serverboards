import View from 'app/components/service/details'
import connect from 'app/containers/connect'
import rpc from 'app/rpc'
import cache from 'app/utils/cache'
import { object_is_equal } from 'app/utils'
import {
  service_load_current,
  services_update_catalog,
  service_clear_external_url_components,
  service_load_external_url_components,
  } from 'app/actions/service'

function get_screens( service ){
  if (!service)
    return []
  return rpc.call("plugin.list_components", {type: "screen", traits: service.traits})
}

// I need to layer it as the external url require the service traits
var DetailsWithExternalUrls = connect({
  state(state){
    if (state.services){
      return {external_urls: state.services.current.external_urls}
    }
    return {external_urls: undefined}
  },
  store_enter(state, props){
    return [ () =>
      service_load_external_url_components(props.service.traits)
    ]
  },
  store_exit: [
    service_clear_external_url_components
  ],
  loading(state){
    if (this.state(state).external_urls == undefined)
      return "External screens"
    return false
  }
})(View)

var Container = connect({
  state(state, props){
    const locstate = state.routing.locationBeforeTransitions.state || {}
    const tab = locstate.tab || 'details'
    const type = locstate.type || ''
    let service, screens, service_template
    if (state.services.current){
      service=state.services.current.service
      screens=state.services.current.screens
      service_template = state.services.current.template
    }
    return {
      tab,
      type,
      service,
      screens,
      service_template,
    }
  },
  subscriptions(state, props){
    const serviceid = props.subsection || props.routeParams.id
    return [`service.updated[${serviceid}]`]
  },
  store_enter(state, props){
    const serviceid = props.subsection || props.routeParams.id
    let updates = [
      () => service_load_current(serviceid),
    ]
    if (!state.services.catalog)
      updates.push( services_update_catalog )
    return updates
  },
  store_exit: [
      service_load_current
  ],
  loading(state, props){
    console.log(this)
    state = this.state(state, props) // Get next component props, no need to generate again
    if (state.service && state.screens && state.service_template)
      return false;
    return "Service details"
  }
})(DetailsWithExternalUrls)

export default Container
