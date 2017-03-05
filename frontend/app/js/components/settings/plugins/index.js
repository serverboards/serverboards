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
    rpc.call("plugin.list",[]).then((pluginsd)=>{
      let plugins=[]
      for (let k in pluginsd){
        plugins.push(pluginsd[k])
      }
      plugins = plugins.sort( function(a,b){ return (a.name || "").localeCompare(b.name || "") })
      this.setState({plugins})
    }).catch((e) => {
      Flash.error(`Could not load plugin list.\n ${e}`)
    }).then( () =>
      plugin.start_call_stop("serverboards.optional.update/updater","check_plugin_updates",[])
    ).then( (msg) => {
      event.on("plugin.update.required", this.updateRequired)
      Flash.log(msg)
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
    console.log("Require update: %o", plugins)
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
      <div>
        <div className="ui top secondary header menu">
          <h3 className="ui header">{i18n("Plugins")}</h3>
          <div className="right menu">
            <div className="item">
              <div className="ui form">
                <div className="inline fields">
                  <div className="field">
                    <input ref="plugin_url" type="text" style={{width: "30em"}} placeholder={i18n("Enter plugin git repository URL")}/>
                  </div>
                  <div className="field">
                    <button className="ui button yellow" onClick={this.handleInstallPlugin}>{i18n("Install")}</button>
                  </div>
                </div>
                <div style={{marginTop: -10}}>{i18n("View full plugin list at")} <a href="https://serverboards.io/downloads/plugins/" target="_blank">{i18n("Serverboards.io Plugin List page.")}</a></div>
              </div>
            </div>
          </div>
        </div>

        <div className="ui container">
          <div className="ui cards">
            {plugins.map((p) => (
              <PluginCard key={p.id} plugin={p} onOpenDetails={() => {this.setModal('details',{plugin: p})}}/>
            ))}
          </div>
          {popup}
        </div>
      </div>
    )
  }
})

export default Plugins
