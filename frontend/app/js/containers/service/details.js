import View from 'app/components/service/details'
import store from 'app/utils/store'
import rpc from 'app/rpc'
import cache from 'app/utils/cache'
import { object_is_equal } from 'app/utils'
import {service_load_current, services_update_catalog} from 'app/actions/service'

function get_screens( service ){
  if (!service)
    return []
  return rpc.call("plugin.list_components", {type: "screen", traits: service.traits})
}

var Container = store.connect({
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
      loading: !(service && screens && service_template && true)
    }
  },
  subscriptions(props){
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
  store_exit(state, props){
    return [
      service_load_current(undefined),
    ]
  }
},View)

export default Container
