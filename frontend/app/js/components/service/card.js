import React from 'react'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import Command from 'app/utils/command'
import {colorize} from 'app/utils'
import ActionMenu from 'app/containers/service/actionmenu'
import {MarkdownPreview} from 'react-marked-markdown';
import {trigger_action} from './action'
import {goto} from 'app/utils/store'

require("sass/service/card.sass")
const icon = require("../../../imgs/services.svg")

const ServiceField=React.createClass({
  getInitialState(){
    return {service: undefined}
  },
  componentDidMount(){
    rpc.call("service.info", [this.props.value]).then( (service) => {
      this.setState({service: service.name})
    })
  },
  render(){
    if (this.state.service)
      return (
        <span className="ui meta">{this.props.description.label}: {this.state.service}<br/></span>
      )
    else
      return (
        <span/>
      )
  }
})

function Field(props){
  if (props.description.type=='service')
    return (
      <ServiceField {...props}/>
    )
  return (
    <span className="ui meta">{props.description.label}: {props.value}<br/></span>
  )
}


function RealBottomMenu(props){
  function open_virtual(){
    props.setModal("service.virtual", {parent: props.service})
  }
  return (
    <div className="ui inverted yellow menu bottom attached">
      {props.service.virtual ? (
        <a className="item" onClick={open_virtual}>Related services <i className="ui icon caret right"/></a>
      ) : []}
      <div className="right menu">
        <div className="item">
          <ActionMenu service={props.service} actions={props.actions} onDetach={props.onDetach}>
            Menu
          </ActionMenu>
        </div>
      </div>
    </div>
  )
}

const VirtualBottomMenu=React.createClass({
  getInitialState(){
    return {actions: undefined}
  },
  loadAvailableActions(){
    if (this.state.actions == undefined){
      rpc.call("action.filter", {traits: this.props.service.traits}).then((actions) => {
        this.setState({
          actions: actions,
        })
      }).catch(() => {
        Flash.error("Could not load actions for this service")
        this.setState({
          actions: undefined,
        })
      })
    }
    return true;
  },
  componentDidMount(){
    this.loadAvailableActions()
  },
  triggerAction(action_id){
    let action=this.state.actions.filter( (a) => a.id == action_id )[0]
    // Discriminate depending on action type (by shape)
    trigger_action(action, this.props.service)
  },
  render(){
    const props=this.props
    const state=this.state
    if (state.actions == undefined){
      return (
        <div className="item disabled">
          <i className="ui spinner loading icon"/>
          Loading
        </div>
      )
    }

    const maxicons=4
    const head = state.actions.slice(0, maxicons)
    //const tail = props.actions.slice(maxicons)
    return (
      <div className="ui menu bottom attached">
        { head.map( (ac) => (
          <a key={ac.id} className="item" onClick={() => this.triggerAction(ac.id)}>
            <i className={`ui ${ac.extra.icon} icon`} title={ac.name}/>
          </a>
        ) ) }
        <div className="right menu">
          <a className="ui item dropdown" ref="dropdown">
            <ActionMenu service={props.service} actions={state.actions}>
              <i className="ui ellipsis vertical icon"/>
            </ActionMenu>
          </a>
        </div>
      </div>
    )
  }
})

const Card=React.createClass({
  componentDidMount(){
    if (!this.props.service.is_virtual){
      let s = this.props.service
      Command.add_command_search(`service-${s.uuid}`, (Q, context) => [
        {id: `service-settings-${s.uuid}`, title: `${s.name} settings`,
         description: `Modify ${s.name} service settings`, run: () => self.handleOpenSettings()},
        {id: `service-more-${s.uuid}`, title: `${s.name} more actions`,
         description: `Show ${s.name} more actions menu`, run: () => dropdown.dropdown('show').focus()},
      ],2 )
    }
  },
  componentWillUnmount(){
    Command.remove_command_search(`service-${this.props.service.uuid}`)
  },
  handleDetach(){
    this.props.onDetach( this.props.serverboard.shortname, this.props.service.uuid )
  },
  show_config(k){
    var fields = (this.props.service_description || {}).fields || []
    for(var p of fields){
      if (p.name==k){
        return p
      }
    }
    return undefined;
  },
  handleOpenDetails(){
    goto(`/serverboard/${this.props.serverboard.shortname}/services/${this.props.service.uuid}`)
  },
  get_field(k){
    var fields = (this.props.service_description || {}).fields
    if (!fields)
      return undefined
    for(var p of fields){
      if (p.name==k){
        return p
      }
    }
    return undefined;
  },
  show_config(k){
    var field = this.get_field(k)
    if (!field)
      return false
    return field.card ? true : false
  },
  render(){
    let props=this.props.service
    return (
      <div className="service card">
        <div className="extra content">
          {(props.tags || []).map( (l) => (
            <span key={l} style={{color:"#ccc", paddingLeft:10}}><span className={`ui circular empty ${colorize(l)} label`}/> {l}</span>
          ))}&nbsp;
        </div>

        <div className="content" style={{cursor: "pointer"}} onClick={this.handleOpenDetails}>
          <div className="right floated">
            {props.icon ? (
              <IconIcon src={icon} icon={props.icon} plugin={props.type.split('/',1)[0]}/>
            ) : (
              <ImageIcon src={icon}  name={props.name}/>
            )}
          </div>
          <div className="header">{props.name}</div>
          <div className="description" style={{display:"inline-block"}}><MarkdownPreview value={props.description || ""}/></div>
          <div style={{clear:"both"}}>
          {(Object.keys(props.config || {})).map((k) => this.show_config(k) ? (
            <Field key={k} name={k} value={props.config[k]} description={this.get_field(k)}/>
          ) : [])}
          </div>
        </div>
        <div className="extra content" ref="menu">
          {props.is_virtual ? (
            <VirtualBottomMenu
              service={props}
              setModal={this.props.setModal}
              />
          ) : (
            <RealBottomMenu
              service={props}
              setModal={this.props.setModal}
              onDetach={this.handleDetach}
              />
          )}
        </div>
      </div>
    )
  }
})

export default Card
