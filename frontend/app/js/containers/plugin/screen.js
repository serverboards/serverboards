import connect from 'app/containers/connect'
import ExternalScreen from 'app/components/plugin/screen'
import {match_traits, map_get} from 'app/utils'
import {services_update_catalog} from 'app/actions/service'


const ScreenModel = connect({
  state: (state, props) => {
    const templates = state.services.catalog || {}
    let all_services = map_get(state, ["project", "project", "services"], [])

    if (templates == undefined){
      return {loading: true}
    }

    const plugin = props.plugin || props.match.params.plugin
    const component = props.component || props.match.params.component
    const screen_id = `${plugin}/${component}`
    const screen = state.menu.screens.find( s => s.id == screen_id ) || {traits: []}

    all_services = all_services.map( s => {
      const traits = map_get(templates, [s.type, "traits"], [])
      return {...s, traits}
    })

    let services = all_services.filter( s => match_traits({has: s.traits, any: screen.traits}) )

    let service = map_get(props, ["data", "service"])

    if (!service){
      service = services[0]
    }

    // Has traits, and none is global
    const require_service = (screen.traits.length > 0) && (screen.traits.indexOf('global') < 0)

    // console.log("PluginScreen services %o |> %o, service %o", all_services, services)
    // console.log(service)

    const show_menu = services.length > 0

    return {
      plugin,
      component,
      screen,
      services,
      service,
      show_menu,
      require_service,
      loading: false
    }
  },
  store_enter: [services_update_catalog],
  loading(state, props){
    return state.loading
  }
}) (ExternalScreen)

export default ScreenModel
