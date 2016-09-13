import React from 'react'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import Command from 'app/utils/command'
import {colorize} from 'app/utils'
import ActionMenu from 'app/containers/service/actionmenu'

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
        <ActionMenu service={props.service} actions={props.actions}/>
      </div>
    </div>
  )
}

const VirtualBottomMenu=React.createClass({
  getInitialState(){
    return {actions: undefined}
  },
  loadAvailableActions(){
    if (!this.state.actions){
      this.setState({loading: true})
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
  render(){
    const props=this.props
    const state=this.state
    if (!props.actions){
      return (
        <div className="item disabled">
          <i className="ui wait icon"/>
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
          <a className="item" onClick={() => props.triggerAction(ac.id)}>
            <i className={`ui ${ac.extra.icon} icon`} title={ac.name}/>
          </a>
        ) ) }
        <div className="right menu">
          <a className="ui item dropdown" ref="dropdown">
            <i className="ui ellipsis vertical icon"/>
            <ActionMenu service={props.service} actions={state.actions}/>
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
  show_config(k){
    var fields = (this.props.service_description || {}).fields || []
    for(var p of fields){
      if (p.name==k){
        return p
      }
    }
    return undefined;
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
        <div className="content">
          <div className="right floated">
            {props.icon ? (
              <IconIcon src={icon} icon={props.icon} plugin={props.type.split('/',1)[0]}/>
            ) : (
              <ImageIcon src={icon}  name={props.name}/>
            )}
          </div>
          <div className="header">{props.name}</div>
          <div className="meta">{(props.tags || []).map( (l) => (
            <span style={{color:"#ccc"}}><span className={`ui circular empty ${colorize(l)} label`}/> {l}</span>
          ))}</div>
          <div className="description">{props.description || ""}</div>
          <div>
          {(Object.keys(props.config || {})).map((k) => this.show_config(k) ? (
            <Field key={k} name={k} value={props.config[k]} description={this.get_field(k)}/>
          ) : [])}
          </div>
        </div>
        <div className="extra content" ref="menu">
          {props.is_virtual ? (
            <VirtualBottomMenu
              actions={this.state.actions}
              service={props}
              setModal={this.props.setModal}
              />
          ) : (
            <RealBottomMenu
              service={props}
              setModal={this.props.setModal}
              />
          )}
        </div>
      </div>
    )
  }
})

export default Card
