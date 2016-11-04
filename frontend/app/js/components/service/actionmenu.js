import React from 'react'
import HoldButton from '../holdbutton'
import rpc from 'app/rpc'
import {trigger_action} from './action'

const ActionMenu=React.createClass({
  contextTypes: {
    router: React.PropTypes.object // Needed for plugin screens
  },
  getInitialState(){
    return {
      actions: undefined
    }
  },
  handleOpenSettings(){
    this.props.setModal("service.settings", {onAdd: this.handleAddService, onAttach: this.handleAttachService, service: this.props.service})
  },
  triggerAction(action_id){
    let action=this.state.actions.filter( (a) => a.id == action_id )[0]
    // Discriminate depending on action type (by shape)
    trigger_action(action, this.props.service)
  },
  loadAvailableActions(){
    if (!this.state.actions){
      rpc.call("action.filter", {traits: this.props.service.traits}).then((actions) => {
        this.setState({ actions })
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
    $(this.refs.dropdown).dropdown({
      onShow: this.loadAvailableActions,
    })
  },
  render(){
    const props=this.props
    const state=this.state
    return (
      <div className="ui dropdown" ref="dropdown" style={{minWidth: "4em"}} onClick={ (ev) => ev.stopPropagation() }>
        {props.children}
        <i className="ui dropdown icon"/>
        <div className="ui vertical menu">
          {!props.service.is_virtual ? (
            <HoldButton className="item" onHoldClick={this.props.onDetach}>Hold to Detach</HoldButton>
          ) : []}
          {props.service.fields ? (
            <div className="item" onClick={this.handleOpenSettings}><i className="ui icon settings"/> Settings</div>
          ) : []}
          {state.actions ? state.actions.map( (ac) => (
            <div key={ac.id} className="item" onClick={() => this.triggerAction(ac.id)}>{ ac.extra.icon ? (<i className={`ui ${ac.extra.icon} icon`}/>) : []} {ac.name}</div>
          )) : (
            <div className="item disabled">
              Loading
            </div>
          ) }
        </div>
      </div>
    )
  }
})

export default ActionMenu
