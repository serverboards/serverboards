import React from 'react'
import View from 'app/components/service/details'
import {Loading} from 'app/components'
import connect from 'app/containers/connect'
import rpc from 'app/rpc'
import cache from 'app/utils/cache'
import { object_is_equal, match_traits, map_get } from 'app/utils'
import {
  service_load_current,
  services_update_catalog,
  service_clear_external_url_components,
  } from 'app/actions/service'
import i18n from 'app/utils/i18n'

// I need to layer it as the external url require the service traits
class DetailsWithScreensAndUrls extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      screens: undefined,
      external_urls: undefined,
    }
  }
  componentDidMount(){
    const service_traits = map_get(this.props, ["service", "traits"], [])
    cache.plugin_component({type: "screen"}).then( screens => screens.filter(
      s => s.traits.length>0 && match_traits({has: service_traits, any: s.traits})
    )).then( screens => this.setState({screens}) )
    cache.plugin_component({type: "external url"}).then( external_urls => external_urls.filter(
      s => s.traits.length>0 && match_traits({has: service_traits, any: s.traits})
    )).then( external_urls => this.setState({external_urls}) )
  }
  render(){
    const {screens, external_urls} = this.state

    if (!screens || !external_urls)
      return (
        <Loading>{i18n("Service details")}</Loading>
      )
    return (
      <View {...this.props} screens={screens} external_urls={external_urls}/>
    )
  }
}

const Container = connect({
  state(state, props){
    const locstate = state.router.location.pathname.state || {}
    let service, template
    let current = state.services.current
    if (current){
      service=props.service || current.service
      template = current.template
    }
    return {
      service,
      template,
    }
  },
  subscriptions(state, props){
    const serviceid = (props.service && props.service.uuid) || props.subsection || (props.routeParams && props.routeParams.id)
    return [`service.updated[${serviceid}]`]
  },
  store_enter(state, props){
    const serviceid = (props.service && props.service.uuid) || props.subsection || (props.routeParams && props.routeParams.id)
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
    state = this.state(state, props) // Get next component props, no need to generate again
    if (state.service == 'error')
      return false;
    if (state.template == 'error')
      return false;

    if (state.service && state.template)
      return false;
    return i18n("Service details")
  }
})(DetailsWithScreensAndUrls)

export default Container
