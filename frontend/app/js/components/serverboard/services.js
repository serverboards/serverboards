import React from 'react'
import Loading from '../loading'
import AddServiceModal from 'app/containers/serverboard/addservice'
import Command from 'app/utils/command'
import ServicesView from 'app/containers/service'

let Services=React.createClass({
  handleAttachService(service){
    this.props.onAttachService(this.props.serverboard.shortname, service.uuid)
    this.setModal(false)
  },
  handleAddService(service){
    this.props.onAddService(this.props.serverboard.shortname, service)
    this.setModal(false)
  },
  openAddServiceModal(ev){
    ev && ev.preventDefault()
    this.setModal('add_service')
  },
  setModal(modal){
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: { modal }
    } )
  },
  closeModal(){
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  componentDidMount(){
    let self = this
    Command.add_command_search("sbds-services", (Q, context) => ([
        {id: 'add-service', title: "Add Service", description: `Add a new service`, run: () => self.openAddServiceModal()},
      ]), 2)
  },
  componentWillUnmount(){
    Command.remove_command_search("sbds-services")
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
      <div className="ui container">
        <h1>Services at {props.serverboard.name}</h1>
        <ServicesView services={props.services} serverboard={this.props.serverboard}/>

        <a href="#"
            onClick={this.openAddServiceModal}
            className="ui massive button _add icon floating blue"
            title="Add a service"
            >
          <i className="add icon"></i>
        </a>
        {popup}
        <div className="ui fixed bottom">
          <a href={`#/serverboard/${props.serverboard.shortname}/services`}
          className="ui header medium link">
          View all services <i className="ui icon angle right"/>
          </a>
        </div>
      </div>
    )
  }
})

export default Services
