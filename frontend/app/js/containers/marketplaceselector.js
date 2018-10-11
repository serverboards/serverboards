import React from 'react'
import Loading from 'app/components/loading'
import Selector from 'app/components/selector'
import Flash from 'app/flash'
import cache from 'app/utils/cache'
import rpc from 'app/rpc'
import i18n from 'app/utils/i18n'
import plugin from 'app/utils/plugin'


function tag_by_price(component){
  const price = component.price
  const available = component.available
  if (!price){
    return {label: i18n("Free"), color: "light green"}
  }
  if (available)
    return {label: i18n("Available"), color: "blue"}
  const price_str = Number(price).toFixed(2)
  return {label: i18n("{price} € / month", {price: price_str}), color: "blue"}
}

class MarketplaceSelector extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      plugins: undefined,
      loading: true,
      installing: false
    }
  }
  loadPlugins(){
    let filter = {}
    if (this.props.type)
      filter.type = this.props.type
    console.log("Load plugins ", filter)
    return Promise.all([
      plugin.call(
        "serverboards.core.update/marketplace",
        "search",
        filter
      ), cache.plugins()]
    ).then( ([plugins, installed]) => {
      plugins = plugins.filter( c => !installed[c.id] ).map( p => {
        return {...p, tag: tag_by_price(p)}
      })
      return plugins
    })
  }
  installPlugin(pl){
    if (pl.price && !pl.available){
      const url = "https://serverboards.app/packages/" + pl.id
      console.log("Information on package at ", url)
      window.open(url, '_blank');
      Flash.info(i18n("A new tab has been opened with information on how to acquire the required plugin."))
      return
    }
    this.setState({installing: true})
    plugin.call(
      "serverboards.core.update/marketplace",
      "install",
      [pl.id]
    ).then( () => {
      this.setState({installing: false})
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
    if (state.installing){
      return (
        <Loading>{i18n("Installing...")}</Loading>
      )
    }

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
