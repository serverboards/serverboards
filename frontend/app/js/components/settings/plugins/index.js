import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import PluginDetails from './details'
import plugin from 'app/utils/plugin'
import {merge} from 'app/utils'
import event from 'app/utils/event'
import i18n from 'app/utils/i18n'
import {set_modal, goto} from 'app/utils/store'
import store from 'app/utils/store'
import cache from 'app/utils/cache'

require('sass/cards.sass')
import PluginCard from './card'

const Plugins=React.createClass({
  getInitialState(){
    return {
      plugins: [],
      settings: {}
    }
  },
  componentDidMount(){
    event.on("plugin.update.required", this.updateRequired)
    event.on("plugin.updated", this.updated)
    cache.plugins().then((pluginsd)=>{
      let plugins=[]
      for (let k in pluginsd){
        plugins.push(pluginsd[k])
      }
      plugins = plugins.sort( function(a,b){ return (a.name || "").localeCompare(b.name || "") })
      this.setState({plugins})
    }).catch((e) => {
      Flash.error(`Could not load plugin list.\n ${e}`)
    }).then( () => {
      // do not launch more times. May miss some updates needed.
      if (!store.getState().action.actions.some( i => i.id=="serverboards.optional.update/check_plugin_updates" ))
        return rpc.call("action.trigger", ["serverboards.optional.update/check_plugin_updates", {}])
    } )
    rpc.call("plugin.component.catalog", {type: "settings"})
      .then( formlist => {
        let settings = {}
        for (let f of formlist){
          settings[f.plugin]=(settings[f.plugin] || []).concat(f)
        }
        this.setState({settings})
      })
  },
  componentWillUnmount(){
    event.off("plugin.update.required", this.updateRequired)
    event.off("plugin.updated", this.updateRequired)
  },
  updateRequired({plugin_id, changelog}){
    console.log("Update required: %o; %o", plugin_id, changelog)
    const plugins = this.state.plugins.map( (pl) => {
      if (pl.id==plugin_id)
        return merge(pl, {changelog: changelog, status: pl.status.concat("updatable")})
      else
        return pl
    })
    this.setState({plugins})
  },
  updated({plugin_id}){
    const plugins = this.state.plugins.map( (pl) => {
      if (pl.id==plugin_id)
        return merge(pl, {changelog: null, status: pl.status.filter( t => t!="updatable") })
      else
        return pl
    })
    this.setState({plugins})
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  render(){
    const plugins=this.state.plugins
    const settings=this.state.settings

    return (
      <div className="ui vertical split area">
        <div className="ui top secondary menu">
          <h3 className="ui header">{i18n("Plugins")}</h3>
          <div className="item stretch"/>
          <div className="item">
            <a
                className="ui teal medium button"
                onClick={() => goto('/settings/plugins/add')}
                >
              {i18n("Marketplace")}
            </a>
          </div>
        </div>

        <div className="expand with scroll and padding">
          <div className="ui container">
            <div className="ui cards">
              {plugins.map((p) => (
                <PluginCard
                  key={p.id}
                  plugin={p}
                  onOpenDetails={() => {set_modal('plugin.details',{plugin: p})}}
                  onOpenSettings={settings[p.id] ? (
                    () => set_modal('plugin.settings',{plugin: p, settings: settings[p.id] })
                  ) : null }
                  />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
})

export default Plugins
