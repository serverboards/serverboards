import React from 'react'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import ServiceSettings from 'app/containers/service/settings'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import ActionModal from './actionmodal'
import Command from 'app/utils/command'
import VirtualServices from './virtual'
import {colorize} from 'app/utils'
import ActionMenu from './actionmenu'

require("sass/service/card.sass")
const icon = require("../../../imgs/services.svg")

function Field(props){
  return (
    <li>{props.name}: <b>{props.value}</b></li>
  )
}


function RealBottomMenu(props){
  return (
    <div className="ui inverted yellow menu bottom attached">
      {props.service.virtual ? (
        <a className="item" onClick={() => props.setModal('virtual', {service: props.service})}>Related services <i className="ui icon caret right"/></a>
      ) : []}
      <div className="right menu">
        <div className="ui item dropdown">
          More
          <i className="ui dropdown icon"/>
          <ActionMenu service={props.service} actions={props.actions}/>
        </div>
      </div>
    </div>
  )
}

const VirtualBottomMenu=React.createClass({
  componentDidMount(){
    $(this.refs.dropdown).dropdown()
  },
  componentDidUpdate(){
    $(this.refs.dropdown).dropdown() // Ensure has working dropdown
  },
  render(){
    const props=this.props
    if (!props.actions){
      return (
        <div className="item disabled">
          <i className="ui wait icon"/>
          Loading
        </div>
      )
    }

    const maxicons=4
    const head = props.actions.slice(0, maxicons)
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
            <ActionMenu service={props.service} actions={props.actions}/>
          </a>
        </div>
      </div>
    )
  }
})

const Card=React.createClass({
  getInitialState(){
    return {
      actions: undefined,
      loading: false
    }
  },

  componentDidMount(){
    if (this.props.service.is_virtual){
      this.loadAvailableActions()
    }
    else{
      let dropdown=$(this.refs.menu).find('.ui.dropdown')
      dropdown.dropdown({
          // you can use any ui transition
          transition: 'fade up',
          onShow: this.loadAvailableActions,
        })
      let self=this
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

  loadAvailableActions(){
    if (!this.state.actions){
      this.setState({loading: true})
      rpc.call("action.filter", {traits: this.props.service.traits}).then((actions) => {
        this.setState({
          actions: actions,
          loading: false
        })
      }).catch(() => {
        Flash.error("Could not load actions for this service")
        this.setState({
          actions: undefined,
          loading: false
        })
      })
    }
    return true;
  },

  triggerAction(action_id){
    let action=this.state.actions.filter( (a) => a.id == action_id )[0]
    // Discriminate depending on action type (by shape)
    if (action.extra.call){
      const params = this.props.service.config

      let missing_params = action.extra.call.params.filter((p) => !(p.name in params))
      if (missing_params.length==0){
        rpc.call("action.trigger",
          [action_id, params]).then(function(){
          })
      }
      else{
        this.setModal("action",{ action, params, missing_params })
      }
    }
    else if (action.extra.screen){
      this.context.router.push({
        pathname: `/s/${action.id}`,
        state: { service: this.props.service }
      })
    }
    else {
      Flash.error("Dont know how to trigger this action")
    }
  },

  handleOpenSettings(){
    this.setModal("settings")
  },
  handleDetach(){
    this.props.onDetach( this.props.serverboard.shortname, this.props.service.uuid )
  },
  show_config(k){
    var fields = (this.props.service_description || {}).fields || []
    for(var p of fields){
      if (p.name==k){
        if(p.card)
          return true;
        return false;
      }
    }
    return false;
  },
  render(){
    let props=this.props.service
    let popup=[]
    let current_modal = (
      this.props.location.state &&
      (this.props.location.state.service == this.props.service) &&
      this.props.location.state.modal
    )
    switch(current_modal){
      case 'settings':
        popup=(
          <ServiceSettings
            onAdd={this.handleAddService}
            onAttach={this.handleAttachService}
            onClose={this.closeModal}
            service={props}
            />
        )
        break;
      case 'action':
        popup=(
          <ActionModal {...this.props.location.state.data}/>
        )
        break;
      case 'virtual':
        popup=(
          <VirtualServices serverboards={this.props.serverboards} parent={props} location={this.props.location}/>
        )
        break;
    }
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
          <ul>
          {(Object.keys(props.config || {})).map((k) => this.show_config(k) ? (
            <Field key={k} name={k} value={props.config[k]}/>
          ) : [])}
          </ul>
        </div>
        <div className="extra content" ref="menu">
          {props.is_virtual ? (
            <VirtualBottomMenu
              actions={this.state.actions}
              triggerAction={this.triggerAction}
              service={props}
              />
          ) : (
            <RealBottomMenu
              actions={this.state.actions}
              setModal={this.setModal}
              handleDetach={this.handleDetach}
              handleOpenSettings={this.handleOpenSettings}
              triggerAction={this.triggerAction}
              service={props}
              />
          )}
        </div>
        {popup}
      </div>
    )
  }
})

export default Card
