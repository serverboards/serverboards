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
import PropTypes from 'prop-types'
import {SectionMenu} from 'app/components'

require('sass/cards.sass')
import PluginCard from './card'

class Plugins extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      plugins: [],
      settings: {}
    }
    this.reload_plugin_list = this.reload_plugin_list.bind(this)
    this.updated = this.updated.bind(this)
    this.updateRequired = this.updateRequired.bind(this)
  }
  componentDidMount(){
    event.on("plugin.update.required", this.updateRequired)
    event.on("plugin.updated", this.updated)
    event.on("plugins.reloaded", this.reload_plugin_list)
    this.load_plugin_list()
  }
  load_plugin_list(){
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
  }
  reload_plugin_list(){
    cache.invalidate("plugins") // ensure invalidated. May happen later too. Needed at the cache side too.
    this.load_plugin_list()
  }
  componentWillUnmount(){
    event.off("plugin.update.required", this.updateRequired)
    event.off("plugin.updated", this.updateRequired)
    event.off("plugins.reloaded", this.reload_plugin_list)
  }
  updateRequired({plugin_id, changelog}){
    console.log("Update required: %o; %o", plugin_id, changelog)
    const plugins = this.state.plugins.map( (pl) => {
      if (pl.id==plugin_id)
        return merge(pl, {changelog: changelog, status: pl.status.concat("updatable")})
      else
        return pl
    })
    this.setState({plugins})
  }
  updated({plugin_id}){
    cache.invalidate("plugins")
    const plugins = this.state.plugins.map( (pl) => {
      if (pl.id==plugin_id)
        return merge(pl, {changelog: null, status: pl.status.filter( t => t!="updatable") })
      else
        return pl
    })
    this.setState({plugins})
  }
  render(){
    const plugins=this.state.plugins
    const settings=this.state.settings

    return (
      <React.Fragment>
        <SectionMenu menu={(props) => (
          <React.Fragment>
            <div className="item stretch"/>
            <div className="item">
              <a
                  className="ui teal medium button"
                  onClick={() => goto('/settings/plugins/add')}
                  >
                {i18n("Marketplace")}
              </a>
            </div>
          </React.Fragment>
        )}/>

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
      </React.Fragment>
    )
  }
}

Plugins.contextTypes = {
  router: PropTypes.object
}


export default Plugins
