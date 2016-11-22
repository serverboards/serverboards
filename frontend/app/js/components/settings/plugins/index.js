import React from 'react'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import PluginDetails from './details'

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
      plugins = plugins.sort( function(a,b){ return a.name.localeCompare(b.name) })
      this.setState({plugins})
    }).catch((e) => {
      Flash.error(`Could not load plugin list.\n ${e}`)
    })
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
      Flash.error("Please set a valid URL")
      return;
    }
    rpc.call("plugin.install", [plugin_url]).then( () => {
      this.componentDidMount() // reload plugin list
    }).catch( (e) => Flash.error(e) )
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
        <PluginDetails {...this.props.location.state.data} setActive={this.handleSetActive}/>
      )
      break;
    }

    return (
      <div>
        <div className="ui top secondary header menu">
          <h3 className="ui header">Plugins</h3>
          <div className="right menu">
            <div className="item">
              <div className="ui form">
                <div className="inline fields">
                  <div className="field">
                    <input ref="plugin_url" type="text" style={{width: "30em"}} placeholder="Enter plugin git repository URL"/>
                  </div>
                  <div className="field">
                    <button className="ui button yellow" onClick={this.handleInstallPlugin}>Install</button>
                  </div>
                </div>
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
