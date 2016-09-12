import React from 'react'
import HoldButton from '../holdbutton'

const ActionMenu=React.createClass({
  handleOpenSettings(){
    this.props.setModal("service.settings", {onAdd: this.handleAddService, onAttach: this.handleAttachService, service: this.props.service})
  },
  handleDetach(){
    this.props.onDetach( this.props.serverboard.shortname, this.props.service.uuid )
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
        this.props.setModal(ActionModal,{ action, params, missing_params })
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
  render(){
    const props=this.props
    return (
      <div className="ui vertical menu">
        {!props.service.is_virtual ? (
          <HoldButton className="item" onHoldClick={this.handleDetach}>Hold to Detach</HoldButton>
        ) : []}
        {props.service.fields ? (
          <div className="item" onClick={this.handleOpenSettings}>Settings<i className="ui icon settings"/></div>
        ) : []}
        {props.actions ? props.actions.map( (ac) => (
          <div className="item" onClick={() => this.triggerAction(ac.id)}>{ ac.extra.icon ? (<i className={`ui ${ac.extra.icon} icon`}/>) : []} {ac.name}</div>
        )) : (
          <div className="item disabled">
            Loading
          </div>
        ) }
      </div>
    )
  }
})

export default ActionMenu
