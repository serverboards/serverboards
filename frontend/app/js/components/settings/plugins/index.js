import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import PluginDetails from './details'
import plugin from 'app/utils/plugin'
import {merge, object_list_to_map} from 'app/utils'
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
      updates: {},
      settings: {}
    }
    this.reload_plugin_list = this.reload_plugin_list.bind(this)
  }
  componentDidMount(){
    event.on("plugins.reloaded", this.reload_plugin_list)
    this.load_plugin_list()
  }
  load_plugin_list(){
    cache.plugins().then( pluginsd => {
      let plugins = Object.values(pluginsd)
      plugins = plugins.sort( (a,b) => (a.name || "").localeCompare(b.name || "") )
      this.setState({plugins})
    }).catch((e) => {
      Flash.error(`Could not load plugin list.\n ${e}`)
    })

    plugin.call("serverboards.optional.update/marketplace", "check_updates", [])
      .then( orig => {
        let updates = {}
        for (let o of orig){
          updates[o.id] = o.updated
        }
        this.setState({updates})
      })

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
    event.off("plugins.reloaded", this.reload_plugin_list)
  }
  handleUpdate(id){
    plugin.call("serverboards.optional.update/marketplace", "update", [id])
      .then( () => {
        this.reload_plugin_list.bind(this)
        Flash.success(i18n("Plugin updated successfully."))
      })
      .catch( Flash.error )
  }
  render(){
    const {plugins, settings, updates} = this.state

    return (
      <div className="expand with scroll and padding">
        <div className="ui container">
          <div className="ui cards">
            {plugins.map((p) => (
              <PluginCard
                key={p.id}
                plugin={{...p, updated: updates[p.id]}}
                onUpdate={() => this.handleUpdate(p.id)}
                onOpenDetails={() => {set_modal('plugin.details',{plugin: p})}}
                onOpenSettings={settings[p.id] ? (
                  () => set_modal('plugin.settings',{plugin: p, settings: settings[p.id] })
                ) : null }
                />
            ))}
          </div>
        </div>
      </div>
    )
  }
}

Plugins.contextTypes = {
  router: PropTypes.object
}


export default Plugins
