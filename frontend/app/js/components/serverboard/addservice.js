import React from 'react'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import Loading from '../loading'
import Modal from '../modal'
import { set_modal, goto } from 'app/utils/store'

const icon = require("../../../imgs/services.svg")

let AddService=React.createClass({
  getInitialState(){
    return {
      tab: "new"
    }
  },
  componentDidMount(){
    if (!this.props.catalog){
      this.props.updateServiceCatalog()
    }
    if (!this.props.all_services){
      this.props.updateAllServiceCatalog()
    }
  },
  handleAdd(ev, service){
    ev.preventDefault(ev)

    if (service.uuid){
      // Service is a plain services, need to have the fields field
      let current_service=Object.assign({}, this.props.catalog.find((c) => c.type == service.type))
      // set fields values
      current_service.uuid=service.uuid
      current_service.name=service.name
      service.config.name=service.name
      service.config.description=service.description
      current_service.fields.map( (f) => {
        f.value=service.config[f.name]
      })

      this.props.onAttachService(this.props.serverboard, current_service.uuid)
      set_modal(false)
      goto(`/services/${current_service.uuid}`)
    }
    else{
      let current_service=Object.assign({}, this.props.catalog.find((c) => c.type == service.type))

      current_service.id=undefined

      this.props.onAddService(this.props.serverboard, current_service).then( (uuid) => {
        set_modal(false)
        goto(`/services/${uuid}`)
      })
    }
  },
  setTab(tab){
    this.setState({tab})
  },
  render(){
    let props=this.props
    if (!this.props.catalog || !this.props.all_services){
      return (
        <Loading>
          Getting available service list
        </Loading>
      )
    }


    let self=this

    function WrappedService(props){
      return (
        <div key={props.uuid || props.type} className="column center aligned">
          <a onClick={(ev) => self.handleAdd(ev, props)}  className="ui button invisible">
            {props.icon ? (
              <IconIcon src={icon} icon={props.icon} plugin={props.type.split('/',1)[0]}/>
            ) : (
              <ImageIcon src={icon}  name={props.name}/>
            )}
            <div className="ui header small" style={{marginTop: 0}}>{props.name}</div>
          </a>
        </div>
      )
    }

    let services
    let desc
    //if (this.state.tab=="new"){ // default
      services=props.catalog
      desc="Add a new service to this serverboard"
    //}
    if (this.state.tab=="existing"){
      services=props.all_services
      desc="Add an existing service from another serverboard into this one. This service will be shared between the serverboards."
    }

    return (
      <Modal onClose={props.onClose} className="wide">
        <div className="ui top secondary pointing menu">
          <h3 className="ui header">
            Add a service
          </h3>
          <div className="ui tabs secondary pointing menu">
            <a
              className={`item ${this.state.tab=="new" ? "active" : ""}`}
              onClick={() => this.setTab("new")}>
                New services
            </a>
            <a
              className={`item ${this.state.tab=="existing" ? "active" : ""}`}
              onClick={() => this.setTab("existing")}>
                Existing services
            </a>
          </div>
        </div>
        <div className="ui text container">
          <h4 className="ui header" style={{paddingTop:30}}>{desc}</h4>
          <div className="ui five column grid stackable svg">
            {services.map((c) => WrappedService(c))}
          </div>
        </div>
      </Modal>
    )
  }
})

export default AddService
