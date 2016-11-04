import React from 'react'
import Modal from '../../modal'
import ImageIcon from '../../imageicon'
import IconIcon from '../../iconicon'
import {goto} from 'app/utils/store'
import store from 'app/utils/store'
const icon = require("../../../../imgs/services.svg")
import {match_traits, get_service_data} from '../utils'
import PluginScreen from 'app/components/plugin/screen'

import Empty from 'app/components/empty'
import Settings from 'app/containers/service/settings'
import DetailsTab from './detailstab'

const tab_options={
  details: DetailsTab,
  settings: Settings
}
function get_plugin_component(current_tab){
  if (current_tab.indexOf('/')>=0){
    let sp=current_tab.split('/')
    return (props) => (
      <PluginScreen data={{service: props.service, serverboard: props.serverboard}} plugin={sp[0]} component={sp[1]}/>
    )
  }
  return null
}

const Details = React.createClass({
  getInitialState(){
    return { service: this.props.service }
  },
  handleTabChange(id){
    // Changes the state.service, to require deep info(plugins) or shallow (settings)
    let self=this
    if (id.indexOf('/')>=0){
      get_service_data(this.props.service.uuid).then( (service) => {
        //console.log("Got deep service: %o", service)
        self.setState({service})
        goto(null, {tab: id})
      })
    }
    else{
      //console.log("Set shallow service: %o", this.props.service)
      self.setState({service: this.props.service})
      goto(null, {tab: id})
    }
  },
  componentDidMount(){
    this.handleTabChange(this.props.tab)
  },
  render(){
    const props = this.props
    let current_tab = props.tab

    let sections=[
      { name: "Details", id: "details" },
      { name: "Settings", id: "settings" },
    ]
    props.serverboard.screens.map( (s) => {
      if (match_traits(s.traits, props.service.traits)){
        sections.push({
          name: s.name,
          id: s.id
        })
      }
    })
    let CurrentTab = tab_options[current_tab] || get_plugin_component(current_tab) || Empty

    const handleClose = () => goto(`/serverboard/${props.serverboard.shortname}/services`)

    return (
      <Modal className="wide" onClose={handleClose}>
        <div className="ui top secondary pointing menu" style={{paddingBottom: 0}}>
          {props.service.icon ? (
            <IconIcon src={icon} icon={props.service.icon} plugin={props.service.type.split('/',1)[0]}/>
          ) : (
            <ImageIcon src={icon}  name={props.service.name}/>
          )}

          <div style={{display: "inline-block"}}>
            <h3 className="ui header" style={{paddingRight: 50, marginBottom: 0}}>{props.service.name}</h3>
            <span className="ui meta">{props.service_template.name}</span>
          </div>
          {sections.map( (s) => (
            <a key={s.id} className={`item ${(s.id == current_tab) ? "active" : ""}`} onClick={() => this.handleTabChange(s.id)}>
              {s.name}
            </a>
          ))}
        </div>
        <div className="ui full height">
          <CurrentTab {...props} service={this.state.service} onClose={handleClose} />
        </div>
      </Modal>
    )
  }
})

export default Details
