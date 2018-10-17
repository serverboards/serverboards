import React from 'react'
import i18n from 'app/utils/i18n'
import View from 'app/components/settings/marketplace'
import plugin from 'app/utils/plugin'
import cache from 'app/utils/cache'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import {Loading} from 'app/components'
import event from 'app/utils/event'

class MarketplaceModel extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      plugins: undefined,
      reload_key: 1,
      installing: false
    }
    this.reload = this.reload.bind(this)
  }
  componentDidMount(){
    event.on("plugins.reloaded", this.reload)
  }
  componentWillUnmount(){
    event.off("plugins.reloaded", this.reload)
  }
  get_plugins(){
    return Promise.all([
        plugin
          .start_call_stop("serverboards.core.update/catalog", "plugin_catalog")
        , cache.plugins()
      ]).then( (cp) => {
        const catalog = cp[0]
        const plugin_list = cp[1]

        console.log("Got catalog %o // %o", catalog, plugin_list)
        return catalog.filter( c => !plugin_list[c.id] )
      })

    return plugin
      .start_call_stop("serverboards.core.update/catalog", "plugin_catalog")
  }
  handleInstallPlugin(plugin_url){
    if (!plugin_url){
      Flash.error(i18n("Please set a valid URL"))
      return;
    }
    this.setState({installing: plugin_url})
    plugin.call(
      "serverboards.core.update/marketplace",
      "install",
      [plugin_url]
    ).then( () => {
      Flash.info(i18n("Plugin from {plugin_url} installed and ready.",{plugin_url}))
      this.setState({installing: false})
      this.reload()
    }).catch( (e) => {
      Flash.error(e)
      this.setState({installing: false})
      this.reload()
    })
  }
  reload(){
    cache.invalidate_all()
    this.setState({reload_key: this.state.reload_key+1})
  }
  render(){
    if (this.state.installing)
      return (
        <Loading>
          {i18n("Installing plugin from {plugin_url}", {plugin_url: this.state.installing})}
        </Loading>
      )
    if (this.state.loading)
      return (
        <Loading>{i18n("Widget descriptions")}</Loading>
      )
    return (
      <View
        key={this.state.reload_key}
        {...this.state}
        {...this.props}
        get_items={this.get_plugins.bind(this)}
        onInstallPlugin={this.handleInstallPlugin.bind(this)}
        />
    )
  }
}

export default MarketplaceModel
