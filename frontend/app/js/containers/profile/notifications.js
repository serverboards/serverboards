import React from 'react'
import NotificationsView from 'app/components/profile/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {Loading} from 'app/components'
import i18n from 'app/utils/i18n'
import store from 'app/utils/store'
import cache from 'app/utils/cache'
import {map_get} from 'app/utils'

class NotificationsModel extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      channels: undefined,
      config: undefined,
      loading: true
    }
  }
  componentDidMount(){
    const email = store.getState().auth.user.email
    // console.log("Get channels for %o", email)
    Promise.all([
        cache.plugin_component({type: "notification"}),
        rpc.call("notifications.config.get", [email])
    ]).then(([channels, config]) => {
      // I transform to a simple config with the is_active value
      if (!config){
        config = {}
      }
      else{
        let cf = {}
        for (const c in config){
          cf[c] = {...map_get(config, [c, "config"], {}), is_active: !!map_get(config, [c, "is_active"], false)}
        }
        config = cf
      }
      this.setState({channels, config, loading: false})
    })
  }
  handleUpdate(id, nconfig){
    let config = {...this.state.config}
    config[id] = nconfig
    this.setState({config})
    this.props.onUpdate(config)
  }
  render(){
    if (this.state.loading){
      return (
        <Loading>{i18n("Notification channels")}</Loading>
      )
    }
    return (
      <NotificationsView
        channels={this.state.channels}
        config={this.state.config}
        onUpdate={this.handleUpdate.bind(this)}
      />
    )
  }
}

export default NotificationsModel
