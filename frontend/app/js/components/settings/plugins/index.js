import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import PluginDetails from './details'
import plugin from 'app/utils/plugin'
import {merge} from 'app/utils'
import event from 'app/utils/event'
import i18n from 'app/utils/i18n'

require('sass/cards.sass')
import PluginCard from './card'

const Plugins=React.createClass({
  getInitialState(){
    return { plugins: [] }
  },
  componentDidMount(){
    rpc.call("plugin.catalog",[]).then((pluginsd)=>{
      let plugins=[]
      for (let k in pluginsd){
        plugins.push(pluginsd[k])
      }
      plugins = plugins.sort( function(a,b){ return (a.name || "").localeCompare(b.name || "") })
      this.setState({plugins})
    }).catch((e) => {
      Flash.error(`Could not load plugin list.\n ${e}`)
    }).then( () => {
      event.on("plugin.update.required", this.updateRequired)
      return rpc.call("action.trigger", ["serverboards.optional.update/check_plugin_updates", {}])
    } )
  },
  componentWillUnmount(){
    event.off("plugin.update.required", this.updateRequired)
  },
  updateRequired({plugin_id, changelog}){
    const plugins = this.state.plugins.map( (pl) => {
      if (pl.id==plugin_id)
        return merge(pl, {changelog: changelog, status: pl.status.concat("updatable")})
      else
        return pl
    })
    this.setState({plugins})
  },
  handleSetActive(plugin_id, is_active){
    rpc
      .call("settings.update", ["plugins", plugin_id, is_active])
      .then( () => this.componentDidMount() )
  },
  setModal(modal, data){
    let state
    if (data){
      state={ modal, service: this.props.service, data }
    }
    else{
      state={ modal, service: this.props.service }
    }
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: state
    } )
  },
  closeModal(){
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  handleInstallPlugin(){
    const plugin_url=this.refs.plugin_url.value
    if (!plugin_url){
      Flash.error(i18n("Please set a valid URL"))
      return;
    }
    rpc.call("plugin.install", [plugin_url]).then( () => {
      Flash.info(i18n("Plugin from {plugin_url} installed and ready.",{plugin_url}))
      this.componentDidMount() // reload plugin list
    }).catch( (e) => {
      Flash.error(e)
      this.componentDidMount() // reload plugin list
    })
  },
  render(){
    const plugins=this.state.plugins
    let popup=[]
    let modal = (
      this.props.location.state &&
      this.props.location.state.modal
    )
    switch(modal){
      case "details":
      popup=(
        <PluginDetails {...this.props.location.state.data} setActive={this.handleSetActive} updateAll={() => this.componentDidMount()}/>
      )
      break;
    }

    return (
      <div className="ui vertical split area">
        <div className="ui top secondary menu">
          <h3 className="ui header">{i18n("Plugins")}</h3>
          <div className="item">
            <div className="ui form">
              <div className="inline fields" style={{marginBottom: 0}}>
                <div className="field">
                  <input ref="plugin_url" type="text" style={{width: "30em"}} placeholder={i18n("Enter plugin git repository URL")}/>
                </div>
                <div className="field">
                  <button className="ui button yellow" onClick={this.handleInstallPlugin}>{i18n("Install")}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="item stretch"/>
          <div className="item">
            <a
                className="ui teal medium button"
                href="https://serverboards.io/downloads/plugins/"
                target="_blank"
                data-tooltip={i18n("View the full plugin list at https://serverboards.io")}
                data-position="bottom right"
                style={{fontSize: 14}}
                >
              {i18n("Get Plugins")}
            </a>
          </div>
        </div>

        <div className="expand with scroll and padding">
          <div className="ui container">
            <div className="ui cards">
              {plugins.map((p) => (
                <PluginCard key={p.id} plugin={p} onOpenDetails={() => {this.setModal('details',{plugin: p})}}/>
              ))}
            </div>
          </div>
          {popup}
        </div>
      </div>
    )
  }
})

export default Plugins
