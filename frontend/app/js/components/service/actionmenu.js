import React from 'react'
import HoldButton from '../holdbutton'
import rpc from 'app/rpc'

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
    if (action.extra.call){
      const params = this.props.service.config

      let missing_params = action.extra.call.params.filter((p) => !(p.name in params))
      if (missing_params.length==0){
        rpc.call("action.trigger",
          [action_id, params]).then(function(){
          })
      }
      else{
        this.props.setModal("service.action",{ action, params, missing_params })
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
      <div className="ui dropdown" ref="dropdown" style={{minWidth: "4em"}}>
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
            <div className="item" onClick={() => this.triggerAction(ac.id)}>{ ac.extra.icon ? (<i className={`ui ${ac.extra.icon} icon`}/>) : []} {ac.name}</div>
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
