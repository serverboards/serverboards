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
    const locstate = props.location.state || {}
    const tab = locstate.tab || 'details'
    const type = locstate.type || ''
    return {
      tab,
      type,
    }
  },
  promises(prevprops, nextprops){
    const prevserviceid = prevprops.subsection
    const serviceid = nextprops.subsection || nextprops.routeParams.id
    if (prevserviceid == serviceid)
      return;
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
    "service", "service_template", "screens",
    (prevprops, nextprops) =>
      !prevprops || !object_is_equal(prevprops.location.state, nextprops.location.state)
  ]
},View)

export default Container
