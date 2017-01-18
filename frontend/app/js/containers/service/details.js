import View from 'app/components/service/details'
import store from 'app/utils/store'
import rpc from 'app/rpc'
import cache from 'app/utils/cache'
import { object_is_equal } from 'app/utils'

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
    return {
      tab,
      type,
    }
  },
  promises(props){
    const serviceid = props.subsection || props.routeParams.id
    const service = rpc.call("service.info", [serviceid])
    const service_template = Promise.all([service, cache.service_catalog()])
      .then(
        ([service, catalog]) => {
          console.log("Find %o at %o", service, catalog)
          return catalog.find( (s) => s.type == service.type ) || { name: service.type }
      })
    const screens = service.then( service => get_screens( service ) )
    return {service, service_template, screens}
  },
  watch: [
    "service", "service_template", "screens", "tab", "type"
  ]
},View)

export default Container
