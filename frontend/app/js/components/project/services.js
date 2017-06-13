import React from 'react'
import Loading from '../loading'
import AddServiceModal from 'app/containers/project/addservice'
import Command from 'app/utils/command'
import ServicesView from 'app/containers/service'
import ServiceDetails from 'app/containers/service/details'
import Restricted from 'app/restricted'
import { set_modal } from 'app/utils/store'
import i18n from 'app/utils/i18n'

function service_sort(a,b){
  return a.name.localeCompare( b.name )
}

let Services=React.createClass({
  getInitialState(){
    return {
      mode: localStorage.service_view_mode || "grid"
    }
  },
  setListMode(mode){
    localStorage.service_view_mode=mode
    this.setState({mode})
  },
  openAddServiceModal(ev){
    ev && ev.preventDefault()
    this.setModal('service.create', {project: this.props.project.shortname})
  },
  setModal: (modal, data) => set_modal(modal, data),
  contextTypes: {
    router: React.PropTypes.object
  },
  componentDidMount(){
    let self = this
    this.props.setSectionMenu(this.render_menu)
    Command.add_command_search("sbds-services", (Q, context) => ([
        {id: 'add-service', title: i18n("Add Service"), description: i18n("Add a new service"), run: () => self.openAddServiceModal()},
      ]), 2)
  },
  componentWillUnmount(){
    Command.remove_command_search("sbds-services")
  },
  service_description(tpe){
     const desc=this.props.service_catalog.find((d) => d.type == tpe)
     return desc
  },
  render_menu(){
    const state = this.state
    return (
      <div className="menu">
        <div className="item stretch"/>
        <div className="ui attached tabular menu">
          <a className={`${state.mode == "list" ? "active" : ""} item`} onClick={() => this.setListMode("list")}>
            <i className="ui icon list"/>
          </a>
          <a className={`${state.mode == "grid" ? "active" : ""} item`} onClick={() => this.setListMode("grid")}>
            <i className="ui icon grid layout"/>
          </a>
        </div>
      </div>
    )
  },
  render(){
    let props=this.props
    let state=this.state
    if (!props.services)
      return (
        <Loading>Services</Loading>
      )
    return (
      <div>
        <div style={{padding: 20}}>
          <ServicesView mode={state.mode} services={props.services.sort(service_sort)} project={this.props.project}/>
        </div>

        <Restricted perm="service.create">
          <a href="#"
              onClick={this.openAddServiceModal}
              className="ui massive button _add icon floating yellow"
              title={i18n("Add a service")}
              >
            <i className="add icon"></i>
          </a>
        </Restricted>
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
