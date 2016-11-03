import React from 'react'
import Modal from '../modal'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import {goto} from 'app/utils/store'
import store from 'app/utils/store'
const icon = require("../../../imgs/services.svg")
import {MarkdownPreview} from 'react-marked-markdown';
import {match_traits, get_service_data} from './utils'
import PluginScreen from 'app/components/plugin/screen'

import Empty from 'app/components/empty'
import Settings from 'app/containers/service/settings'


function serverboard_name(shortname){
  return (store.getState().serverboard.serverboards.find( (s) => s.shortname == shortname) || {}).name
}
function is_current_serverboard(shortname){
  return (store.getState().serverboard.current ==  shortname)
}

function DetailsTab(props){
  return (
    <div className="ui grid" style={{flexGrow:1, margin: 0}}>
      <div className="six wide column" style={{borderRight:"1px solid #ddd", paddingLeft: 20}}>
        <h3 className="ui header">Service Type</h3>
        {props.service_template.name}
        <h3 className="ui header">Description</h3>
        <MarkdownPreview className="ui meta" value={props.service_template.description}/>
        <h3 className="ui header">Used on Serverboards</h3>
        <div className="ui vertical secondary menu">
          {props.service.serverboards.map( (s) => (
            <div key={s} className={`item ${is_current_serverboard(s) ? "active" : ""}`} onClick={() => goto(`/serverboard/${s}/`)} style={{cursor: "pointer"}}>
              {s} - {serverboard_name(s)}
              <i className="ui chevron right icon"/>
            </div>
          ))}
        </div>
      </div>
      <div className="ten wide column">
        <h3 className="ui header">Description</h3>
        <MarkdownPreview className="ui meta" value={props.service.description || "No description set"}/>
        <h3 className="ui header">Config Details</h3>
        <div className="ui grid">
          {props.service_template.fields.map( (f) => (
            <div key={f.name} className="row">
              <label className="four wide column" style={{fontWeight:"bold"}}>{f.label || f.name}</label>
              <div className="twelve wide column">
                {props.service.config[f.name] ? (props.service.config[f.name].name || props.service.config[f.name]) : (
                  <div className="ui meta">{f.value || f.placeholder}</div>
                )}
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
  componentDidMount(){
    get_service_data( this.props.service.uuid ).then( (service) => {
      this.setState({service})
    })
  },
  render(){
    const props = this.props
    let current_tab = props.tab
    console.log(props)

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
            <a key={s.id} className={`item ${(s.id == current_tab) ? "active" : ""}`} onClick={() => goto(null, {tab: s.id})}>
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
