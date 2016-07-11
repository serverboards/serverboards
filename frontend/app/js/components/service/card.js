import React from 'react'
import ImageIcon from '../imageicon'
import ServiceSettings from 'app/containers/service/settings'
import HoldButton from '../holdbutton'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import ActionModal from './actionmodal'

require("sass/service/card.sass")
const icon = require("../../../imgs/services.svg")

function Field(props){
  return (
    <li>{props.name}: <b>{props.value}</b></li>
  )
}

let Card=React.createClass({
  getInitialState(){
    return {
      actions: undefined,
      loading: false
    }
  },

  componentDidMount(){
    $(this.refs.dropdown)
      .dropdown({
        // you can use any ui transition
        transition: 'fade up',
        onShow: this.loadAvailableActions,
      })
    ;
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
      console.log(this.props.service)
      rpc.call("action.filter", {traits: this.props.service.traits}).then((actions) => {
        console.log("All actions %o",actions)
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
    console.log(action_id)
    let action=this.state.actions.filter( (a) => a.id == action_id )[0]
    // Discriminate depending on action type (by shape)
    if (action.extra.call){
      console.log(action)
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
    }

    return (
      <div className="service card">
        <div className="content">
          <div className="right floated">
            <ImageIcon src={icon}  name={props.name}/>
          </div>
          <div className="header">{props.name}</div>
          <div className="meta">{(props.serverboards || []).join(' ')}</div>
          <div className="description">{props.description || "No description yet"}</div>
          <ul>
          {(Object.keys(props.config || {})).map((k) => (
            <Field key={k} name={k} value={props.config[k]}/>
          ))}
          </ul>
        </div>
        <div className="extra content">
          <div className="ui inverted yellow menu bottom attached">
            <div className="ui right item" style={{marginRight: 10}}>
              <div ref="dropdown" className={`ui dropdown`}>
                Options
                <i className="ui dropdown icon"/>
                <div className="menu">
                  <HoldButton className="ui item" onHoldClick={this.handleDetach}>Hold to Detach</HoldButton>
                  <div className="ui item" onClick={this.handleOpenSettings}>Settings</div>
                  {this.state.actions ? this.state.actions.map( (ac) => (
                    <div className="ui item" onClick={() => this.triggerAction(ac.id)}>{ac.name}</div>
                  )) : (
                    <div className="ui item disabled">
                      Loading
                    </div>
                  ) }
                </div>
              </div>
            </div>
          </div>
        </div>
        {popup}
      </div>
    )
  }
})

export default Card