import React from 'react'
import Card from '../../containers/service/card'
import Loading from '../loading'
import AddServiceModal from '../../containers/serverboard/addservice'

let Services=React.createClass({
  handleAttachService : function(service){
    this.props.onAttachService(this.props.serverboard.shortname, service.uuid)
    this.setModal(false)
  },
  openAddServiceModal : function(ev){
    ev.preventDefault()
    this.setModal('add_service')
  },
  setModal: function(modal){
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: { modal }
    } )
  },
  closeModal : function(){
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  render(){
    let props=this.props
    if (!props.services)
      return (
        <Loading>Services</Loading>
      )
    let popup=[]
    switch(this.props.location.state && this.props.location.state.modal){
      case 'add_service':
        popup=(
          <AddServiceModal
            onAdd={this.handleAddService}
            onAttach={this.handleAttachService}
            onClose={this.closeModal}/>
        )
        break;
    }

    return (
      <div className="ui text container">
        <h1>Services at {props.serverboard.name}</h1>
        <div className="ui cards">
          {props.services.map((p) => (
            <Card key={p.id} service={p} serverboard={this.props.serverboard}/>
          ))}
        </div>

        <a href="#"
            onClick={this.openAddServiceModal}
            className="ui massive button _add icon floating blue"
            title="Add a service"
            >
          <i className="server icon"></i>
          <i className="corner add icon"></i>
        </a>
        {popup}
      </div>
    )
  }
})

export default Services
