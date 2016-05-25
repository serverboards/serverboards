import React from 'react'
import LogoIcon from '../logoicon'
import ServiceSettings from '../../containers/service/settings'
import HoldButton from '../holdbutton'

require("../../../sass/service/card.sass")

function Field(props){
  return (
    <li>{props.name}: <b>{props.value}</b></li>
  )
}

let Card=React.createClass({
  componentDidMount(){
    $(this.refs.dropdown)
      .dropdown({
        // you can use any ui transition
        transition: 'fade up'
      })
    ;
  },
  setModal(modal){
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: { modal, service: this.props.service }
    } )
  },
  closeModal(){
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
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
    }

    return (
      <div className="service card">
        <div className="content">
          <div className="right floated"><LogoIcon name={props.name}/></div>
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
          <div className="ui text menu">
            <div ref="dropdown" className="ui dropdown right item button">
              Options
              <i className="ui dropdown icon"/>
              <div className="menu">
                <HoldButton className="ui item" onClick={this.handleDetach}>Hold to Detach</HoldButton>
                <div className="ui item" onClick={this.handleOpenSettings}>Settings</div>
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
