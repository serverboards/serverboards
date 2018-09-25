import React from 'react'
import Loading from 'app/components/loading'
import Selector from 'app/components/selector'
import Flash from 'app/flash'
import cache from 'app/utils/cache'
import rpc from 'app/rpc'
import plugin from 'app/utils/plugin'


class MarketplaceSelector extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      plugins: undefined,
      loading: true
    }
  }
  loadPlugins(){
    console.log("Load plugins ", {type: this.props.type})
    return Promise.all([
      plugin.call(
        "serverboards.optional.update/marketplace",
        "search",
        {type: this.props.type}
      ), cache.plugins()]
    ).then( ([plugins, installed]) => {
      plugins = plugins.filter( c => !installed[c.id] )
      return plugins
    })
  }
  installPlugin(pl){
    plugin.call(
      "serverboards.optional.update/marketplace",
      "install",
      [pl.id]
    ).then( () => {
      if (this.props.afterInstall){
        cache.invalidate_all()
        rpc.call("plugin.reload", [])
           .then( cache.plugins )
           .then( plugins => {
          console.log("Current plugins are ", plugins, pl.id, plugins[pl.id])

          const plugin = plugins[pl.id]
          const component = Object.values(plugin.components || {}).find( c => c.type == this.props.type )
          const component_id = `${plugin.id}/${component.id}`
          cache.service_type(component_id).then(this.props.afterInstall)
        })
      }
    }).catch(Flash.error)
  }
  render(){
    const state = this.state

    return (
      <Selector
        get_items={this.loadPlugins.bind(this)}
        onSelect={this.installPlugin.bind(this)}
        {...this.props}
        />
    )
  }
}

export default MarketplaceSelector
