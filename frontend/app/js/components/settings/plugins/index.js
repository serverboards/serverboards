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
      <div className="ui container">
        <h1 className="ui header">Plugins</h1>

        <div className="ui cards">
          {plugins.map((p) => (
            <PluginCard key={p.id} plugin={p} onOpenDetails={() => {this.setModal('details',{plugin: p})}}/>
          ))}
        </div>
        {popup}
      </div>
    )
  }
})

export default Plugins
