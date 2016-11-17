import React from 'react'
import Loading from '../loading'
import AddServiceModal from 'app/containers/serverboard/addservice'
import Command from 'app/utils/command'
import ServicesView from 'app/containers/service'
import ServiceDetails from 'app/containers/service/details'

function service_sort(a,b){
  return a.name.localeCompare( b.name )
}

let Services=React.createClass({
  getInitialState(){
    return {
      mode: localStorage.service_view_mode || "grid"
    }
  },
  handleAttachService(service){
    this.props.onAttachService(this.props.serverboard.shortname, service.uuid)
    this.setModal(false)
  },
  handleAddService(service){
    this.props.onAddService(this.props.serverboard.shortname, service)
    this.setModal(false)
  },
  setListMode(mode){
    localStorage.service_view_mode=mode
    this.setState({mode})
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
  service_description(tpe){
     const desc=this.props.service_catalog.find((d) => d.type == tpe)
     return desc
  },
  render(){
    let props=this.props
    let state=this.state
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
      <div>
        <div className="ui top secondary header menu">
          <div className="right menu">
            <div className="ui secondary pointing menu">
              <a className={`${state.mode == "list" ? "active" : ""} item`} onClick={() => this.setListMode("list")}>
                <i className="ui icon list"/>
              </a>
              <a className={`${state.mode == "grid" ? "active" : ""} item`} onClick={() => this.setListMode("grid")}>
                <i className="ui icon grid layout"/>
              </a>
            </div>
          </div>
        </div>
        <div style={{padding: 20}}>
          <ServicesView mode={state.mode} services={props.services.sort(service_sort)} serverboard={this.props.serverboard}/>
        </div>

        <div className="ui container">
          <a href="#"
              onClick={this.openAddServiceModal}
              className="ui massive button _add icon floating yellow"
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
      </div>
    )
  }
})

function ServicesSection(props){
  if (props.subsection){
    return (
      <ServiceDetails {...props}/>
    )
  }
  return (
    <Services {...props}/>
  )
}

export default ServicesSection
